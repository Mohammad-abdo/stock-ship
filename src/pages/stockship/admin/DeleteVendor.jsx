import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, AlertTriangle, Store } from 'lucide-react';
import showToast from '@/lib/toast';

const DeleteVendor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [vendor, setVendor] = useState(null);

  useEffect(() => {
    fetchVendor();
  }, [id]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getVendor(id);
      setVendor(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching vendor:', error);
      showToast.error('Failed to load vendor', error.response?.data?.message || 'Vendor not found');
      navigate('/stockship/admin/vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await adminApi.deleteVendor(id);
      showToast.success('Vendor deleted successfully', 'The vendor has been permanently deleted');
      navigate('/stockship/admin/vendors');
    } catch (error) {
      console.error('Error deleting vendor:', error);
      showToast.error('Failed to delete vendor', error.response?.data?.message || 'Please try again');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vendor...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
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
          onClick={() => navigate('/stockship/admin/vendors')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className="text-3xl font-bold text-red-600">Delete Vendor</h1>
          <p className="text-muted-foreground mt-2">Confirm deletion of vendor</p>
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
              You are about to permanently delete this vendor. This action cannot be undone and all associated data will be lost.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Company Name</label>
              <p className="text-lg font-semibold">{vendor.companyName || vendor.businessName || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-lg">{vendor.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="text-lg">{vendor.status || 'N/A'}</p>
            </div>
            {vendor._count && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Products</label>
                  <p className="text-2xl font-bold text-red-600">{vendor._count.products || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Orders</label>
                  <p className="text-2xl font-bold text-red-600">{vendor._count.orders || 0}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/stockship/admin/vendors')}
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
              {deleting ? 'Deleting...' : 'Delete Vendor'}
            </motion.button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DeleteVendor;


