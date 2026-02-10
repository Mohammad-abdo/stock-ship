import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, Store, Mail, Phone, MapPin, Package, ShoppingCart, Wallet, Calendar, CheckCircle, XCircle, Ban, Check } from 'lucide-react';
import showToast from '@/lib/toast';

const ViewVendor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
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

  const getStatusBadge = (status) => {
    const statusColors = {
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      SUSPENDED: 'bg-orange-100 text-orange-800',
      PENDING: 'bg-yellow-100 text-yellow-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vendor details...</p>
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
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold">Vendor Details</h1>
            <p className="text-muted-foreground mt-2">View complete vendor information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/stockship/admin/vendors/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Edit className="w-4 h-4" />
            Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/stockship/admin/vendors/${id}/delete`)}
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
              <Store className="w-5 h-5" />
              Basic Information
            </CardTitle>
            {getStatusBadge(vendor.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Vendor ID</label>
              <p className="text-lg font-semibold mt-1">#{vendor.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Store className="w-4 h-4" />
                Company Name
              </label>
              <p className="text-lg font-semibold mt-1">{vendor.companyName || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Business Name</label>
              <p className="text-lg font-semibold mt-1">{vendor.businessName || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <p className="text-lg font-semibold mt-1">{vendor.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Phone className="w-4 h-4" />
                Phone
              </label>
              <p className="text-lg font-semibold mt-1">{vendor.phone || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">{getStatusBadge(vendor.status)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Verified</label>
              <p className="text-lg font-semibold mt-1">
                {vendor.isVerified ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Active</label>
              <p className="text-lg font-semibold mt-1">
                {vendor.isActive ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Information */}
      {(vendor.address || vendor.city || vendor.country) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {vendor.address && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-lg font-semibold mt-1">{vendor.address}</p>
                </div>
              )}
              {vendor.city && (
                <div>
                  <label className="text-sm font-medium text-gray-500">City</label>
                  <p className="text-lg font-semibold mt-1">{vendor.city}</p>
                </div>
              )}
              {vendor.country && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Country</label>
                  <p className="text-lg font-semibold mt-1">{vendor.country}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Details */}
      {(vendor.description || vendor.paymentTerms || vendor.shippingTerms) && (
        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vendor.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-700 whitespace-pre-wrap mt-1">{vendor.description}</p>
                </div>
              )}
              {vendor.paymentTerms && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Terms</label>
                  <p className="text-gray-700 whitespace-pre-wrap mt-1">{vendor.paymentTerms}</p>
                </div>
              )}
              {vendor.shippingTerms && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Shipping Terms</label>
                  <p className="text-gray-700 whitespace-pre-wrap mt-1">{vendor.shippingTerms}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vendor._count?.products || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Total products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vendor._count?.orders || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Total orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vendor.wallet?.balance || 0} SAR</p>
            <p className="text-sm text-gray-500 mt-1">Current balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Member Since
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'N/A'}
            </p>
            <p className="text-sm text-gray-500 mt-1">Registration date</p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default ViewVendor;


