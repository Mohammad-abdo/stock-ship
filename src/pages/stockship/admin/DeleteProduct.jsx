import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import showToast from '@/lib/toast';

const DeleteProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
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

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await adminApi.deleteProduct(id);
      showToast.success('Product deleted successfully', 'The product has been permanently deleted');
      navigate('/stockship/admin/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast.error('Failed to delete product', error.response?.data?.message || 'Please try again');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product...</p>
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
      className="space-y-6 p-6 max-w-2xl mx-auto"
    >
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
          <h1 className="text-3xl font-bold text-red-600">Delete Product</h1>
          <p className="text-muted-foreground mt-2">Confirm deletion of product</p>
        </div>
      </div>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Warning: This action cannot be undone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-red-800">
              You are about to permanently delete this product. This action cannot be undone and all associated data will be lost.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Product Name</label>
              <p className="text-lg font-semibold">{product.nameKey || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">SKU</label>
              <p className="text-lg">{product.sku || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Price</label>
              <p className="text-lg">{product.price ? `${product.price} SAR` : 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="text-lg">{product.status || 'N/A'}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/stockship/admin/products')}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Delete Product'}
            </motion.button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DeleteProduct;


