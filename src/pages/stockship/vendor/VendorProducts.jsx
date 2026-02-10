import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { vendorApi } from '@/lib/stockshipApi';
import { Search, Plus, Edit, Trash2, Eye, Package, CheckCircle, XCircle, Download, Upload, FileDown } from 'lucide-react';
import { motion } from 'framer-motion';
import showToast from '@/lib/toast';
import { productsApi } from '@/lib/stockshipApi';

const VendorProducts = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [formData, setFormData] = useState({
    nameKey: '',
    descriptionKey: '',
    sku: '',
    price: '',
    quantity: '',
    quantityPerCarton: '',
    cbm: '',
    minStockLevel: '',
    categoryId: '',
    status: 'PENDING',
    isFeatured: false,
    acceptsNegotiation: false
  });

  useEffect(() => {
    fetchProducts();
  }, [statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        ...(statusFilter && { status: statusFilter })
      };
      const response = await vendorApi.getProducts(params);
      const data = response.data?.data || response.data || [];
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductDetails = async (id) => {
    try {
      const response = await vendorApi.getProduct(id);
      setSelectedProduct(response.data.data || response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching product details:', error);
      alert('Failed to fetch product details');
    }
  };

  const handleCreate = () => {
    setFormData({
      nameKey: '',
      descriptionKey: '',
      sku: '',
      price: '',
      quantity: '',
      quantityPerCarton: '',
      cbm: '',
      minStockLevel: '',
      categoryId: '',
      status: 'PENDING',
      isFeatured: false,
      acceptsNegotiation: false
    });
    setSelectedProduct(null);
    setShowModal(true);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await productsApi.exportProducts({});
      
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
    setFormData({
      nameKey: product.nameKey || '',
      descriptionKey: product.descriptionKey || '',
      sku: product.sku || '',
      price: product.price?.toString() || '',
      quantity: product.quantity?.toString() || '',
      quantityPerCarton: product.quantityPerCarton?.toString() || '',
      cbm: product.cbm?.toString() || '',
      minStockLevel: product.minStockLevel?.toString() || '',
      categoryId: product.categoryId?.toString() || '',
      status: product.status || 'PENDING',
      isFeatured: product.isFeatured || false,
      acceptsNegotiation: product.acceptsNegotiation || false
    });
    setSelectedProduct(product);
    setShowModal(true);
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
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null
      };

      if (selectedProduct) {
        await vendorApi.updateProduct(selectedProduct.id, data);
      } else {
        await vendorApi.createProduct(data);
      }
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await vendorApi.deleteProduct(id);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      APPROVED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
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

  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.nameKey?.toLowerCase().includes(searchLower) ||
      product.sku?.toLowerCase().includes(searchLower) ||
      product.descriptionKey?.toLowerCase().includes(searchLower)
    );
  });

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
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Products</h1>
          <p className="text-muted-foreground mt-2">Manage your product listings</p>
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
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="AVAILABLE">Available</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
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
          <CardTitle>Products List ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">ID</th>
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">SKU</th>
                    <th className="text-left p-4">Price</th>
                    <th className="text-left p-4">Quantity</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{product.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <div className="font-semibold">{product.nameKey || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="p-4">{product.sku || 'N/A'}</td>
                      <td className="p-4">{product.price ? `${product.price} SAR` : 'N/A'}</td>
                      <td className="p-4">{product.quantity || 0}</td>
                      <td className="p-4">{getStatusBadge(product.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => fetchProductDetails(product.id)}
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
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 hover:bg-red-100 rounded text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
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
                  <label className="block text-sm font-medium mb-1">Price (SAR) *</label>
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
                    step="0.01"
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
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description Key</label>
                <textarea
                  value={formData.descriptionKey}
                  onChange={(e) => setFormData({ ...formData, descriptionKey: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isFeatured" className="text-sm">Featured</label>
                </div>
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
              <div><strong>Name:</strong> {selectedProduct.nameKey || 'N/A'}</div>
              <div><strong>SKU:</strong> {selectedProduct.sku || 'N/A'}</div>
              <div><strong>Price:</strong> {selectedProduct.price} SAR</div>
              <div><strong>Quantity:</strong> {selectedProduct.quantity || 0}</div>
              <div><strong>Status:</strong> {getStatusBadge(selectedProduct.status)}</div>
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
    </div>
  );
};

export default VendorProducts;
