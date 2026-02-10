import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Gift, 
  Store, 
  Package, 
  ShoppingCart, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Box,
  Image as ImageIcon,
  MapPin,
  Tag,
  DollarSign,
  Download,
  FileSpreadsheet,
  User,
  Building2,
  Mail,
  Phone,
  Hash,
  Loader2
} from 'lucide-react';
import showToast from '@/lib/toast';

// LightGallery functionality
import LightGallery from 'lightgallery/react';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-thumbnail.css';
import 'lightgallery/css/lg-fullscreen.css';
import 'lightgallery/css/lg-rotate.css';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgZoom from 'lightgallery/plugins/zoom';
import lgFullscreen from 'lightgallery/plugins/fullscreen';
import lgRotate from 'lightgallery/plugins/rotate';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Image Helper to build full URL
const getImageUrl = (imgUrl) => {
  if (!imgUrl) return '';
  if (imgUrl.startsWith('http') || imgUrl.startsWith('data:image')) return imgUrl;
  
  if (imgUrl.startsWith('/uploads/')) return `${API_URL}${imgUrl}`;
  if (imgUrl.startsWith('uploads/')) return `${API_URL}/${imgUrl}`;
  return `${API_URL}/uploads/${imgUrl}`;
};

const ViewOffer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState(null);

  useEffect(() => {
    fetchOffer();
  }, [id]);

  const fetchOffer = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getOffer(id);
      const data = response.data.data || response.data;
      
      // Parse images if they're strings
      if (data.images && typeof data.images === 'string') {
        try {
          data.images = JSON.parse(data.images);
        } catch (e) {
          data.images = [];
        }
      }
      
      // Parse images for each item
      if (data.items && Array.isArray(data.items)) {
        data.items = data.items.map(item => {
          if (item.images && typeof item.images === 'string') {
            try {
              item.images = JSON.parse(item.images);
            } catch (e) {
              item.images = [];
            }
          }
          return item;
        });
      }
      
      setOffer(data);
    } catch (error) {
      console.error('Error fetching offer:', error);
      showToast.error(
        t('mediation.offers.loadFailed') || 'Failed to load offer', 
        error.response?.data?.message || t('common.notFound') || 'Offer not found'
      );
      navigate('/stockship/admin/offers');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: t('mediation.offers.active') || 'Active', icon: CheckCircle },
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.offers.draft') || 'Draft', icon: FileText },
      PENDING_VALIDATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('mediation.offers.pendingValidation') || 'Pending Validation', icon: Calendar },
      VALIDATED: { bg: 'bg-blue-100', text: 'text-blue-800', label: t('mediation.offers.validated') || 'Validated', icon: CheckCircle },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: t('mediation.offers.rejected') || 'Rejected', icon: XCircle },
      EXPIRED: { bg: 'bg-orange-100', text: 'text-orange-800', label: t('mediation.offers.expired') || 'Expired', icon: Calendar },
      CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.offers.closed') || 'Closed', icon: XCircle }
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status || t('common.unknown') || 'Unknown', icon: FileText };
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount && amount !== 0) return '0.00';
    
    const currencyMap = {
      'SR': 'SAR', 'SAR': 'SAR', 'USD': 'USD', 'EUR': 'EUR', 'GBP': 'GBP',
      'JPY': 'JPY', 'CNY': 'CNY', 'AED': 'AED', 'EGP': 'EGP',
      '¥': 'CNY', '$': 'USD', '€': 'EUR', '£': 'GBP'
    };
    
    const validCurrency = currencyMap[currency?.toUpperCase()] || currency || 'USD';
    
    try {
      return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
        style: 'currency',
        currency: validCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('mediation.offers.loading') || 'Loading offer details...'}</p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return null;
  }

  // Ensure images is an array and filter invalid URLs
  const adImages = (Array.isArray(offer.images) ? offer.images : []).filter(imgUrl => {
    if (!imgUrl || typeof imgUrl !== 'string') return false;
    const trimmedUrl = imgUrl.trim();
    if (!trimmedUrl) return false;
    
    const validPatterns = [/^https?:\/\//i, /^\/uploads\//i, /^uploads\//i, /^data:image/i];
    if (validPatterns.some(pattern => pattern.test(trimmedUrl))) return true;
    
    const invalidTexts = ['الصورة', '图片', 'NO IMAGE', 'IMAGE', 'NO', 'N/A', 'null', 'undefined', ''];
    if (invalidTexts.some(text => trimmedUrl.toLowerCase() === text.toLowerCase())) return false;
    
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(trimmedUrl);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/stockship/admin/offers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </motion.button>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('mediation.offers.title') || 'Offer'} - {t('mediation.offers.viewDetails') || 'View Details'}
            </h1>
            <p className="text-muted-foreground mt-2">{offer.title || 'N/A'}</p>
          </div>
        </div>
        {getStatusBadge(offer.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Gift className="w-5 h-5 text-blue-600" />
                {t('mediation.viewOffer.basicInfo') || 'Basic Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.common.id') || 'ID'}
                  </label>
                  <p className="text-base font-mono text-gray-900">{offer.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.common.status') || 'Status'}
                  </label>
                  <div className="mt-1">{getStatusBadge(offer.status)}</div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.offers.title') || 'Title'}
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{offer.title || 'N/A'}</p>
                </div>
                {offer.description && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500 mb-1 block">
                      {t('mediation.offers.description') || 'Description'}
                    </label>
                    <p className="text-base text-gray-900 whitespace-pre-wrap">{offer.description}</p>
                  </div>
                )}
                {offer.category && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-1 block">
                      {t('mediation.trader.category') || 'Category'}
                    </label>
                    <p className="text-base text-gray-900 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      {offer.category}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.trader.acceptsNegotiation') || 'Accepts Negotiation'}
                  </label>
                  <p className="text-base text-gray-900">
                    {offer.acceptsNegotiation ? (
                      <span className="text-green-600">{t('common.yes') || 'Yes'}</span>
                    ) : (
                      <span className="text-red-600">{t('common.no') || 'No'}</span>
                    )}
                  </p>
                </div>
                {(offer.country || offer.city) && (
                  <>
                    {offer.country && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-1 block">
                          {t('common.country') || 'Country'}
                        </label>
                        <p className="text-base text-gray-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {offer.country}
                        </p>
                      </div>
                    )}
                    {offer.city && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-1 block">
                          {t('common.city') || 'City'}
                        </label>
                        <p className="text-base text-gray-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {offer.city}
                        </p>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.viewOffer.totalCBM') || 'Total CBM'}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Box className="w-4 h-4 text-gray-400" />
                    <p className="text-base font-semibold text-gray-900">{offer.totalCBM || 0} CBM</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.viewOffer.totalCartons') || 'Total Cartons'}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Package className="w-4 h-4 text-gray-400" />
                    <p className="text-base font-semibold text-gray-900">{offer.totalCartons || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images Gallery */}
          {adImages.length > 0 && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  {t('mediation.trader.adImages') || 'Advertisement Images'} ({adImages.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <LightGallery
                  key={`ad-images-${adImages.length}`}
                  speed={500}
                  plugins={[lgThumbnail, lgZoom, lgFullscreen, lgRotate]}
                  licenseKey="0000-0000-000-0000"
                  elementClassNames="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                  selector="a"
                >
                  {adImages.map((imgUrl, index) => {
                    const src = getImageUrl(imgUrl);
                    return (
                      <a 
                        key={index}
                        data-src={src}
                        href={src}
                        onClick={(e) => e.preventDefault()}
                        className="block rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-all"
                      >
                        <img
                          src={src}
                          alt={`Ad image ${index + 1}`}
                          className="w-full h-32 object-cover block"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </a>
                    );
                  })}
                </LightGallery>
              </CardContent>
            </Card>
          )}

          {/* Excel File */}
          {offer.excelFileUrl && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  {t('mediation.trader.excelFile') || 'Excel File'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className={`flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <FileSpreadsheet className="w-10 h-10 text-green-600" />
                  <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <p className="font-medium text-gray-900">{offer.excelFileName || 'Offer Excel File'}</p>
                    {offer.excelFileSize && (
                      <p className="text-sm text-gray-500 mt-1">
                        {(offer.excelFileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                    {offer.companyName && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>{t('mediation.traders.companyName') || 'Company'}:</strong> {offer.companyName}
                      </p>
                    )}
                    {offer.proformaInvoiceNo && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>{t('mediation.offers.proformaInvoiceNo') || 'Proforma Invoice No'}:</strong> {offer.proformaInvoiceNo}
                      </p>
                    )}
                    {offer.excelDate && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>{t('mediation.offers.excelDate') || 'Excel Date'}:</strong> {formatDate(offer.excelDate)}
                      </p>
                    )}
                  </div>
                  <a
                    href={offer.excelFileUrl.startsWith('http') ? offer.excelFileUrl : `${API_URL}${offer.excelFileUrl}`}
                    download
                    className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('common.download') || 'Download'}</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trader Information */}
          {offer.trader && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Store className="w-5 h-5 text-indigo-600" />
                  {t('mediation.viewOffer.traderInfo') || 'Trader Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('mediation.common.name') || 'Name'}</p>
                      <p className="font-semibold text-gray-900">{offer.trader.name || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('mediation.traders.companyName') || 'Company Name'}</p>
                      <p className="font-semibold text-gray-900">{offer.trader.companyName || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Hash className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('mediation.traders.traderCode') || 'Trader Code'}</p>
                      <p className="font-semibold text-gray-900 font-mono">{offer.trader.traderCode || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('mediation.traders.country') || 'Country'}</p>
                      <p className="font-semibold text-gray-900">{offer.trader.country || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('mediation.traders.city') || 'City'}</p>
                      <p className="font-semibold text-gray-900">{offer.trader.city || '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Offer Items */}
          {offer.items && offer.items.length > 0 && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-amber-50 to-yellow-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <FileText className="w-5 h-5 text-amber-600" />
                  {t('mediation.viewOffer.items') || 'Items'} ({offer.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className={`text-left p-3 text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                          {t('mediation.items.itemNo') || 'Item No'}
                        </th>
                        <th className={`text-left p-3 text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                          {t('mediation.items.description') || 'Description'}
                        </th>
                        <th className={`text-left p-3 text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                          {t('mediation.items.quantity') || 'Quantity'}
                        </th>
                        <th className={`text-left p-3 text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                          {t('mediation.items.unit') || 'Unit'}
                        </th>
                        <th className={`text-left p-3 text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                          {t('mediation.items.unitPrice') || 'Unit Price'}
                        </th>
                        <th className={`text-left p-3 text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                          {t('mediation.viewOffer.cbm') || 'CBM'}
                        </th>
                        <th className={`text-left p-3 text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                          {t('mediation.viewOffer.cartons') || 'Cartons'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {offer.items.slice(0, 100).map((item) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className={`p-3 text-sm ${isRTL ? 'text-right' : ''}`}>{item.itemNo || '-'}</td>
                          <td className={`p-3 text-sm ${isRTL ? 'text-right' : ''}`}>
                            <div>
                              <p className="font-medium text-gray-900">{item.productName || item.description || 'N/A'}</p>
                              {item.colour && (
                                <p className="text-xs text-gray-500">{t('mediation.items.colour') || 'Colour'}: {item.colour}</p>
                              )}
                              {item.spec && (
                                <p className="text-xs text-gray-500">{t('mediation.items.spec') || 'Spec'}: {item.spec}</p>
                              )}
                            </div>
                          </td>
                          <td className={`p-3 text-sm ${isRTL ? 'text-right' : ''}`}>{item.quantity || 0}</td>
                          <td className={`p-3 text-sm ${isRTL ? 'text-right' : ''}`}>{item.unit || '-'}</td>
                          <td className={`p-3 text-sm ${isRTL ? 'text-right' : ''}`}>
                            {item.unitPrice ? formatCurrency(item.unitPrice, item.currency) : '-'}
                          </td>
                          <td className={`p-3 text-sm ${isRTL ? 'text-right' : ''}`}>{item.totalCBM || item.cbm || 0}</td>
                          <td className={`p-3 text-sm ${isRTL ? 'text-right' : ''}`}>{item.cartons || item.packageQuantity || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {offer.items.length > 100 && (
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                      {t('mediation.viewOffer.showingFirst50') || 'Showing first 100 of'} {offer.items.length} {t('mediation.viewOffer.items') || 'items'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Package className="w-5 h-5 text-teal-600" />
                {t('mediation.viewOffer.statistics') || 'Statistics'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{offer._count?.items || 0}</p>
                    <p className="text-sm text-gray-600">{t('mediation.viewOffer.totalItems') || 'Total Items'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <ShoppingCart className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{offer._count?.deals || 0}</p>
                    <p className="text-sm text-gray-600">{t('mediation.viewOffer.totalDeals') || 'Total Deals'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dates */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Calendar className="w-5 h-5 text-gray-600" />
                {t('mediation.viewOffer.importantDates') || 'Important Dates'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">
                  {t('mediation.viewOffer.createdAt') || 'Created At'}
                </label>
                <p className="text-sm font-medium text-gray-900">{formatDate(offer.createdAt)}</p>
              </div>
              {offer.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.viewOffer.lastUpdated') || 'Last Updated'}
                  </label>
                  <p className="text-sm font-medium text-gray-900">{formatDate(offer.updatedAt)}</p>
                </div>
              )}
              {offer.validatedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.viewOffer.validatedAt') || 'Validated At'}
                  </label>
                  <p className="text-sm font-medium text-gray-900">{formatDate(offer.validatedAt)}</p>
                </div>
              )}
              {offer.closedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.offers.closedAt') || 'Closed At'}
                  </label>
                  <p className="text-sm font-medium text-gray-900">{formatDate(offer.closedAt)}</p>
                </div>
              )}
              {offer.validationNotes && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.offers.validationNotes') || 'Validation Notes'}
                  </label>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                    {offer.validationNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default ViewOffer;
