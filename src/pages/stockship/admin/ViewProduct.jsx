import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, Package, DollarSign, ShoppingCart, Tag, MapPin, Calendar, CheckCircle, XCircle } from 'lucide-react';
import showToast from '@/lib/toast';

const ViewProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getProduct(id);
      setProduct(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      showToast.error('Failed to load product', error.response?.data?.message || 'Product not found');
      navigate('/stockship/admin/products');
    } finally {
      setLoading(false);
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace(/_/g, ' ') || 'Unknown'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/stockship/admin/products')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold">Product Details</h1>
            <p className="text-muted-foreground mt-2">View complete product information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/stockship/admin/products/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Edit className="w-4 h-4" />
            Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/stockship/admin/products/${id}/delete`)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </motion.button>
        </div>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Basic Information
            </CardTitle>
            {getStatusBadge(product.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Product ID</label>
              <p className="text-lg font-semibold mt-1">#{product.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Name Key</label>
              <p className="text-lg font-semibold mt-1">{product.nameKey || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">SKU</label>
              <p className="text-lg font-semibold mt-1">{product.sku || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Price
              </label>
              <p className="text-lg font-semibold mt-1">{product.price ? `${product.price} SAR` : 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <ShoppingCart className="w-4 h-4" />
                Quantity
              </label>
              <p className="text-lg font-semibold mt-1">{product.quantity || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">{getStatusBadge(product.status)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {product.descriptionKey && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{product.descriptionKey}</p>
          </CardContent>
        </Card>
      )}

      {/* Category & Vendor */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Category Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Category ID</label>
                <p className="text-lg font-semibold mt-1">{product.categoryId || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Category Name</label>
                <p className="text-lg font-semibold mt-1">{product.category?.nameKey || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Vendor Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Vendor ID</label>
                <p className="text-lg font-semibold mt-1">{product.vendorId || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Company Name</label>
                <p className="text-lg font-semibold mt-1">{product.vendor?.companyName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg mt-1">{product.vendor?.email || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Details */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Quantity Per Carton</label>
              <p className="text-lg font-semibold mt-1">{product.quantityPerCarton || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">CBM</label>
              <p className="text-lg font-semibold mt-1">{product.cbm || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Min Stock Level</label>
              <p className="text-lg font-semibold mt-1">{product.minStockLevel || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              <p className="text-lg font-semibold mt-1">
                {product.city && product.country 
                  ? `${product.city}, ${product.country}`
                  : product.city || product.country || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Is Featured</label>
              <div className="mt-1">
                {product.isFeatured ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Accepts Negotiation</label>
              <div className="mt-1">
                {product.acceptsNegotiation ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Created At
              </label>
              <p className="text-sm mt-1">
                {product.createdAt ? new Date(product.createdAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Updated At
              </label>
              <p className="text-sm mt-1">
                {product.updatedAt ? new Date(product.updatedAt).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {(product.rating || product.reviewCount) && (
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {product.rating && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Rating</label>
                  <p className="text-lg font-semibold mt-1">{product.rating} / 5</p>
                </div>
              )}
              {product.reviewCount !== undefined && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Review Count</label>
                  <p className="text-lg font-semibold mt-1">{product.reviewCount || 0}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default ViewProduct;


