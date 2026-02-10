import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi, productsApi } from '@/lib/stockshipApi';
import { Search, Plus, Edit, Trash2, Eye, CheckCircle, XCircle, Filter, Download, Upload, FileDown } from 'lucide-react';
import { motion } from 'framer-motion';
import showToast from '@/lib/toast';

// Helper function to get full image URL
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // If it's already a full URL (http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a data URL (base64), return as is
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // If it starts with /uploads, add the API base URL
  if (imageUrl.startsWith('/uploads')) {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return `${API_URL}${imageUrl}`;
  }
  
  // Otherwise, assume it's a relative path and add /uploads
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return `${API_URL}/uploads/${imageUrl}`;
};

// Product Image Component with error handling
const ProductImage = ({ image, alt, className = "w-16 h-16" }) => {
  const [imageError, setImageError] = useState(false);
  
  // Check if image URL is invalid or from placeholder
  const rawImageUrl = image?.imageUrl || image || '';
  const imageUrl = getImageUrl(rawImageUrl);
  const isInvalidUrl = !imageUrl || 
                       typeof rawImageUrl !== 'string' ||
                       rawImageUrl.includes('via.placeholder.com') || 
                       rawImageUrl.includes('placeholder.com') ||
                       rawImageUrl.includes('placeholder') ||
                       imageError;
  
  // Don't render image tag if URL is invalid
  if (isInvalidUrl) {
    return (
      <div className={`${className} bg-gray-200 rounded-lg border flex items-center justify-center text-gray-400 text-xs`}>
        No Image
      </div>
    );
  }
  
  return (
    <img
      src={imageUrl}
      alt={image?.altText || alt || 'Product image'}
      className={`${className} object-cover rounded-lg border`}
      crossOrigin="anonymous"
      onError={() => setImageError(true)}
      onLoad={() => setImageError(false)}
    />
  );
};

const AdminProducts = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [formData, setFormData] = useState({
    // Basic fields
    nameKey: '',
    nameAr: '',
    nameEn: '',
    descriptionKey: '',
    descriptionAr: '',
    descriptionEn: '',
    sku: '',
    price: '',
    quantity: '',
    quantityPerCarton: '',
    cbm: '',
    minStockLevel: '',
    categoryId: '',
    vendorId: '',
    country: '',
    city: '',
    acceptsNegotiation: false,
    isFeatured: false,
    status: 'PENDING_APPROVAL',
    // SEO fields
    metaTitleKey: '',
    metaTitleAr: '',
    metaTitleEn: '',
    metaDescriptionKey: '',
    metaDescriptionAr: '',
    metaDescriptionEn: '',
    metaKeywords: '',
    slug: '',
    canonicalUrl: '',
    ogTitleKey: '',
    ogTitleAr: '',
    ogTitleEn: '',
    ogDescriptionKey: '',
    ogDescriptionAr: '',
    ogDescriptionEn: '',
    ogImage: '',
    twitterCardTitleKey: '',
    twitterCardTitleAr: '',
    twitterCardTitleEn: '',
    twitterCardDescriptionKey: '',
    twitterCardDescriptionAr: '',
    twitterCardDescriptionEn: '',
    twitterCardImage: '',
    structuredData: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchVendors();
  }, [pagination.page, statusFilter, categoryFilter, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { categoryId: categoryFilter }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await adminApi.getProducts(params);
      const data = response.data.data || response.data;
      setProducts(Array.isArray(data) ? data : []);
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminApi.getCategories();
      const data = response.data.data || response.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await adminApi.getVendors();
      const data = response.data.data || response.data;
      setVendors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchProductDetails = async (id) => {
    try {
      const response = await adminApi.getProduct(id);
      setSelectedProduct(response.data.data || response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching product details:', error);
      showToast.error('Failed to fetch product details', error.response?.data?.message || 'Please try again');
    }
  };

  const handleCreate = () => {
    navigate('/stockship/admin/products/create');
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = {
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { categoryId: categoryFilter })
      };
      
      const response = await productsApi.exportProducts(params);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast.success('Export completed', 'Products exported successfully');
    } catch (error) {
      console.error('Error exporting products:', error);
      showToast.error('Export failed', error.response?.data?.message || 'Please try again');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setExporting(true);
      const response = await productsApi.downloadTemplate();
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'products-template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast.success('Template downloaded', 'CSV template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      showToast.error('Download failed', error.response?.data?.message || 'Please try again');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      showToast.error('No file selected', 'Please select a CSV file to import');
      return;
    }

    try {
      setImporting(true);
      const response = await productsApi.importProducts(importFile);
      const result = response.data.data || response.data;
      
      showToast.success(
        'Import completed', 
        `Successfully imported ${result.success} products. ${result.failed} failed.`
      );
      
      setShowImportModal(false);
      setImportFile(null);
      fetchProducts();
    } catch (error) {
      console.error('Error importing products:', error);
      const errorData = error.response?.data?.data || error.response?.data;
      if (errorData?.errors && errorData.errors.length > 0) {
        showToast.error(
          'Import completed with errors', 
          `${errorData.success || 0} succeeded, ${errorData.failed || 0} failed. Check console for details.`
        );
        console.log('Import errors:', errorData.errors);
      } else {
        showToast.error('Import failed', error.response?.data?.message || 'Please try again');
      }
    } finally {
      setImporting(false);
    }
  };

  const handleEdit = (product) => {
    navigate(`/stockship/admin/products/${product.id}/edit`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        quantityPerCarton: formData.quantityPerCarton ? parseInt(formData.quantityPerCarton) : null,
        cbm: formData.cbm ? parseFloat(formData.cbm) : null,
        minStockLevel: formData.minStockLevel ? parseInt(formData.minStockLevel) : null,
        categoryId: parseInt(formData.categoryId),
        vendorId: parseInt(formData.vendorId)
      };

      if (selectedProduct) {
        await adminApi.updateProduct(selectedProduct.id, data);
        showToast.success('Product updated successfully', 'The product has been updated');
      } else {
        await adminApi.createProduct(data);
        showToast.success('Product created successfully', 'New product has been created');
      }
      setShowModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      showToast.error('Failed to save product', error.response?.data?.message || 'Please try again');
    }
  };

  const handleDelete = (id) => {
    navigate(`/stockship/admin/products/${id}/delete`);
  };

  const handleApprove = async (id) => {
    try {
      await adminApi.approveProduct(id);
      showToast.success('Product approved', 'The product has been approved successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error approving product:', error);
      showToast.error('Failed to approve product', error.response?.data?.message || 'Please try again');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Please enter rejection reason:');
    if (!reason) return;
    try {
      await adminApi.rejectProduct(id, reason);
      showToast.success('Product rejected', 'The product has been rejected');
      fetchProducts();
    } catch (error) {
      console.error('Error rejecting product:', error);
      showToast.error('Failed to reject product', error.response?.data?.message || 'Please try again');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      AVAILABLE: 'bg-blue-100 text-blue-800',
      OUT_OF_STOCK: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace(/_/g, ' ') || 'Unknown'}
      </span>
    );
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold">Products Management</h1>
          <p className="text-muted-foreground mt-2">Manage all platform products</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadTemplate}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            Download Template
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </motion.button>
        </div>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Status</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="AVAILABLE">Available</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nameKey || `Category ${cat.id}`}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setCategoryFilter('');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products List ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Image</th>
                    <th className="text-left p-4">ID</th>
                    <th className="text-left p-4">Name/SKU</th>
                    <th className="text-left p-4">Category</th>
                    <th className="text-left p-4">Vendor</th>
                    <th className="text-left p-4">Price</th>
                    <th className="text-left p-4">Quantity</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <ProductImage 
                          image={product.images && product.images.length > 0 ? product.images[0] : null}
                          alt={product.nameKey || 'Product image'}
                        />
                      </td>
                      <td className="p-4">{product.id}</td>
                      <td className="p-4">
                        <div>
                          <div className="font-semibold">{product.nameKey || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{product.sku}</div>
                        </div>
                      </td>
                      <td className="p-4">{product.category?.nameKey || 'N/A'}</td>
                      <td className="p-4">{product.vendor?.companyName || 'N/A'}</td>
                      <td className="p-4">{product.price ? `${product.price} SAR` : 'N/A'}</td>
                      <td className="p-4">{product.quantity || 0}</td>
                      <td className="p-4">{getStatusBadge(product.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/stockship/admin/products/${product.id}/view`)}
                            className="p-2 hover:bg-gray-100 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 hover:bg-blue-100 rounded text-blue-600"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {product.status === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => handleApprove(product.id)}
                                className="p-2 hover:bg-green-100 rounded text-green-600"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(product.id)}
                                className="p-2 hover:bg-red-100 rounded text-red-600"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 hover:bg-red-100 rounded text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {selectedProduct ? 'Edit Product' : 'Create Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name Key *</label>
                  <input
                    type="text"
                    value={formData.nameKey}
                    onChange={(e) => setFormData({ ...formData, nameKey: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SKU *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity *</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nameKey || `Category ${cat.id}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vendor *</label>
                  <select
                    value={formData.vendorId}
                    onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>{vendor.companyName || vendor.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country *</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity Per Carton</label>
                  <input
                    type="number"
                    value={formData.quantityPerCarton}
                    onChange={(e) => setFormData({ ...formData, quantityPerCarton: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CBM</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.cbm}
                    onChange={(e) => setFormData({ ...formData, cbm: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min Stock Level</label>
                  <input
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="PENDING_APPROVAL">Pending Approval</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                  </select>
                </div>
              </div>
              {/* Translation Fields */}
              <div className="col-span-2 border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Product Name (Translation)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name (Arabic) *</label>
                    <input
                      type="text"
                      value={formData.nameAr}
                      onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="اسم المنتج بالعربية"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Name (English) *</label>
                    <input
                      type="text"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Product Name in English"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <h3 className="text-lg font-semibold mb-3">Product Description (Translation)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Description (Arabic)</label>
                    <textarea
                      value={formData.descriptionAr}
                      onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="3"
                      placeholder="وصف المنتج بالعربية"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description (English)</label>
                    <textarea
                      value={formData.descriptionEn}
                      onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="3"
                      placeholder="Product Description in English"
                    />
                  </div>
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="acceptsNegotiation"
                    checked={formData.acceptsNegotiation}
                    onChange={(e) => setFormData({ ...formData, acceptsNegotiation: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="acceptsNegotiation" className="text-sm">Accepts Negotiation</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isFeatured" className="text-sm">Featured Product</label>
                </div>
              </div>
              {/* SEO Fields */}
              <div className="col-span-2 border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">SEO Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Meta Title (Arabic)</label>
                    <input
                      type="text"
                      value={formData.metaTitleAr}
                      onChange={(e) => setFormData({ ...formData, metaTitleAr: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="عنوان SEO بالعربية"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Meta Title (English)</label>
                    <input
                      type="text"
                      value={formData.metaTitleEn}
                      onChange={(e) => setFormData({ ...formData, metaTitleEn: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="SEO Title in English"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Meta Description (Arabic)</label>
                    <textarea
                      value={formData.metaDescriptionAr}
                      onChange={(e) => setFormData({ ...formData, metaDescriptionAr: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="2"
                      placeholder="وصف SEO بالعربية"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Meta Description (English)</label>
                    <textarea
                      value={formData.metaDescriptionEn}
                      onChange={(e) => setFormData({ ...formData, metaDescriptionEn: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="2"
                      placeholder="SEO Description in English"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Meta Keywords</label>
                    <input
                      type="text"
                      value={formData.metaKeywords}
                      onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="product-slug"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Canonical URL</label>
                    <input
                      type="url"
                      value={formData.canonicalUrl}
                      onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="https://example.com/product"
                    />
                  </div>
                </div>
              </div>
              {/* Open Graph Fields */}
              <div className="col-span-2 border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Open Graph (Social Sharing)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">OG Title (Arabic)</label>
                    <input
                      type="text"
                      value={formData.ogTitleAr}
                      onChange={(e) => setFormData({ ...formData, ogTitleAr: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="عنوان المشاركة بالعربية"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">OG Title (English)</label>
                    <input
                      type="text"
                      value={formData.ogTitleEn}
                      onChange={(e) => setFormData({ ...formData, ogTitleEn: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Social Sharing Title in English"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">OG Description (Arabic)</label>
                    <textarea
                      value={formData.ogDescriptionAr}
                      onChange={(e) => setFormData({ ...formData, ogDescriptionAr: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="2"
                      placeholder="وصف المشاركة بالعربية"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">OG Description (English)</label>
                    <textarea
                      value={formData.ogDescriptionEn}
                      onChange={(e) => setFormData({ ...formData, ogDescriptionEn: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="2"
                      placeholder="Social Sharing Description in English"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">OG Image URL</label>
                    <input
                      type="url"
                      value={formData.ogImage}
                      onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
              </div>
              {/* Twitter Card Fields */}
              <div className="col-span-2 border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Twitter Card</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Twitter Title (Arabic)</label>
                    <input
                      type="text"
                      value={formData.twitterCardTitleAr}
                      onChange={(e) => setFormData({ ...formData, twitterCardTitleAr: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="عنوان تويتر بالعربية"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Twitter Title (English)</label>
                    <input
                      type="text"
                      value={formData.twitterCardTitleEn}
                      onChange={(e) => setFormData({ ...formData, twitterCardTitleEn: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Twitter Card Title in English"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Twitter Description (Arabic)</label>
                    <textarea
                      value={formData.twitterCardDescriptionAr}
                      onChange={(e) => setFormData({ ...formData, twitterCardDescriptionAr: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="2"
                      placeholder="وصف تويتر بالعربية"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Twitter Description (English)</label>
                    <textarea
                      value={formData.twitterCardDescriptionEn}
                      onChange={(e) => setFormData({ ...formData, twitterCardDescriptionEn: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows="2"
                      placeholder="Twitter Card Description in English"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Twitter Card Image URL</label>
                    <input
                      type="url"
                      value={formData.twitterCardImage}
                      onChange={(e) => setFormData({ ...formData, twitterCardImage: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="https://example.com/twitter-image.jpg"
                    />
                  </div>
                </div>
              </div>
              {/* Structured Data */}
              <div className="col-span-2 border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Structured Data (JSON-LD)</h3>
                <div>
                  <label className="block text-sm font-medium mb-1">Structured Data JSON</label>
                  <textarea
                    value={formData.structuredData}
                    onChange={(e) => setFormData({ ...formData, structuredData: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                    rows="5"
                    placeholder='{"@context": "https://schema.org", "@type": "Product", ...}'
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  {selectedProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Product Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><strong>ID:</strong> {selectedProduct.id}</div>
              <div><strong>SKU:</strong> {selectedProduct.sku}</div>
              <div><strong>Name Key:</strong> {selectedProduct.nameKey}</div>
              <div><strong>Price:</strong> {selectedProduct.price} SAR</div>
              <div><strong>Quantity:</strong> {selectedProduct.quantity}</div>
              <div><strong>Status:</strong> {getStatusBadge(selectedProduct.status)}</div>
              <div><strong>Category:</strong> {selectedProduct.category?.nameKey || 'N/A'}</div>
              <div><strong>Vendor:</strong> {selectedProduct.vendor?.companyName || 'N/A'}</div>
              <div><strong>Country:</strong> {selectedProduct.country || 'N/A'}</div>
              <div><strong>City:</strong> {selectedProduct.city || 'N/A'}</div>
              <div><strong>Rating:</strong> {selectedProduct.rating || 'N/A'}</div>
              <div><strong>Review Count:</strong> {selectedProduct.reviewCount || 0}</div>
              {selectedProduct.descriptionKey && (
                <div className="col-span-2">
                  <strong>Description:</strong> {selectedProduct.descriptionKey}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEdit(selectedProduct);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Edit Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h2 className="text-2xl font-bold mb-4">Import Products from CSV</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV file to import products. Make sure the file follows the template format.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select CSV File</label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {importFile && (
                <p className="text-sm text-gray-600 mt-2">Selected: {importFile.name}</p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={importing}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!importFile || importing}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminProducts;
