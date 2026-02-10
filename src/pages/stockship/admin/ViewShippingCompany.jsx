import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Package, MapPin, User, Phone, Mail, FileText, CheckCircle, XCircle, Calendar, Truck, Clock, CheckCircle2, AlertCircle, Eye, DollarSign } from 'lucide-react';
import showToast from '@/lib/toast';

const ViewShippingCompany = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    fetchCompany();
  }, [id]);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getShippingCompany(id);
      const data = response.data.data || response.data;
      setCompany(data);
    } catch (error) {
      console.error('Error fetching shipping company:', error);
      showToast.error(t('shippingCompanies.view.loadFailed'), error.response?.data?.message || t('shippingCompanies.view.loadFailedDesc'));
      navigate('/stockship/admin/shipping-companies');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-4 h-4 mr-1" />
          {t('shippingCompanies.statusActive')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
        <XCircle className="w-4 h-4 mr-1" />
        {t('shippingCompanies.statusInactive')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">{t('shippingCompanies.view.loading')}</p>
        </div>
      </div>
    );
  }

  if (!company) {
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
            onClick={() => navigate('/stockship/admin/shipping-companies')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold">{t('shippingCompanies.view.title')}</h1>
            <div className="flex items-center gap-3 mt-2">
              {company.avatar && (
                <img 
                  src={company.avatar} 
                  alt={company.nameEn || company.nameAr} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                />
              )}
              <div>
                <p className="text-gray-900 font-semibold">{company.nameEn || 'N/A'}</p>
                {company.nameAr && (
                  <p className="text-gray-600 text-sm" dir="rtl">{company.nameAr}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(company.status)}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/stockship/admin/shipping-companies/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Edit className="w-4 h-4" />
            {t('common.edit')}
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t('shippingCompanies.view.companyInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('shippingCompanies.view.nameEn')}</label>
                  <p className="mt-1 font-semibold text-gray-900">{company.nameEn || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('shippingCompanies.view.nameAr')}</label>
                  <p className="mt-1 font-semibold text-gray-900" dir="rtl">{company.nameAr || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('shippingCompanies.view.status')}</label>
                  <div className="mt-1">{getStatusBadge(company.status)}</div>
                </div>
                {company.contactName && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('shippingCompanies.view.contactPerson')}</label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <p>{company.contactName}</p>
                    </div>
                  </div>
                )}
                {company.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('shippingCompanies.view.phone')}</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p>{company.phone}</p>
                    </div>
                  </div>
                )}
                {company.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('shippingCompanies.view.email')}</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p>{company.email}</p>
                    </div>
                  </div>
                )}
              </div>
              {company.address && (
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('shippingCompanies.view.address')}</label>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p className="text-gray-700">{company.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {company.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('shippingCompanies.view.internalNotes')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{company.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Shipping Tracking */}
          {company.shippingTracks && company.shippingTracks.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    {t('shippingCompanies.view.shippingTracking')} ({company._count?.shippingTracks || company.shippingTracks.length})
                  </CardTitle>
                  <button
                    onClick={() => navigate('/stockship/admin/shipping-tracking', { state: { shippingCompanyId: id } })}
                    className="text-sm text-primary hover:underline"
                  >
                    {t('shippingCompanies.view.viewAll')}
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {company.shippingTracks.map((tracking) => (
                    <div 
                      key={tracking.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/stockship/admin/shipping-tracking/${tracking.dealId}/view`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {tracking.status === 'DELIVERED' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : tracking.status === 'IN_TRANSIT' || tracking.status === 'OUT_FOR_DELIVERY' ? (
                              <Truck className="w-5 h-5 text-blue-500" />
                            ) : (
                              <Clock className="w-5 h-5 text-gray-500" />
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tracking.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                              tracking.status === 'IN_TRANSIT' || tracking.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {tracking.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs">{t('shippingCompanies.view.dealNumber')}</p>
                              <p className="font-medium">{tracking.deal?.dealNumber || 'N/A'}</p>
                            </div>
                            {tracking.trackingNumber && (
                              <div>
                                <p className="text-gray-500 text-xs">{t('shippingCompanies.view.trackingNumber')}</p>
                                <p className="font-mono text-xs">{tracking.trackingNumber}</p>
                              </div>
                            )}
                            {tracking.currentLocation && (
                              <div>
                                <p className="text-gray-500 text-xs">{t('shippingCompanies.view.currentLocation')}</p>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  <p className="text-xs">{tracking.currentLocation}</p>
                                </div>
                              </div>
                            )}
                            {tracking.deal?.negotiatedAmount && (
                              <div>
                                <p className="text-gray-500 text-xs">{t('shippingCompanies.view.amount')}</p>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3 text-gray-400" />
                                  <p className="font-medium">{Number(tracking.deal.negotiatedAmount).toLocaleString()} SAR</p>
                                </div>
                              </div>
                            )}
                            {tracking.deal?.trader && (
                              <div>
                                <p className="text-gray-500 text-xs">{t('mediation.deals.trader')}</p>
                                <p className="text-xs">{tracking.deal.trader.companyName || tracking.deal.trader.name}</p>
                              </div>
                            )}
                            {tracking.deal?.client && (
                              <div>
                                <p className="text-gray-500 text-xs">{t('mediation.deals.client')}</p>
                                <p className="text-xs">{tracking.deal.client.name}</p>
                              </div>
                            )}
                            {tracking.estimatedDelivery && (
                              <div>
                                <p className="text-gray-500 text-xs">{t('shippingCompanies.view.estimatedDelivery')}</p>
                                <p className="text-xs">{new Date(tracking.estimatedDelivery).toLocaleDateString()}</p>
                              </div>
                            )}
                            {tracking.actualDelivery && (
                              <div>
                                <p className="text-gray-500 text-xs">{t('shippingCompanies.view.delivered')}</p>
                                <p className="text-xs text-green-600 font-semibold">{new Date(tracking.actualDelivery).toLocaleDateString()}</p>
                              </div>
                            )}
                          </div>
                          {tracking.statusHistory && tracking.statusHistory.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-500 mb-2">{t('shippingCompanies.view.recentUpdates')}</p>
                              <div className="space-y-1">
                                {tracking.statusHistory.slice(0, 2).map((history) => (
                                  <div key={history.id} className="flex items-center gap-2 text-xs text-gray-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                    <span>{history.status.replace(/_/g, ' ')}</span>
                                    <span className="text-gray-400">•</span>
                                    <span>{new Date(history.createdAt).toLocaleDateString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/stockship/admin/shipping-tracking/${tracking.dealId}/view`);
                              }}
                              className="text-xs text-primary hover:underline font-medium"
                            >
                              {t('shippingCompanies.view.viewFullDetails')} →
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/stockship/admin/shipping-tracking/${tracking.dealId}/view`)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            title={t('shippingCompanies.view.viewTrackingDetails')}
                          >
                            <Truck className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => navigate(`/stockship/admin/deals/${tracking.dealId}/view`)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            title={t('shippingCompanies.view.viewDeal')}
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {company._count?.shippingTracks > company.shippingTracks.length && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => navigate('/stockship/admin/shipping-tracking', { state: { shippingCompanyId: id } })}
                      className="text-sm text-primary hover:underline"
                    >
                      {t('shippingCompanies.view.viewAllTrackingRecords').replace('{count}', company._count.shippingTracks)}
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t('shippingCompanies.view.statistics')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('shippingCompanies.view.assignedDeals')}</label>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{company._count?.deals || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('shippingCompanies.view.shippingTracks')}</label>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{company._count?.shippingTracks || 0}</p>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('shippingCompanies.view.importantDates')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('shippingCompanies.view.createdAt')}</label>
                <p className="mt-1">{company.createdAt ? new Date(company.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
              {company.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('shippingCompanies.view.lastUpdated')}</label>
                  <p className="mt-1">{new Date(company.updatedAt).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default ViewShippingCompany;

