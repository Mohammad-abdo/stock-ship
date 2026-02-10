import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Store, User, Briefcase, Calendar, DollarSign, Package, Box, CheckCircle, MessageSquare, CreditCard, Truck, Edit2, X, MapPin, Clock, CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import showToast from '@/lib/toast';

const ViewDeal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState(null);
  const [shippingCompanies, setShippingCompanies] = useState([]);
  const [assigningShipping, setAssigningShipping] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedShippingCompanyId, setSelectedShippingCompanyId] = useState('');
  const [shippingTracking, setShippingTracking] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [updatingTracking, setUpdatingTracking] = useState(false);
  const [trackingForm, setTrackingForm] = useState({
    trackingNumber: '',
    status: 'PENDING',
    currentLocation: '',
    estimatedDelivery: '',
    notes: ''
  });

  useEffect(() => {
    fetchDeal();
    fetchShippingCompanies();
    fetchShippingTracking();
  }, [id]);

  useEffect(() => {
    if (deal?.shippingCompanyId) {
      setSelectedShippingCompanyId(deal.shippingCompanyId);
    }
  }, [deal]);

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDeal(id);
      const data = response.data.data || response.data;
      setDeal(data.deal || data);
    } catch (error) {
      console.error('Error fetching deal:', error);
      showToast.error(t('mediation.deals.loadDealFailed') || 'Failed to load deal', error.response?.data?.message || 'Deal not found');
      navigate('/stockship/admin/deals');
    } finally {
      setLoading(false);
    }
  };

  const fetchShippingCompanies = async () => {
    try {
      const response = await adminApi.getActiveShippingCompanies();
      const data = response.data.data || response.data || [];
      setShippingCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching shipping companies:', error);
    }
  };

  const fetchShippingTracking = async () => {
    try {
      const response = await adminApi.getShippingTracking(id);
      const data = response.data.data || response.data;
      setShippingTracking(data);
    } catch (error) {
      // It's okay if tracking doesn't exist yet
      if (error.response?.status !== 404) {
        console.error('Error fetching shipping tracking:', error);
      }
    }
  };

  const handleOpenTrackingModal = () => {
    if (shippingTracking) {
      setTrackingForm({
        trackingNumber: shippingTracking.trackingNumber || '',
        status: shippingTracking.status || 'PENDING',
        currentLocation: shippingTracking.currentLocation || '',
        estimatedDelivery: shippingTracking.estimatedDelivery ? new Date(shippingTracking.estimatedDelivery).toISOString().split('T')[0] : '',
        notes: shippingTracking.notes || ''
      });
    } else {
      setTrackingForm({
        trackingNumber: '',
        status: 'PENDING',
        currentLocation: '',
        estimatedDelivery: '',
        notes: ''
      });
    }
    setShowTrackingModal(true);
  };

  const handleSaveTracking = async () => {
    try {
      setUpdatingTracking(true);
      await adminApi.createOrUpdateShippingTracking(id, {
        shippingCompanyId: deal?.shippingCompanyId,
        ...trackingForm,
        estimatedDelivery: trackingForm.estimatedDelivery || null
      });
      showToast.success(
        t('mediation.deals.shippingTrackingUpdated') || 'Shipping Tracking Updated', 
        t('mediation.deals.statusUpdatedSuccess') || 'Shipping tracking has been updated successfully'
      );
      setShowTrackingModal(false);
      fetchShippingTracking();
      fetchDeal();
    } catch (error) {
      console.error('Error updating shipping tracking:', error);
      showToast.error(t('mediation.deals.failedToUpdateTracking') || 'Failed to update tracking', error.response?.data?.message || 'Please try again');
    } finally {
      setUpdatingTracking(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdatingTracking(true);
      await adminApi.updateShippingStatus(id, {
        status: newStatus,
        currentLocation: shippingTracking?.currentLocation || '',
        description: `Status changed to ${newStatus}`
      });
      showToast.success(t('mediation.deals.statusUpdated'), t('mediation.deals.statusUpdatedSuccess'));
      fetchShippingTracking();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast.error(t('mediation.deals.failedToUpdateStatus'), error.response?.data?.message || t('common.tryAgain'));
    } finally {
      setUpdatingTracking(false);
    }
  };

  const getShippingStatusIcon = (status) => {
    const icons = {
      PENDING: <Clock className="w-5 h-5 text-gray-500" />,
      PREPARING: <Loader className="w-5 h-5 text-blue-500 animate-spin" />,
      PICKED_UP: <Package className="w-5 h-5 text-purple-500" />,
      IN_TRANSIT: <Truck className="w-5 h-5 text-blue-500" />,
      OUT_FOR_DELIVERY: <Truck className="w-5 h-5 text-orange-500" />,
      DELIVERED: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      RETURNED: <AlertCircle className="w-5 h-5 text-red-500" />,
      CANCELLED: <X className="w-5 h-5 text-red-500" />
    };
    return icons[status] || <Clock className="w-5 h-5 text-gray-500" />;
  };

  const getShippingStatusColor = (status) => {
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

  const getShippingStatusLabel = (status) => {
    const statusMap = {
      PENDING: t('mediation.deals.shippingStatus.pending') || 'Pending',
      PREPARING: t('mediation.deals.shippingStatus.preparing') || 'Preparing',
      PICKED_UP: t('mediation.deals.shippingStatus.pickedUp') || 'Picked Up',
      IN_TRANSIT: t('mediation.deals.shippingStatus.inTransit') || 'In Transit',
      OUT_FOR_DELIVERY: t('mediation.deals.shippingStatus.outForDelivery') || 'Out for Delivery',
      DELIVERED: t('mediation.deals.shippingStatus.delivered') || 'Delivered',
      RETURNED: t('mediation.deals.shippingStatus.returned') || 'Returned',
      CANCELLED: t('mediation.deals.shippingStatus.cancelled') || 'Cancelled'
    };
    return statusMap[status] || status.replace('_', ' ');
  };

  const handleAssignShipping = async () => {
    if (!selectedShippingCompanyId && deal?.shippingCompanyId) {
      // Removing assignment
      if (!window.confirm(t('mediation.deals.removeShippingAssignmentConfirm') || 'Are you sure you want to remove the shipping company assignment?')) {
        return;
      }
    } else if (selectedShippingCompanyId && selectedShippingCompanyId === deal?.shippingCompanyId) {
      // No change
      setShowShippingModal(false);
      return;
    }

    try {
      setAssigningShipping(true);
      await adminApi.assignShippingCompany(id, selectedShippingCompanyId || null);
      showToast.success(
        t('mediation.deals.shippingCompanyUpdated') || 'Shipping Company Updated', 
        t('mediation.deals.shippingCompanyUpdatedDesc') || 'Shipping company assignment has been updated successfully'
      );
      setShowShippingModal(false);
      fetchDeal();
    } catch (error) {
      console.error('Error assigning shipping company:', error);
      showToast.error(t('mediation.deals.failedToAssignShipping') || 'Failed to assign shipping company', error.response?.data?.message || 'Please try again');
    } finally {
      setAssigningShipping(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      NEGOTIATION: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      SETTLED: 'bg-emerald-100 text-emerald-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    const statusLabels = {
      NEGOTIATION: t('mediation.deals.negotiation'),
      APPROVED: t('mediation.deals.approved'),
      PAID: t('mediation.deals.paid'),
      SETTLED: t('mediation.deals.settled'),
      CANCELLED: t('mediation.deals.cancelled')
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status || 'Unknown'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.deals.loading')}</p>
        </div>
      </div>
    );
  }

  if (!deal) {
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
            onClick={() => navigate('/stockship/admin/deals')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold">{t('mediation.deals.title')} - {t('mediation.deals.viewDetails')}</h1>
            <p className="text-muted-foreground mt-2">{deal.dealNumber || 'N/A'}</p>
          </div>
        </div>
        {getStatusBadge(deal.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {t('mediation.viewDeal.basicInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.deals.dealNumber')}</label>
                  <p className="mt-1 font-mono">{deal.dealNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.status')}</label>
                  <div className="mt-1">{getStatusBadge(deal.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.negotiatedAmount')}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <p className="text-lg font-semibold">{deal.negotiatedAmount ? `${Number(deal.negotiatedAmount).toLocaleString()} SAR` : 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.totalCBM')}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Box className="w-4 h-4 text-gray-400" />
                    <p>{deal.totalCBM || 0} CBM</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.totalCartons')}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Package className="w-4 h-4 text-gray-400" />
                    <p>{deal.totalCartons || 0}</p>
                  </div>
                </div>
                {deal.settledAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.settledAt')}</label>
                    <p className="mt-1">{new Date(deal.settledAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Parties Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trader */}
            {deal.trader && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Store className="w-5 h-5" />
                    {t('mediation.deals.trader')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.traders.companyName')}</label>
                    <p className="mt-1">{deal.trader.companyName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.traders.traderCode')}</label>
                    <p className="mt-1 font-mono text-sm">{deal.trader.traderCode || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Client */}
            {deal.client && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-5 h-5" />
                    {t('mediation.deals.client')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.name')}</label>
                    <p className="mt-1">{deal.client.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.email')}</label>
                    <p className="mt-1">{deal.client.email || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Employee */}
          {deal.employee && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  {t('mediation.viewDeal.employee')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.name')}</label>
                    <p className="mt-1">{deal.employee.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.employees.employeeCode')}</label>
                    <p className="mt-1 font-mono">{deal.employee.employeeCode || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shipping Company Assignment */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  {t('mediation.deals.shippingCompany') || 'Shipping Company'}
                </CardTitle>
                <button
                  onClick={() => {
                    setSelectedShippingCompanyId(deal?.shippingCompanyId || '');
                    setShowShippingModal(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  {deal?.shippingCompany ? (t('mediation.deals.change') || 'Change') : (t('mediation.deals.assign') || 'Assign')}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {deal?.shippingCompany ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-900">{t('mediation.deals.assigned') || 'Assigned'}</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            {deal.shippingCompany.avatar && (
                              <img 
                                src={deal.shippingCompany.avatar} 
                                alt={deal.shippingCompany.nameEn || deal.shippingCompany.nameAr} 
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{deal.shippingCompany.nameEn || deal.shippingCompany.nameAr}</p>
                              {deal.shippingCompany.nameAr && deal.shippingCompany.nameEn && (
                                <p className="text-xs text-gray-500" dir="rtl">{deal.shippingCompany.nameAr}</p>
                              )}
                            </div>
                          </div>
                          {deal.shippingCompany.contactName && (
                            <p className="text-gray-600">{t('mediation.deals.contact') || 'Contact'}: {deal.shippingCompany.contactName}</p>
                          )}
                          {deal.shippingCompany.phone && (
                            <p className="text-gray-600">{t('mediation.deals.phone') || 'Phone'}: {deal.shippingCompany.phone}</p>
                          )}
                          {deal.shippingCompany.email && (
                            <p className="text-gray-600">{t('mediation.deals.email') || 'Email'}: {deal.shippingCompany.email}</p>
                          )}
                          {deal.shippingCompany.address && (
                            <p className="text-gray-600">{t('mediation.deals.address') || 'Address'}: {deal.shippingCompany.address}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600">
                    <X className="w-5 h-5" />
                    <span>{t('mediation.deals.noShippingCompanyAssigned') || 'No shipping company assigned'}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{t('mediation.deals.clickToAssignShipping') || 'Click "Assign" to assign a shipping company to this deal'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Tracking */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {t('mediation.deals.shippingTracking') || 'Shipping Tracking'}
                </CardTitle>
                {deal?.shippingCompany && (
                  <button
                    onClick={handleOpenTrackingModal}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    {shippingTracking ? (t('mediation.deals.updateTracking') || 'Update Tracking') : (t('mediation.deals.createTracking') || 'Create Tracking')}
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!deal?.shippingCompany ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600">
                    <AlertCircle className="w-5 h-5" />
                    <span>{t('mediation.deals.pleaseAssignShippingFirst') || 'Please assign a shipping company first'}</span>
                  </div>
                </div>
              ) : shippingTracking ? (
                <div className="space-y-4">
                  {/* Current Status */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getShippingStatusIcon(shippingTracking.status)}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getShippingStatusColor(shippingTracking.status)}`}>
                          {getShippingStatusLabel(shippingTracking.status)}
                        </span>
                      </div>
                    </div>
                    {shippingTracking.trackingNumber && (
                      <div className="mb-2">
                        <label className="text-sm font-medium text-gray-700">{t('mediation.deals.trackingNumber') || 'Tracking Number'}:</label>
                        <p className="mt-1 font-mono text-sm">{shippingTracking.trackingNumber}</p>
                      </div>
                    )}
                    {shippingTracking.currentLocation && (
                      <div className="mb-2">
                        <label className="text-sm font-medium text-gray-700">{t('mediation.deals.currentLocation') || 'Current Location'}:</label>
                        <p className="mt-1 text-sm">{shippingTracking.currentLocation}</p>
                      </div>
                    )}
                    {shippingTracking.estimatedDelivery && (
                      <div className="mb-2">
                        <label className="text-sm font-medium text-gray-700">{t('mediation.deals.estimatedDelivery') || 'Estimated Delivery'}:</label>
                        <p className="mt-1 text-sm">{new Date(shippingTracking.estimatedDelivery).toLocaleDateString()}</p>
                      </div>
                    )}
                    {shippingTracking.actualDelivery && (
                      <div className="mb-2">
                        <label className="text-sm font-medium text-gray-700">{t('mediation.deals.deliveredOn') || 'Delivered On'}:</label>
                        <p className="mt-1 text-sm text-green-600 font-semibold">{new Date(shippingTracking.actualDelivery).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Status History */}
                  {shippingTracking.statusHistory && shippingTracking.statusHistory.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">{t('mediation.deals.statusHistory') || 'Status History'}</h4>
                      <div className="space-y-2">
                        {shippingTracking.statusHistory.map((history, index) => (
                          <div key={history.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0 mt-1">
                              {getShippingStatusIcon(history.status)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-medium px-2 py-1 rounded ${getShippingStatusColor(history.status)}`}>
                                  {getShippingStatusLabel(history.status)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(history.createdAt).toLocaleString()}
                                </span>
                              </div>
                              {history.location && (
                                <p className="text-xs text-gray-600 mb-1">
                                  <MapPin className="w-3 h-3 inline mr-1" />
                                  {history.location}
                                </p>
                              )}
                              {history.description && (
                                <p className="text-xs text-gray-600">{history.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Status Update Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <button
                      onClick={() => handleUpdateStatus('PREPARING')}
                      disabled={updatingTracking || shippingTracking.status === 'PREPARING'}
                      className="px-3 py-1.5 text-xs bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('mediation.deals.markAsPreparing') || 'Mark as Preparing'}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('PICKED_UP')}
                      disabled={updatingTracking || shippingTracking.status === 'PICKED_UP'}
                      className="px-3 py-1.5 text-xs bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('mediation.deals.markAsPickedUp') || 'Mark as Picked Up'}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('IN_TRANSIT')}
                      disabled={updatingTracking || shippingTracking.status === 'IN_TRANSIT'}
                      className="px-3 py-1.5 text-xs bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('mediation.deals.markAsInTransit') || 'Mark as In Transit'}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('OUT_FOR_DELIVERY')}
                      disabled={updatingTracking || shippingTracking.status === 'OUT_FOR_DELIVERY'}
                      className="px-3 py-1.5 text-xs bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('mediation.deals.outForDelivery') || 'Out for Delivery'}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('DELIVERED')}
                      disabled={updatingTracking || shippingTracking.status === 'DELIVERED'}
                      className="px-3 py-1.5 text-xs bg-green-100 text-green-800 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('mediation.deals.markAsDelivered') || 'Mark as Delivered'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{t('mediation.deals.noTrackingInfo') || 'No tracking information available'}</span>
                  </div>
                  <p className="text-sm text-gray-500">{t('mediation.deals.clickToCreateTracking') || 'Click "Create Tracking" to start tracking this shipment'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deal Items */}
          {deal.items && deal.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {t('mediation.viewDeal.items')} ({deal.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">{t('mediation.common.id')}</th>
                        <th className="text-left p-3">{t('mediation.viewDeal.itemDescription')}</th>
                        <th className="text-left p-3">{t('mediation.viewDeal.quantity')}</th>
                        <th className="text-left p-3">{t('mediation.viewDeal.cbm')}</th>
                        <th className="text-left p-3">{t('mediation.viewDeal.cartons')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deal.items.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{item.id}</td>
                          <td className="p-3">{item.offerItem?.description || 'N/A'}</td>
                          <td className="p-3">{item.quantity || 0}</td>
                          <td className="p-3">{item.cbm || 0}</td>
                          <td className="p-3">{item.cartons || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payments */}
          {deal.payments && deal.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {t('mediation.viewDeal.payments')} ({deal.payments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deal.payments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.amount')}</label>
                          <p className="mt-1 font-semibold">{payment.amount ? `${payment.amount.toLocaleString()} SAR` : 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.status')}</label>
                          <div className="mt-1">
                            {payment.status === 'COMPLETED' ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {t('mediation.viewDeal.completed')}
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {payment.status || 'N/A'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.paymentDate')}</label>
                          <p className="mt-1">{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A'}</p>
                        </div>
                        {payment.paymentMethod && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.paymentMethod')}</label>
                            <p className="mt-1">{payment.paymentMethod}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Negotiations */}
          {deal.negotiations && deal.negotiations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  {t('mediation.viewDeal.negotiations')} ({deal.negotiations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {deal.negotiations.map((negotiation) => (
                    <div key={negotiation.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">{negotiation.senderType || 'N/A'}</span>
                        <span className="text-xs text-muted-foreground">
                          {negotiation.createdAt ? new Date(negotiation.createdAt).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      <p className="text-sm">{negotiation.message || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('mediation.viewDeal.importantDates')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.createdAt')}</label>
                <p className="mt-1">{deal.createdAt ? new Date(deal.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
              {deal.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.lastUpdated')}</label>
                  <p className="mt-1">{new Date(deal.updatedAt).toLocaleString()}</p>
                </div>
              )}
              {deal.approvedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.approvedAt')}</label>
                  <p className="mt-1">{new Date(deal.approvedAt).toLocaleString()}</p>
                </div>
              )}
              {deal.settledAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewDeal.settledAt')}</label>
                  <p className="mt-1">{new Date(deal.settledAt).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Offer Info */}
          {deal.offer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {t('mediation.viewDeal.offer')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.offers.title')}</label>
                  <p className="mt-1">{deal.offer.title || 'N/A'}</p>
                </div>
                {deal.offer.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.offers.description')}</label>
                    <p className="mt-1 text-sm">{deal.offer.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Shipping Company Assignment Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{t('mediation.deals.assignShippingCompany') || 'Assign Shipping Company'}</h3>
              <button
                onClick={() => {
                  setShowShippingModal(false);
                  setSelectedShippingCompanyId(deal?.shippingCompanyId || '');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('mediation.deals.selectShippingCompany') || 'Select Shipping Company'}
                </label>
                <select
                  value={selectedShippingCompanyId}
                  onChange={(e) => setSelectedShippingCompanyId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">{t('mediation.deals.noneRemoveAssignment') || '-- None (Remove Assignment) --'}</option>
                  {shippingCompanies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.nameEn || company.nameAr} {company.nameAr && company.nameEn && ` - ${company.nameAr}`}
                    </option>
                  ))}
                </select>
                {shippingCompanies.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {t('mediation.deals.noActiveShippingCompanies') || 'No active shipping companies available.'} 
                    <button
                      onClick={() => {
                        setShowShippingModal(false);
                        navigate('/stockship/admin/shipping-companies/create');
                      }}
                      className="text-primary hover:underline ml-1"
                    >
                      {t('mediation.deals.createOne') || 'Create one'}
                    </button>
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowShippingModal(false);
                    setSelectedShippingCompanyId(deal?.shippingCompanyId || '');
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={assigningShipping}
                >
                  {t('mediation.deals.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleAssignShipping}
                  disabled={assigningShipping}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {assigningShipping ? (t('mediation.deals.saving') || 'Saving...') : (t('mediation.deals.saveAssignment') || 'Save Assignment')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Shipping Tracking Modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{t('mediation.deals.shippingTracking') || 'Shipping Tracking'}</h3>
              <button
                onClick={() => setShowTrackingModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('mediation.deals.trackingNumber') || 'Tracking Number'}</label>
                <input
                  type="text"
                  value={trackingForm.trackingNumber}
                  onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('mediation.deals.enterTrackingNumber') || 'Enter tracking number from shipping company'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('mediation.deals.status') || 'Status'}</label>
                <select
                  value={trackingForm.status}
                  onChange={(e) => setTrackingForm({ ...trackingForm, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="PENDING">{t('mediation.deals.shippingStatus.pending') || 'Pending'}</option>
                  <option value="PREPARING">{t('mediation.deals.shippingStatus.preparing') || 'Preparing'}</option>
                  <option value="PICKED_UP">{t('mediation.deals.shippingStatus.pickedUp') || 'Picked Up'}</option>
                  <option value="IN_TRANSIT">{t('mediation.deals.shippingStatus.inTransit') || 'In Transit'}</option>
                  <option value="OUT_FOR_DELIVERY">{t('mediation.deals.shippingStatus.outForDelivery') || 'Out for Delivery'}</option>
                  <option value="DELIVERED">{t('mediation.deals.shippingStatus.delivered') || 'Delivered'}</option>
                  <option value="RETURNED">{t('mediation.deals.shippingStatus.returned') || 'Returned'}</option>
                  <option value="CANCELLED">{t('mediation.deals.shippingStatus.cancelled') || 'Cancelled'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('mediation.deals.currentLocation') || 'Current Location'}</label>
                <input
                  type="text"
                  value={trackingForm.currentLocation}
                  onChange={(e) => setTrackingForm({ ...trackingForm, currentLocation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('mediation.deals.enterCurrentLocation') || 'Enter current location'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('mediation.deals.estimatedDeliveryDate') || 'Estimated Delivery Date'}</label>
                <input
                  type="date"
                  value={trackingForm.estimatedDelivery}
                  onChange={(e) => setTrackingForm({ ...trackingForm, estimatedDelivery: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('mediation.deals.notes') || 'Notes'}</label>
                <textarea
                  value={trackingForm.notes}
                  onChange={(e) => setTrackingForm({ ...trackingForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder={t('mediation.deals.additionalNotes') || 'Additional notes about the shipment'}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowTrackingModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={updatingTracking}
                >
                  {t('mediation.deals.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleSaveTracking}
                  disabled={updatingTracking}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updatingTracking ? (t('mediation.deals.saving') || 'Saving...') : (t('mediation.deals.saveTracking') || 'Save Tracking')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ViewDeal;

