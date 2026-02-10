import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Truck, MapPin, Clock, CheckCircle2, AlertCircle, 
  Package, User, Store, DollarSign, Calendar, Eye, 
  FileText, Phone, Mail, Building, Navigation, 
  TrendingUp, Activity, History
} from 'lucide-react';
import showToast from '@/lib/toast';

const ViewShippingTracking = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(null);
  const [deal, setDeal] = useState(null);

  useEffect(() => {
    fetchTracking();
  }, [dealId]);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getShippingTracking(dealId);
      const data = response.data.data || response.data;
      setTracking(data);
      
      // If tracking exists, fetch deal details
      if (data?.deal) {
        try {
          const dealResponse = await adminApi.getDeal(dealId);
          const dealData = dealResponse.data.data || dealResponse.data;
          setDeal(dealData.deal || dealData);
        } catch (error) {
          console.error('Error fetching deal:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching shipping tracking:', error);
      showToast.error(
        t('shippingTracking.view.loadFailed') || 'Failed to load tracking', 
        error.response?.data?.message || 'Please try again'
      );
      navigate('/stockship/admin/shipping-tracking');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: <Clock className="w-5 h-5 text-gray-500" />,
      PREPARING: <Package className="w-5 h-5 text-blue-500" />,
      PICKED_UP: <Package className="w-5 h-5 text-purple-500" />,
      IN_TRANSIT: <Truck className="w-5 h-5 text-blue-500" />,
      OUT_FOR_DELIVERY: <Truck className="w-5 h-5 text-orange-500" />,
      DELIVERED: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      RETURNED: <AlertCircle className="w-5 h-5 text-red-500" />,
      CANCELLED: <AlertCircle className="w-5 h-5 text-red-500" />
    };
    return icons[status] || <Clock className="w-5 h-5 text-gray-500" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-gray-100 text-gray-800',
      PREPARING: 'bg-blue-100 text-blue-800',
      PICKED_UP: 'bg-purple-100 text-purple-800',
      IN_TRANSIT: 'bg-blue-100 text-blue-800',
      OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
      DELIVERED: 'bg-green-100 text-green-800',
      RETURNED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0.00';
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6 p-6"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/stockship/admin/shipping-tracking')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold">Shipping Tracking</h1>
        </div>
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No shipping tracking found for this deal</p>
            <button
              onClick={() => navigate('/stockship/admin/shipping-tracking')}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Back to Tracking List
            </button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/stockship/admin/shipping-tracking')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold">Shipping Tracking Details</h1>
            <p className="text-gray-600 mt-1">Deal: {tracking.deal?.dealNumber || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {getStatusIcon(tracking.status)}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tracking.status)}`}>
              {tracking.status.replace(/_/g, ' ')}
            </span>
          </div>
          <button
            onClick={() => navigate(`/stockship/admin/deals/${dealId}/view`)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
            View Deal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tracking Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Tracking Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tracking Number</label>
                  <p className="mt-1 font-mono text-lg font-semibold">
                    {tracking.trackingNumber || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1 flex items-center gap-2">
                    {getStatusIcon(tracking.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tracking.status)}`}>
                      {tracking.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                {tracking.currentLocation && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Current Location</label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">{tracking.currentLocation}</p>
                    </div>
                  </div>
                )}
                {tracking.estimatedDelivery && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estimated Delivery</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">{formatDate(tracking.estimatedDelivery)}</p>
                    </div>
                  </div>
                )}
                {tracking.actualDelivery && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Actual Delivery</label>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <p className="text-green-600 font-semibold">{formatDate(tracking.actualDelivery)}</p>
                    </div>
                  </div>
                )}
              </div>
              {tracking.notes && (
                <div className="pt-4 border-t border-gray-200">
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap">{tracking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Company */}
          {tracking.shippingCompany && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Shipping Company
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  {tracking.shippingCompany.avatar && (
                    <img 
                      src={tracking.shippingCompany.avatar} 
                      alt={tracking.shippingCompany.nameEn || tracking.shippingCompany.nameAr} 
                      className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{tracking.shippingCompany.nameEn || 'N/A'}</h3>
                    {tracking.shippingCompany.nameAr && (
                      <p className="text-gray-600 text-sm mt-1" dir="rtl">{tracking.shippingCompany.nameAr}</p>
                    )}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {tracking.shippingCompany.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{tracking.shippingCompany.phone}</span>
                        </div>
                      )}
                      {tracking.shippingCompany.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{tracking.shippingCompany.email}</span>
                        </div>
                      )}
                      {tracking.shippingCompany.address && (
                        <div className="col-span-2 flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <span className="text-sm">{tracking.shippingCompany.address}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/stockship/admin/shipping-companies/${tracking.shippingCompany.id}/view`)}
                      className="mt-4 text-sm text-primary hover:underline"
                    >
                      View Company Details →
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deal Information */}
          {deal && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Deal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Deal Number</label>
                    <p className="mt-1 font-semibold">{deal.dealNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Deal Status</label>
                    <p className="mt-1">{deal.status || 'N/A'}</p>
                  </div>
                  {deal.negotiatedAmount && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Amount</label>
                      <div className="flex items-center gap-1 mt-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <p className="font-semibold text-lg">{formatCurrency(deal.negotiatedAmount)} SAR</p>
                      </div>
                    </div>
                  )}
                  {deal.totalCartons && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Cartons</label>
                      <p className="mt-1 font-semibold">{deal.totalCartons}</p>
                    </div>
                  )}
                  {deal.totalCBM && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total CBM</label>
                      <p className="mt-1 font-semibold">{Number(deal.totalCBM).toFixed(3)}</p>
                    </div>
                  )}
                </div>
                {deal.trader && (
                  <div className="pt-4 border-t border-gray-200">
                    <label className="text-sm font-medium text-gray-500">Trader</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Store className="w-4 h-4 text-gray-400" />
                      <p>{deal.trader.companyName || deal.trader.name || 'N/A'}</p>
                    </div>
                  </div>
                )}
                {deal.client && (
                  <div className="pt-2">
                    <label className="text-sm font-medium text-gray-500">Client</label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <p>{deal.client.name || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status History */}
          {tracking.statusHistory && tracking.statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Status History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <div className="space-y-6">
                    {tracking.statusHistory.map((history, index) => (
                      <div key={history.id} className="relative flex gap-4">
                        <div className="relative z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {getStatusIcon(history.status)}
                          </div>
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(history.status)}`}>
                              {history.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs text-gray-500">{formatDate(history.createdAt)}</span>
                          </div>
                          {history.location && (
                            <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                              <MapPin className="w-3 h-3" />
                              <span>{history.location}</span>
                            </div>
                          )}
                          {history.description && (
                            <p className="mt-2 text-sm text-gray-700">{history.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => navigate(`/stockship/admin/deals/${dealId}/view`)}
                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Deal Details
              </button>
              {tracking.shippingCompany && (
                <button
                  onClick={() => navigate(`/stockship/admin/shipping-companies/${tracking.shippingCompany.id}/view`)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Building className="w-4 h-4" />
                  View Shipping Company
                </button>
              )}
              <button
                onClick={() => navigate('/stockship/admin/shipping-tracking')}
                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Truck className="w-4 h-4" />
                Back to Tracking List
              </button>
            </CardContent>
          </Card>

          {/* Timeline Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="mt-1 text-sm">{formatDate(tracking.createdAt)}</p>
              </div>
              {tracking.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-sm">{formatDate(tracking.updatedAt)}</p>
                </div>
              )}
              {tracking.estimatedDelivery && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Estimated Delivery</label>
                  <p className="mt-1 text-sm">{formatDate(tracking.estimatedDelivery)}</p>
                </div>
              )}
              {tracking.actualDelivery && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Delivered</label>
                  <p className="mt-1 text-sm text-green-600 font-semibold">{formatDate(tracking.actualDelivery)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default ViewShippingTracking;



