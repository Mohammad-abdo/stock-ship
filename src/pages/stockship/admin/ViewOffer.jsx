import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Gift, 
  Package, 
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
  Loader2
} from 'lucide-react';
import showToast from '@/lib/toast';
import { countries, getFlagUrl } from '@/data/countries';

// Resolve country name to ISO code for flag
const getCountryCode = (v) => {
  if (!v || typeof v !== 'string') return '';
  const t = v.trim();
  if (t.length === 2 && t === t.toUpperCase()) return t;
  const c = countries.find((x) => x.nameEn === t || x.nameAr === t);
  return c ? c.code : '';
};

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
          {/* Basic Information – نفس تصميم لوحة التاجر */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Gift className="w-5 h-5 text-gray-600" />
                {t('mediation.viewOffer.basicInfo') || 'Basic Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.offers.title') || 'Title'}
                  </label>
                  <p className="text-base text-gray-900">{offer.title || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.common.status')}
                  </label>
                  <div className="mt-1">{getStatusBadge(offer.status)}</div>
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
                          {t('common.country')}
                        </label>
                        <p className="text-base text-gray-900 flex items-center gap-2">
                          {getCountryCode(offer.country) ? (
                            <img
                              src={getFlagUrl(getCountryCode(offer.country))}
                              alt=""
                              className="w-6 h-4 object-cover rounded-sm border border-gray-200"
                            />
                          ) : (
                            <MapPin className="w-4 h-4 text-gray-400" />
                          )}
                          {offer.country}
                        </p>
                      </div>
                    )}
                    {offer.city && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-1 block">
                          {t('common.city')}
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
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <ImageIcon className="w-5 h-5 text-gray-600" />
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

          {/* Excel File – نفس تصميم لوحة التاجر */}
          {offer.excelFileUrl && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <FileSpreadsheet className="w-5 h-5 text-gray-600" />
                  {t('mediation.trader.excelFile') || 'Excel File'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="font-medium text-gray-900">{offer.excelFileName || 'excel-file.xlsx'}</p>
                      {offer.excelFileSize && (
                        <p className="text-sm text-gray-500">{(offer.excelFileSize / 1024 / 1024).toFixed(2)} MB</p>
                      )}
                      {offer.companyName && (
                        <p className="text-sm text-gray-600 mt-1">{t('mediation.traders.companyName')}: {offer.companyName}</p>
                      )}
                      {offer.proformaInvoiceNo && (
                        <p className="text-sm text-gray-600">{t('mediation.offers.proformaInvoiceNo')}: {offer.proformaInvoiceNo}</p>
                      )}
                      {offer.excelDate && (
                        <p className="text-sm text-gray-600">{t('mediation.offers.excelDate')}: {formatDate(offer.excelDate)}</p>
                      )}
                    </div>
                  </div>
                  <a
                    href={offer.excelFileUrl.startsWith('http') ? offer.excelFileUrl : `${API_URL}${offer.excelFileUrl}`}
                    download
                    className={`flex items-center gap-2 px-6 py-2.5 bg-yellow-400 text-blue-900 font-bold rounded-lg hover:bg-yellow-300 transition-colors shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('common.download')}</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Offer Items – بطاقات كلوحة التاجر */}
          {offer.items && offer.items.length > 0 && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Package className="w-5 h-5 text-gray-600" />
                  {t('mediation.viewOffer.items') || 'Items'} ({offer.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {offer.items.slice(0, 100).map((item, index) => {
                    const itemImages = (Array.isArray(item.images) ? item.images : []).filter(imgUrl =>
                      imgUrl && typeof imgUrl === 'string' && (/^https?:\/\//i.test(imgUrl) || /^\/uploads\//i.test(imgUrl) || /^uploads\//i.test(imgUrl) || /^data:image/i.test(imgUrl) || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(imgUrl))
                    );
                    return (
                      <div key={item.id || index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-500">#{item.displayOrder ?? item.itemNo ?? index + 1}</span>
                              <h3 className="text-lg font-semibold text-gray-900">{item.productName || item.description || `Item ${index + 1}`}</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              {item.itemNo && (
                                <div><span className="text-gray-500">{t('mediation.items.itemNo')}:</span> <span className="font-medium text-gray-900">{item.itemNo}</span></div>
                              )}
                              {item.quantity != null && (
                                <div><span className="text-gray-500">{t('mediation.items.quantity')}:</span> <span className="font-medium text-gray-900">{item.quantity.toLocaleString()} {item.unit || 'SET'}</span></div>
                              )}
                              {item.unitPrice != null && (
                                <div><span className="text-gray-500">{t('mediation.items.unitPrice')}:</span> <span className="font-medium text-gray-900">{formatCurrency(item.unitPrice, item.currency)}</span></div>
                              )}
                              {(item.totalCBM ?? item.cbm) != null && (
                                <div><span className="text-gray-500">{t('mediation.items.totalCBM') || 'CBM'}:</span> <span className="font-medium text-gray-900">{(Number(item.totalCBM ?? item.cbm) || 0).toFixed(4)}</span></div>
                              )}
                            </div>
                            {item.colour && <p className="text-sm text-gray-600">{t('mediation.items.colour')}: {item.colour}</p>}
                            {item.spec && <p className="text-sm text-gray-600">{t('mediation.items.spec')}: {item.spec}</p>}
                          </div>
                          {itemImages.length > 0 ? (
                            <LightGallery speed={500} plugins={[lgThumbnail, lgZoom, lgFullscreen, lgRotate]} licenseKey="0000-0000-000-0000" elementClassNames="flex gap-2" selector="a">
                              {itemImages.slice(0, 4).map((imgUrl, imgIndex) => {
                                const src = getImageUrl(imgUrl);
                                return (
                                  <a key={imgIndex} data-src={src} href={src} onClick={(e) => e.preventDefault()} className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden block">
                                    <img src={src} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                  </a>
                                );
                              })}
                            </LightGallery>
                          ) : (
                            <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {offer.items.length > 100 && (
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    {t('mediation.viewOffer.showingFirst50') || 'Showing first 100 of'} {offer.items.length} {t('mediation.viewOffer.items') || 'items'}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar – نفس تصميم لوحة التاجر */}
        <div className="space-y-6">
          {/* Summary */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <FileText className="w-5 h-5 text-gray-600" />
                {t('mediation.trader.summary') || 'Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">{t('mediation.offers.totalItems') || 'Total Items'}</label>
                <p className="text-2xl font-bold text-gray-900">{offer._count?.items ?? offer.items?.length ?? 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">{t('mediation.offers.totalCartons') || 'Total Cartons'}</label>
                <p className="text-2xl font-bold text-gray-900">{offer.totalCartons ?? 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">{t('mediation.offers.totalCBM') || 'Total CBM'}</label>
                <p className="text-2xl font-bold text-gray-900">{(Number(offer.totalCBM) || 0).toFixed(3)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">{t('mediation.offers.deals') || 'Deals'}</label>
                <p className="text-2xl font-bold text-gray-900">{offer._count?.deals ?? 0}</p>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Calendar className="w-5 h-5 text-gray-600" />
                {t('mediation.trader.dates') || 'Important Dates'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">{t('mediation.viewOffer.createdAt') || 'Created At'}</label>
                <p className="text-sm text-gray-900 flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />{formatDate(offer.createdAt)}</p>
              </div>
              {offer.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">{t('mediation.viewOffer.lastUpdated') || 'Last Updated'}</label>
                  <p className="text-sm text-gray-900">{formatDate(offer.updatedAt)}</p>
                </div>
              )}
              {offer.validatedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">{t('mediation.viewOffer.validatedAt') || 'Validated At'}</label>
                  <p className="text-sm text-gray-900 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" />{formatDate(offer.validatedAt)}</p>
                </div>
              )}
              {offer.closedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">{t('mediation.offers.closedAt') || 'Closed At'}</label>
                  <p className="text-sm text-gray-900 flex items-center gap-2"><XCircle className="w-4 h-4 text-gray-600" />{formatDate(offer.closedAt)}</p>
                </div>
              )}
              {offer.excelDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">{t('mediation.trader.excelDate') || 'Excel Date'}</label>
                  <p className="text-sm text-gray-900 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-gray-400" />{formatDate(offer.excelDate)}</p>
                </div>
              )}
              {offer.validationNotes && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">{t('mediation.offers.validationNotes') || 'Validation Notes'}</label>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{offer.validationNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trader in sidebar (مختصر) */}
          {offer.trader && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Gift className="w-5 h-5 text-gray-600" />
                  {t('mediation.trader.traderInfo') || 'Trader'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">{t('mediation.traders.name')}</label>
                  <p className="text-sm text-gray-900">{offer.trader.name || 'N/A'}</p>
                </div>
                {offer.trader.companyName && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-1 block">{t('mediation.traders.companyName')}</label>
                    <p className="text-sm text-gray-900">{offer.trader.companyName}</p>
                  </div>
                )}
                {offer.trader.traderCode && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-1 block">{t('mediation.traders.traderCode')}</label>
                    <p className="text-sm text-gray-900 font-mono">{offer.trader.traderCode}</p>
                  </div>
                )}
                {offer.trader.country && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-1 block">{t('mediation.traders.country')}</label>
                    <p className="text-sm text-gray-900 flex items-center gap-2">
                      {getCountryCode(offer.trader.country) && (
                        <img src={getFlagUrl(getCountryCode(offer.trader.country))} alt="" className="w-5 h-3.5 object-cover rounded border border-gray-200" />
                      )}
                      {offer.trader.country}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ViewOffer;
