import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { traderApi } from '@/lib/mediationApi';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Package, ShoppingCart, QrCode, Calendar, Building2, Download, X } from 'lucide-react';
import showToast from '@/lib/toast';

const ViewTrader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';
  const { getAuth } = useMultiAuth();
  const { user } = getAuth('employee');
  const [loading, setLoading] = useState(true);
  const [trader, setTrader] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    fetchTrader();
    if (searchParams.get('qr') === 'true') {
      setShowQRModal(true);
    }
  }, [id]);

  const fetchTrader = async () => {
    try {
      setLoading(true);
      const response = await traderApi.getTraderById(id);
      setTrader(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching trader:', error);
      showToast.error(
        t('mediation.employee.loadTraderFailed') || 'Failed to load trader',
        error.response?.data?.message || 'Trader not found'
      );
      navigate('/stockship/employee/traders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (trader) => {
    if (!trader.isActive) {
      return <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">{t('mediation.traders.inactive') || 'Inactive'}</span>;
    }
    if (trader.isVerified) {
      return <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">{t('mediation.traders.verified') || 'Verified'}</span>;
    }
    return <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">{t('mediation.traders.unverified') || 'Unverified'}</span>;
  };

  const downloadQRCode = () => {
    if (!trader?.qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = trader.qrCodeUrl;
    link.download = `trader-${trader.traderCode}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.employee.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!trader) {
    return null;
  }

  return (
    <motion.div
      dir={dir}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6 bg-gray-50/50 min-h-screen"
    >
      {/* Header: وضوح التباين وسهولة الوصول */}
      <div className={`flex flex-wrap items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/stockship/employee/traders')}
            className="p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 shadow-sm"
            aria-label={t('common.back') || 'Back'}
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </motion.button>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              {t('mediation.traders.viewDetails') || 'Trader Details'}
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              {trader.companyName || trader.name} · {trader.traderCode}
            </p>
          </div>
        </div>
        <div className={`flex flex-wrap items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            {t('mediation.employee.viewQR') || 'View QR Code'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/stockship/employee/traders/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 font-medium text-sm shadow-md"
          >
            <Edit className="w-4 h-4" />
            {t('common.edit') || 'Edit'}
          </motion.button>
        </div>
      </div>

      {/* Status + Quick actions */}
      <div className={`flex flex-wrap items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {getStatusBadge(trader)}
        <div className="h-4 w-px bg-gray-200 hidden sm:block" />
        <button
          type="button"
          onClick={() => navigate('/stockship/employee/offers', { state: { traderId: id } })}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Package className="w-4 h-4" />
          {t('mediation.traders.offers') || 'Offers'} ({trader._count?.offers ?? 0})
        </button>
        <button
          type="button"
          onClick={() => navigate('/stockship/employee/deals', { state: { traderId: id } })}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ShoppingCart className="w-4 h-4" />
          {t('mediation.traders.deals') || 'Deals'} ({trader._count?.deals ?? 0})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className={`flex items-center gap-2 text-gray-900 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Building2 className="w-5 h-5 text-gray-600 shrink-0" />
                {t('mediation.traders.basicInfo') || 'Basic Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">{t('mediation.traders.traderCode') || 'Trader Code'}</p>
                  <p className="font-mono font-semibold text-gray-900">{trader.traderCode || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">{t('mediation.traders.companyName') || 'Company Name'}</p>
                  <p className="font-medium text-gray-900">{trader.companyName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">{t('mediation.traders.contactPerson') || 'Contact Person'}</p>
                  <p className="font-medium text-gray-900">{trader.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">{t('mediation.common.email') || 'Email'}</p>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                    <p className="text-gray-900">{trader.email || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">{t('mediation.common.phone') || 'Phone'}</p>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                    <p className="text-gray-900">{trader.phone || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">{t('mediation.traders.barcode') || 'Barcode'}</p>
                  <p className="font-mono text-sm text-gray-900">{trader.barcode || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Info */}
          {(trader.country || trader.city) && (
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className={`flex items-center gap-2 text-gray-900 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <MapPin className="w-5 h-5 text-gray-600 shrink-0" />
                  {t('mediation.traders.location') || 'Location'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {trader.country && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium mb-1">{t('mediation.traders.country') || 'Country'}</p>
                      <p className="font-medium text-gray-900">{trader.country}</p>
                    </div>
                  )}
                  {trader.city && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium mb-1">{t('mediation.traders.city') || 'City'}</p>
                      <p className="font-medium text-gray-900">{trader.city}</p>
                    </div>
                  )}
                  {trader.countryCode && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium mb-1">{t('mediation.traders.countryCode') || 'Country Code'}</p>
                      <p className="font-medium text-gray-900">{trader.countryCode}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
<Card className="border border-gray-200 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className={`flex items-center gap-2 text-gray-900 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Package className="w-5 h-5 text-gray-600 shrink-0" />
                {t('mediation.traders.statistics') || 'Statistics'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-gray-600">{t('mediation.traders.totalOffers') || 'Total Offers'}</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{trader._count?.offers || 0}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-gray-600">{t('mediation.traders.totalDeals') || 'Total Deals'}</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{trader._count?.deals || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR Code Card */}
        <div className="space-y-6">
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className={`flex items-center gap-2 text-gray-900 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <QrCode className="w-5 h-5 text-gray-600 shrink-0" />
                {t('mediation.traders.qrCode') || 'QR Code'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {trader.qrCodeUrl ? (
                <div className="space-y-4">
                  <div className="flex justify-center p-4 bg-white rounded-lg border border-gray-200">
                    <img
                      src={trader.qrCodeUrl}
                      alt="QR Code"
                      className="w-48 h-48"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div style={{ display: 'none' }} className="text-center text-gray-500">
                      <QrCode className="w-24 h-24 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t('mediation.traders.qrCodeError') || 'QR Code not available'}</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={downloadQRCode}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4" />
                    {t('mediation.traders.downloadQR') || 'Download QR Code'}
                  </motion.button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <QrCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>{t('mediation.traders.noQRCode') || 'QR Code not available'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Created Date */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className={`flex items-center gap-2 text-gray-900 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Calendar className="w-5 h-5 text-gray-600 shrink-0" />
                {t('mediation.common.createdAt') || 'Created At'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-900">
                {trader.createdAt 
                  ? new Date(trader.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')
                  : 'N/A'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && trader.qrCodeUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {t('mediation.traders.qrCode') || 'QR Code'}
                </h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex justify-center p-4 bg-white rounded-lg border border-gray-200 mb-4">
                <img
                  src={trader.qrCodeUrl}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={downloadQRCode}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  <Download className="w-4 h-4" />
                  {t('mediation.traders.downloadQR') || 'Download'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowQRModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('common.close') || 'Close'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ViewTrader;




