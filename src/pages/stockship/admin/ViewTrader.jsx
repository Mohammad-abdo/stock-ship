import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Edit, Store, Mail, Phone, MapPin, Package, ShoppingCart, Briefcase, QrCode, Calendar, 
  CheckCircle, XCircle, Ban, Check, User, Building2, DollarSign, TrendingUp, FileText, 
  CreditCard, Clock, Eye, Link as LinkIcon, BarChart3, Activity, Receipt
} from 'lucide-react';
import showToast from '@/lib/toast';
import StandardDataTable from '@/components/StandardDataTable';

const ViewTrader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [trader, setTrader] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchTrader();
  }, [id]);

  const fetchTrader = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getTrader(id);
      setTrader(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching trader:', error);
      showToast.error(t('mediation.viewTrader.loadError'), error.response?.data?.message || t('mediation.viewTrader.notFound'));
      navigate('/stockship/admin/traders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, isActive, isVerified) => {
    if (!isActive) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">{t('mediation.viewTrader.status.inactive')}</span>;
    }
    if (isVerified) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">{t('mediation.viewTrader.status.verified')}</span>;
    }
    if (status === 'PENDING_VALIDATION') {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{t('mediation.viewTrader.status.pendingValidation')}</span>;
    }
    if (status === 'ACTIVE') {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{t('mediation.viewTrader.status.active')}</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status || t('common.unknown')}</span>;
  };

  const getDealStatusBadge = (status) => {
    const statusColors = {
      'NEGOTIATION': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-blue-100 text-blue-800',
      'PAID': 'bg-green-100 text-green-800',
      'SETTLED': 'bg-purple-100 text-purple-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'PENDING': 'bg-gray-100 text-gray-800'
    };
    const statusLabels = {
      'NEGOTIATION': t('mediation.deals.status.negotiation'),
      'APPROVED': t('mediation.deals.status.approved'),
      'PAID': t('mediation.deals.status.paid'),
      'SETTLED': t('mediation.deals.status.settled'),
      'CANCELLED': t('mediation.deals.status.cancelled'),
      'PENDING': t('mediation.deals.status.pending')
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || statusColors['PENDING']}`}>
        {statusLabels[status] || status || t('common.unknown')}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusColors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'FAILED': 'bg-red-100 text-red-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
      'REFUNDED': 'bg-orange-100 text-orange-800'
    };
    const statusLabels = {
      'PENDING': t('mediation.payments.status.pending'),
      'COMPLETED': t('mediation.payments.status.completed'),
      'FAILED': t('mediation.payments.status.failed'),
      'CANCELLED': t('mediation.payments.status.cancelled'),
      'REFUNDED': t('mediation.payments.status.refunded')
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || statusColors['PENDING']}`}>
        {statusLabels[status] || status || t('common.unknown')}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    const locale = isRTL ? 'ar-SA' : 'en-US';
    return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  const formatDate = (date) => {
    if (!date) return t('common.notAvailable');
    const locale = isRTL ? 'ar-SA' : 'en-US';
    return new Date(date).toLocaleString(locale);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.viewTrader.loading')}</p>
        </div>
      </div>
    );
  }

  if (!trader) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: t('mediation.viewTrader.tabs.overview'), icon: Eye },
    { id: 'offers', label: `${t('mediation.viewTrader.tabs.offers')} (${trader._count?.offers || 0})`, icon: Package },
    { id: 'deals', label: `${t('mediation.viewTrader.tabs.deals')} (${trader._count?.deals || 0})`, icon: ShoppingCart },
    { id: 'financial', label: t('mediation.viewTrader.tabs.financial'), icon: DollarSign },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className={`flex items-center justify-between flex-wrap gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/stockship/admin/traders')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </motion.button>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className={`text-3xl font-bold flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Store className="w-8 h-8 text-primary" />
              {trader.companyName || trader.name || t('mediation.viewTrader.title')}
            </h1>
            <p className="text-muted-foreground mt-1">{trader.traderCode || trader.email}</p>
          </div>
        </div>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {getStatusBadge(null, trader.isActive, trader.isVerified)}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/stockship/admin/traders/${id}/edit`)}
            className={`flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Edit className="w-4 h-4" />
            {t('common.edit')}
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="text-sm text-muted-foreground mb-1">{t('mediation.viewTrader.totalOffers')}</p>
                <p className="text-2xl font-bold">{trader._count?.offers || 0}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="text-sm text-muted-foreground mb-1">{t('mediation.viewTrader.totalDeals')}</p>
                <p className="text-2xl font-bold">{trader._count?.deals || 0}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="text-sm text-muted-foreground mb-1">{t('mediation.viewTrader.totalPayments')}</p>
                <p className="text-2xl font-bold">{formatCurrency(trader.statistics?.totalPayments || 0)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="text-sm text-muted-foreground mb-1">{t('mediation.viewTrader.transactions')}</p>
                <p className="text-2xl font-bold">{trader.statistics?.transactionCount || 0}</p>
              </div>
              <Receipt className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                } ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <User className="w-5 h-5" />
                  {t('mediation.viewTrader.basicInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.traderCode')}</label>
                    <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      <QrCode className="w-4 h-4 text-gray-400" />
                      <span className="font-mono font-semibold">{trader.traderCode || t('common.notAvailable')}</span>
                    </div>
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.barcode')}</label>
                    <p className={`mt-1 font-mono text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{trader.barcode || t('common.notAvailable')}</p>
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.companyName')}</label>
                    <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <p>{trader.companyName || t('common.notAvailable')}</p>
                    </div>
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.contactPerson')}</label>
                    <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      <User className="w-4 h-4 text-gray-400" />
                      <p>{trader.name || t('common.notAvailable')}</p>
                    </div>
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.email')}</label>
                    <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p>{trader.email || t('common.notAvailable')}</p>
                    </div>
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.phone')}</label>
                    <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p>{trader.phone || t('common.notAvailable')}</p>
                    </div>
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.countryCode')}</label>
                    <p className={`mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>{trader.countryCode || t('common.notAvailable')}</p>
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.country')}</label>
                    <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <p>{trader.country || t('common.notAvailable')}</p>
                    </div>
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.city')}</label>
                    <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <p>{trader.city || t('common.notAvailable')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Linked Profiles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Linked Client Profile */}
              {trader.client && (
                <Card>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <LinkIcon className="w-5 h-5 text-blue-500" />
                      {t('mediation.viewTrader.linkedClientProfile')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={`space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div>
                      <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.clientName')}</label>
                      <p className={`mt-1 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{trader.client.name || t('common.notAvailable')}</p>
                    </div>
                    <div>
                      <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.clientEmail')}</label>
                      <p className={`mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>{trader.client.email || t('common.notAvailable')}</p>
                    </div>
                    <div>
                      <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.clientPhone')}</label>
                      <p className={`mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>{trader.client.phone || t('common.notAvailable')}</p>
                    </div>
                    <div>
                      <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.clientLocation')}</label>
                      <p className={`mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>{trader.client.city || t('common.notAvailable')}, {trader.client.country || t('common.notAvailable')}</p>
                    </div>
                    <div>
                      <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.clientStatus')}</label>
                      <div className={`mt-1 ${isRTL ? 'flex justify-end' : 'flex justify-start'}`}>
                        {getStatusBadge(null, trader.client.isActive, false)}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/stockship/admin/clients/${trader.client.id}/view`)}
                      className={`w-full mt-4 px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors ${isRTL ? 'flex-row-reverse flex items-center justify-center gap-2' : ''}`}
                    >
                      {t('mediation.viewTrader.viewClientProfile')}
                      {isRTL && <ArrowLeft className="w-4 h-4 rotate-180" />}
                    </button>
                  </CardContent>
                </Card>
              )}

              {/* Linked Employee */}
              {trader.employee && (
                <Card>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Briefcase className="w-5 h-5 text-green-500" />
                      {t('mediation.viewTrader.linkedEmployee')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={`space-y-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <div>
                      <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.employeeName')}</label>
                      <p className={`mt-1 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{trader.employee.name || t('common.notAvailable')}</p>
                    </div>
                    <div>
                      <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.employeeCode')}</label>
                      <p className={`mt-1 font-mono ${isRTL ? 'text-right' : 'text-left'}`}>{trader.employee.employeeCode || t('common.notAvailable')}</p>
                    </div>
                    <div>
                      <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.email')}</label>
                      <p className={`mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>{trader.employee.email || t('common.notAvailable')}</p>
                    </div>
                    <div>
                      <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.phone')}</label>
                      <p className={`mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>{trader.employee.phone || t('common.notAvailable')}</p>
                    </div>
                    <div>
                      <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('common.status')}</label>
                      <div className={`mt-1 ${isRTL ? 'flex justify-end' : 'flex justify-start'}`}>
                        {getStatusBadge(null, trader.employee.isActive, false)}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/stockship/admin/employees/${trader.employee.id}/view`)}
                      className={`w-full mt-4 px-4 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors ${isRTL ? 'flex-row-reverse flex items-center justify-center gap-2' : ''}`}
                    >
                      {t('mediation.viewTrader.viewEmployeeProfile')}
                      {isRTL && <ArrowLeft className="w-4 h-4 rotate-180" />}
                    </button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* QR Code & Important Dates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* QR Code */}
              {trader.qrCodeUrl && (() => {
                const isValidDataUrl = trader.qrCodeUrl.startsWith('data:image') && trader.qrCodeUrl.length > 100;
                const isValidHttpUrl = trader.qrCodeUrl.startsWith('http://') || trader.qrCodeUrl.startsWith('https://');
                
                if (!isValidDataUrl && !isValidHttpUrl) {
                  return null;
                }
                
                return (
                  <Card>
                    <CardHeader>
                      <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <QrCode className="w-5 h-5" />
                        {t('mediation.viewTrader.qrCode')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                      <img 
                        src={trader.qrCodeUrl} 
                        alt={t('mediation.viewTrader.qrCode')} 
                        className="w-48 h-48 object-contain border rounded mb-4"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <p className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-center'}`}>{t('mediation.viewTrader.qrCodeDescription')}</p>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Important Dates */}
              <Card>
                <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Calendar className="w-5 h-5" />
                    {t('mediation.viewTrader.importantDates')}
                  </CardTitle>
                </CardHeader>
                <CardContent className={`space-y-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div>
                    <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.createdAt')}</label>
                    <p className={`mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>{formatDate(trader.createdAt)}</p>
                  </div>
                  {trader.updatedAt && (
                    <div>
                      <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.lastUpdated')}</label>
                      <p className={`mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>{formatDate(trader.updatedAt)}</p>
                    </div>
                  )}
                  {trader.verifiedAt && (
                    <div>
                      <label className={`text-sm font-medium text-muted-foreground block ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.verifiedAt')}</label>
                      <p className={`mt-1 text-green-600 font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>{formatDate(trader.verifiedAt)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'offers' && (
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Package className="w-5 h-5" />
                {t('mediation.viewTrader.recentOffers')} ({trader.offers?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trader.offers && trader.offers.length > 0 ? (
                <div className="space-y-4">
                  {trader.offers.map((offer) => (
                    <div key={offer.id} className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${isRTL ? 'text-right' : 'text-left'}`}
                      onClick={() => navigate(`/stockship/admin/offers/${offer.id}/view`)}>
                      <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="flex-1">
                          <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <h3 className="font-semibold">{offer.title || offer.companyName || t('mediation.offers.untitled')}</h3>
                            {getStatusBadge(offer.status, true, false)}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className={isRTL ? 'text-right' : 'text-left'}>
                              <span className="text-muted-foreground">{t('mediation.viewTrader.offerDetails.items')}: </span>
                              <span className="font-medium">{offer._count?.items || 0}</span>
                            </div>
                            <div className={isRTL ? 'text-right' : 'text-left'}>
                              <span className="text-muted-foreground">{t('mediation.viewTrader.offerDetails.deals')}: </span>
                              <span className="font-medium">{offer._count?.deals || 0}</span>
                            </div>
                            <div className={isRTL ? 'text-right' : 'text-left'}>
                              <span className="text-muted-foreground">{t('mediation.viewTrader.offerDetails.cartons')}: </span>
                              <span className="font-medium">{offer.totalCartons || 0}</span>
                            </div>
                            <div className={isRTL ? 'text-right' : 'text-left'}>
                              <span className="text-muted-foreground">{t('mediation.viewTrader.offerDetails.cbm')}: </span>
                              <span className="font-medium">{offer.totalCBM || '0'}</span>
                            </div>
                          </div>
                          {offer.proformaInvoiceNo && (
                            <p className={`text-sm text-muted-foreground mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.offerDetails.proformaInvoice')}: {offer.proformaInvoiceNo}</p>
                          )}
                          <p className={`text-xs text-muted-foreground mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>{formatDate(offer.createdAt)}</p>
                        </div>
                        <Eye className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                  {trader.offers.length === 10 && (
                    <button
                      onClick={() => navigate(`/stockship/admin/offers?traderId=${id}`)}
                      className={`w-full py-2 text-sm text-primary hover:underline ${isRTL ? 'flex items-center justify-center gap-2 flex-row-reverse' : ''}`}
                    >
                      {t('mediation.viewTrader.viewAllOffers')}
                      {isRTL && <ArrowLeft className="w-4 h-4 rotate-180" />}
                    </button>
                  )}
                </div>
              ) : (
                <p className={`text-center text-muted-foreground py-8 ${isRTL ? 'text-right' : 'text-center'}`}>{t('mediation.viewTrader.noOffersFound')}</p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'deals' && (
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <ShoppingCart className="w-5 h-5" />
                {t('mediation.viewTrader.recentDeals')} ({trader.deals?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trader.deals && trader.deals.length > 0 ? (
                <div className="space-y-4">
                  {trader.deals.map((deal) => (
                    <div key={deal.id} className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${isRTL ? 'text-right' : 'text-left'}`}
                      onClick={() => navigate(`/stockship/admin/deals/${deal.id}/view`)}>
                      <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="flex-1">
                          <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <h3 className="font-semibold">{t('mediation.deals.deal')} #{deal.dealNumber || deal.id}</h3>
                            {getDealStatusBadge(deal.status)}
                          </div>
                          {deal.client && (
                            <p className={`text-sm text-muted-foreground mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {t('mediation.viewTrader.dealDetails.client')}: <span className="font-medium">{deal.client.name || t('common.notAvailable')}</span>
                              {deal.client.email && (
                                <span className={`text-xs text-muted-foreground ${isRTL ? 'mr-2' : 'ml-2'}`}>({deal.client.email})</span>
                              )}
                            </p>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-2">
                            <div className={isRTL ? 'text-right' : 'text-left'}>
                              <span className="text-muted-foreground">{t('mediation.viewTrader.dealDetails.items')}: </span>
                              <span className="font-medium">{deal._count?.items || 0}</span>
                            </div>
                            <div className={isRTL ? 'text-right' : 'text-left'}>
                              <span className="text-muted-foreground">{t('mediation.viewTrader.dealDetails.payments')}: </span>
                              <span className="font-medium">{deal._count?.payments || 0}</span>
                            </div>
                            {deal.negotiatedAmount && (
                              <div className={isRTL ? 'text-right' : 'text-left'}>
                                <span className="text-muted-foreground">{t('mediation.viewTrader.dealDetails.amount')}: </span>
                                <span className="font-medium">{formatCurrency(deal.negotiatedAmount)}</span>
                              </div>
                            )}
                            <div className={isRTL ? 'text-right' : 'text-left'}>
                              <span className="text-muted-foreground">{t('mediation.viewTrader.dealDetails.cbm')}: </span>
                              <span className="font-medium">{deal.totalCBM || '0'}</span>
                            </div>
                          </div>
                          {deal.payments && deal.payments.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className={`text-xs font-semibold text-muted-foreground mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('mediation.viewTrader.dealDetails.recentPayments')}:</p>
                              <div className="space-y-1">
                                {deal.payments.slice(0, 3).map((payment) => (
                                  <div key={payment.id} className={`flex items-center justify-between text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <span>{formatCurrency(payment.amount)} - {payment.method}</span>
                                    {getPaymentStatusBadge(payment.status)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <p className={`text-xs text-muted-foreground mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>{formatDate(deal.createdAt)}</p>
                        </div>
                        <Eye className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                  {trader.deals.length === 10 && (
                    <button
                      onClick={() => navigate(`/stockship/admin/deals?traderId=${id}`)}
                      className={`w-full py-2 text-sm text-primary hover:underline ${isRTL ? 'flex items-center justify-center gap-2 flex-row-reverse' : ''}`}
                    >
                      {t('mediation.viewTrader.viewAllDeals')}
                      {isRTL && <ArrowLeft className="w-4 h-4 rotate-180" />}
                    </button>
                  )}
                </div>
              ) : (
                <p className={`text-center text-muted-foreground py-8 ${isRTL ? 'text-right' : 'text-center'}`}>{t('mediation.viewTrader.noDealsFound')}</p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-6">
            {/* Financial Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="text-sm text-muted-foreground mb-1">{t('mediation.viewTrader.financial.totalPayments')}</p>
                      <p className="text-2xl font-bold">{formatCurrency(trader.statistics?.totalPayments || 0)}</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="text-sm text-muted-foreground mb-1">{t('mediation.viewTrader.financial.totalTransactions')}</p>
                      <p className="text-2xl font-bold">{formatCurrency(trader.statistics?.totalTransactions || 0)}</p>
                    </div>
                    <Receipt className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="text-sm text-muted-foreground mb-1">{t('mediation.viewTrader.financial.traderAmount')}</p>
                      <p className="text-2xl font-bold">{formatCurrency(trader.statistics?.totalTraderAmount || 0)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Offers by Status */}
            {trader.statistics?.offersByStatus && trader.statistics.offersByStatus.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <BarChart3 className="w-5 h-5" />
                    {t('mediation.viewTrader.offersByStatus')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {trader.statistics.offersByStatus.map((stat) => (
                      <div key={stat.status} className={`p-3 bg-gray-50 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                        <p className="text-sm text-muted-foreground">{stat.status || t('common.unknown')}</p>
                        <p className="text-2xl font-bold mt-1">{typeof stat._count === 'object' ? (stat._count?.status || 0) : (stat._count || 0)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deals by Status */}
            {trader.statistics?.dealsByStatus && trader.statistics.dealsByStatus.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Activity className="w-5 h-5" />
                    {t('mediation.viewTrader.dealsByStatus')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trader.statistics.dealsByStatus.map((stat) => (
                      <div key={stat.status} className={`p-4 bg-gray-50 rounded-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <p className="font-semibold">{stat.status || t('common.unknown')}</p>
                          <p className="text-2xl font-bold">{typeof stat._count === 'object' ? (stat._count?.status || 0) : (stat._count || 0)}</p>
                        </div>
                        <div className={`mt-1 ${isRTL ? 'flex justify-end' : 'flex justify-start'}`}>
                          {getDealStatusBadge(stat.status)}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm mt-3 pt-3 border-t">
                          {stat._sum.totalCartons > 0 && (
                            <div className={isRTL ? 'text-right' : 'text-left'}>
                              <span className="text-muted-foreground">{t('mediation.viewTrader.financial.cartons')}: </span>
                              <span className="font-medium">{stat._sum.totalCartons}</span>
                            </div>
                          )}
                          {stat._sum.totalCBM > 0 && (
                            <div className={isRTL ? 'text-right' : 'text-left'}>
                              <span className="text-muted-foreground">{t('mediation.viewTrader.financial.cbm')}: </span>
                              <span className="font-medium">{stat._sum.totalCBM}</span>
                            </div>
                          )}
                          {stat._sum.negotiatedAmount > 0 && (
                            <div className={isRTL ? 'text-right' : 'text-left'}>
                              <span className="text-muted-foreground">{t('mediation.viewTrader.financial.amount')}: </span>
                              <span className="font-medium">{formatCurrency(stat._sum.negotiatedAmount)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ViewTrader;
