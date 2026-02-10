import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Gift, 
  Package, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  MapPin,
  Tag,
  DollarSign,
  Upload,
  Download,
  Image as ImageIcon,
  Edit,
  FileSpreadsheet,
  Check,
  X,
  MessageSquare
} from 'lucide-react';
import { offerApi } from '@/lib/mediationApi';
import stockshipApi from '@/lib/stockshipApi';
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

const TraderViewOffer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuth } = useMultiAuth();
  const { t, language, isRTL } = useLanguage();
  
  // Get user once and memoize to prevent hook order changes
  const traderAuth = getAuth('trader');
  const user = traderAuth?.user || null;
  
  // Force LightGallery to be on top of everything and reset image styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .lg-outer { z-index: 10000 !important; }
      .lg-backdrop { z-index: 9999 !important; }
      .lg-content { z-index: 10001 !important; }
      .lg-toolbar { z-index: 10002 !important; }
      .lg-components { z-index: 10002 !important; }
      /* Ensure images are visible */
      .lg-img-wrap img {
          object-fit: contain !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState(null);
  const [platformSettings, setPlatformSettings] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);

  // Fetch pending update request for this offer
  useEffect(() => {
    if (offer?.id && offer.status === 'ACTIVE') {
      fetchPendingRequest();
    }
  }, [offer?.id, offer?.status]);

  const fetchPendingRequest = async () => {
    try {
      const response = await offerApi.getTraderOfferUpdateRequests({ offerId: offer.id });
      const requests = response.data?.data || response.data || [];
      const pending = requests.find(r => r.status === 'PENDING');
      setPendingRequest(pending || null);
    } catch (error) {
      console.error('Error fetching pending request:', error);
    }
  };

  const handleRequestEdit = () => {
    if (!offer) return;
    navigate(`/stockship/trader/offers/${offer.id}/request-edit`);
  };


  const fetchOffer = useCallback(async () => {
    try {
      setLoading(true);
      const response = await offerApi.getOfferById(id);
      const responseData = response.data?.data || response.data;
      
      // Extract offer and platformSettings from response
      const data = responseData.offer || responseData;
      const settings = responseData.platformSettings || null;
      
      // Set platform settings (from backend response)
      if (settings) {
        setPlatformSettings(settings);
      } else {
        // Fallback: Fetch platform settings separately if not included in response
        try {
          const settingsRes = await stockshipApi.get("/admin/platform-settings");
          const fallbackSettings = settingsRes.data?.data || settingsRes.data;
          setPlatformSettings(fallbackSettings);
        } catch (settingsError) {
          console.warn('Failed to fetch platform settings:', settingsError);
        }
      }
      
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
              // If parse fails, check if it might be a single image URL
              if (item.images.trim().length > 0) {
                item.images = [item.images];
              } else {
                item.images = [];
              }
            }
          }
          
          // Filter out invalid image URLs (text values like "الصورة", "图片", "NO IMAGE", etc.)
          if (item.images && Array.isArray(item.images)) {
            item.images = item.images.filter(imgUrl => {
              if (!imgUrl || typeof imgUrl !== 'string') return false;
              
              const trimmedUrl = imgUrl.trim();
              if (!trimmedUrl) return false;
              
              // Remove common text values that shouldn't be treated as image URLs
              const invalidTexts = ['الصورة', '图片', 'NO IMAGE', 'IMAGE', 'NO', 'N/A', 'null', 'undefined'];
              const lowerImgUrl = trimmedUrl.toLowerCase();
              
              if (invalidTexts.some(text => lowerImgUrl === text.toLowerCase())) {
                return false;
              }
              
              // Check if it's a valid URL or file path
              // Valid patterns: http://, https://, /uploads/, uploads/, data:image, or has file extension
              const validPatterns = [
                /^https?:\/\//i,  // http:// or https://
                /^\/uploads\//i,   // /uploads/
                /^uploads\//i,     // uploads/
                /^data:image/i,    // data:image (base64)
                /\.(jpg|jpeg|png|gif|webp|svg)$/i  // File extensions
              ];
              
              return validPatterns.some(pattern => pattern.test(trimmedUrl));
            });
          }
          
          return item;
        });
      }
      
      setOffer(data);
    } catch (error) {
      console.error('Error fetching offer:', error);
      showToast.error(
        t('mediation.offers.loadFailed') || 'Failed to load offer',
        error.response?.data?.message || 'Offer not found'
      );
      navigate('/stockship/trader/offers');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, t]);

  useEffect(() => {
    // Always fetch offer, even if user is not loaded yet (offerApi handles auth)
    fetchOffer();
  }, [fetchOffer]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.offers.draft') || 'Draft', icon: FileText },
      PENDING_VALIDATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('mediation.offers.pending') || 'Pending', icon: Clock },
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: t('mediation.offers.active') || 'Active', icon: CheckCircle },
      CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.offers.closed') || 'Closed', icon: XCircle },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: t('mediation.offers.rejected') || 'Rejected', icon: XCircle }
    };
    const config = statusConfig[status] || statusConfig.DRAFT;
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
    if (!amount) return '0.00';
    
    // Map invalid currency codes to valid ones
    const currencyMap = {
      'SR': 'SAR', // Saudi Riyal
      'SAR': 'SAR',
      'USD': 'USD',
      'EUR': 'EUR',
      'GBP': 'GBP',
      'JPY': 'JPY',
      'CNY': 'CNY',
      'AED': 'AED',
      'EGP': 'EGP',
      '¥': 'CNY', // Chinese Yuan symbol
      '$': 'USD', // Dollar symbol
      '€': 'EUR', // Euro symbol
      '£': 'GBP'  // Pound symbol
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
      // Fallback to USD if currency is invalid
      console.warn(`Invalid currency code: ${currency}, using USD instead`);
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
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
    const validPatterns = [/^https?:\/\//i, /^\/uploads\//i, /^uploads\//i, /^data:image/i];
    if (validPatterns.some(pattern => pattern.test(imgUrl.trim()))) return true;
    const invalidTexts = ['الصورة', '图片', 'NO IMAGE', 'IMAGE', 'NO', 'N/A', 'null', 'undefined', ''];
    if (invalidTexts.some(text => imgUrl.trim().toLowerCase() === text.toLowerCase())) return false;
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(imgUrl.trim());
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
            onClick={() => navigate('/stockship/trader/offers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </motion.button>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('mediation.trader.offerDetails') || 'Offer Details'} <span className="text-xs text-gray-400 font-normal">(v3)</span>
            </h1>
            <p className="text-muted-foreground mt-2">{offer.title || 'N/A'}</p>
          </div>
        </div>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {getStatusBadge(offer.status)}
          {offer.status === 'DRAFT' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/stockship/trader/offers/${offer.id}/edit`)}
              className={`flex items-center gap-2 px-6 py-2 bg-yellow-400 text-blue-900 font-bold rounded-lg hover:bg-yellow-300 transition-colors shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Edit className="w-4 h-4" />
              <span>{t('common.edit') || 'Edit'}</span>
            </motion.button>
          )}
          {offer.status === 'ACTIVE' && !pendingRequest && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRequestEdit}
                className={`flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Edit className="w-4 h-4" />
                <span>{t('mediation.offers.requestEdit') || 'Request Edit'}</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/stockship/trader/offers/${offer.id}/support-tickets/create`)}
                className={`flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t('mediation.support.createTicket') || 'Create Support Ticket'}</span>
              </motion.button>
            </>
          )}
          {offer.status === 'ACTIVE' && pendingRequest && (
            <div className={`flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{t('mediation.offers.editRequestPending') || 'Edit Request Pending'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Gift className="w-5 h-5 text-gray-600" />
                {t('mediation.trader.basicInfo') || 'Basic Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.offers.offerTitle') || 'Title'}
                  </label>
                  <p className="text-base text-gray-900">{offer.title || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.common.status') || 'Status'}
                  </label>
                  {getStatusBadge(offer.status)}
                </div>
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
                  <p className="text-base text-gray-900 flex items-center gap-2">
                    {offer.acceptsNegotiation ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">{t('common.yes') || 'Yes'}</span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 text-red-600" />
                        <span className="text-red-600">{t('common.no') || 'No'}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              {offer.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.trader.description') || 'Description'}
                  </label>
                  <p className="text-base text-gray-900 whitespace-pre-wrap">{offer.description}</p>
                </div>
              )}
              {(offer.country || offer.city) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images Gallery */}
          {adImages.length > 0 && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <ImageIcon className="w-5 h-5 text-gray-600" />
                  {t('mediation.trader.adImages') || 'Advertisement Images'}
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
                            e.target.parentElement.innerHTML = '<div class="h-32 flex items-center justify-center bg-gray-100 text-xs text-red-500">Error</div>';
                          }}
                        />
                      </a>
                    );
                  })}
                </LightGallery>
              </CardContent>
            </Card>
          )}

          {/* Items List */}
          {offer.items && offer.items.length > 0 && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Package className="w-5 h-5 text-gray-600" />
                  {t('mediation.offers.items') || 'Items'} ({offer.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {offer.items.map((item, index) => {
                    // Get item images
                    let itemImages = Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []);
                    
                    // Filter out invalid image URLs
                    itemImages = itemImages.filter(imgUrl => {
                      if (!imgUrl || typeof imgUrl !== 'string') return false;
                      const trimmedUrl = imgUrl.trim();
                      
                      // 1. If it looks like a valid URL/Path, accept it immediately (PRIORITY)
                      const validPatterns = [
                        /^https?:\/\//i,
                        /^\/uploads\//i,
                        /^uploads\//i,
                        /^data:image/i
                      ];
                      if (validPatterns.some(pattern => pattern.test(trimmedUrl))) {
                        return true;
                      }
                      
                      // 2. Remove specific invalid text values (Exact match only)
                      const invalidTexts = ['الصورة', '图片', 'NO IMAGE', 'IMAGE', 'NO', 'N/A', 'null', 'undefined', ''];
                      const lowerImgUrl = trimmedUrl.toLowerCase();
                      
                      if (invalidTexts.some(text => lowerImgUrl === text.toLowerCase())) {
                        return false;
                      }
                      
                      // 3. Fallback: Check for file extension
                      return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(trimmedUrl);
                    });
                    
                    return (
                      <div key={item.id || index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-500">#{item.displayOrder || (index + 1)}</span>
                              <h3 className="text-lg font-semibold text-gray-900">{item.productName || item.description || `Item ${index + 1}`}</h3>
                            </div>
                            {item.description && item.description !== item.productName && (
                              <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              {/* Item details */}
                              {item.itemNo && (
                                <div>
                                  <span className="text-gray-500">{t('mediation.items.itemNo') || 'Item No'}:</span>
                                  <span className="ml-2 font-medium text-gray-900">{item.itemNo}</span>
                                </div>
                              )}
                              {item.quantity && (
                                <div>
                                  <span className="text-gray-500">{t('mediation.items.quantity') || 'Quantity'}:</span>
                                  <span className="ml-2 font-medium text-gray-900">{item.quantity.toLocaleString()} {item.unit || 'SET'}</span>
                                </div>
                              )}
                              {item.unitPrice && (
                                <div>
                                  <span className="text-gray-500">{t('mediation.items.unitPrice') || 'Unit Price'}:</span>
                                  <span className="ml-2 font-medium text-gray-900">{formatCurrency(item.unitPrice, item.currency)}</span>
                                </div>
                              )}
                              {item.totalCBM && (
                                <div>
                                  <span className="text-gray-500">{t('mediation.items.totalCBM') || 'Total CBM'}:</span>
                                  <span className="ml-2 font-medium text-gray-900">{(Number(item.totalCBM) || 0).toFixed(4)}</span>
                                </div>
                              )}
                            </div>
                            {item.colour && (
                              <div className="mt-2">
                                <span className="text-sm text-gray-500">{t('mediation.items.colour') || 'Colour'}:</span>
                                <span className="ml-2 text-sm text-gray-900">{item.colour}</span>
                              </div>
                            )}
                            {item.spec && (
                              <div className="mt-2">
                                <span className="text-sm text-gray-500">{t('mediation.items.spec') || 'Specifications'}:</span>
                                <span className="ml-2 text-sm text-gray-900">{item.spec}</span>
                              </div>
                            )}
                          </div>
                          {itemImages.length > 0 && (
                            <LightGallery
                              key={`item-images-${index}-${itemImages.length}`}
                              speed={500}
                              plugins={[lgThumbnail, lgZoom, lgFullscreen, lgRotate]}
                              licenseKey="0000-0000-000-0000"
                              elementClassNames="flex gap-2"
                              selector="a"
                            >
                              {itemImages.map((imgUrl, imgIndex) => {
                                const src = getImageUrl(imgUrl);
                                const isVisible = imgIndex < 4;
                                const isPlusButton = imgIndex === 3 && itemImages.length > 4;
                                
                                if (!isVisible) {
                                  return (
                                    <a key={imgIndex} data-src={src} href={src} className="hidden" onClick={(e) => e.preventDefault()}>
                                      <img src={src} alt={`Hidden item image ${imgIndex + 1}`} />
                                    </a>
                                  );
                                }
                                
                                if (isPlusButton) {
                                  return (
                                    <a 
                                      key={imgIndex} 
                                      data-src={src}
                                      href={src}
                                      onClick={(e) => e.preventDefault()}
                                      className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors relative"
                                      style={{ textDecoration: 'none' }}
                                    >
                                      <span className="z-10 font-bold">+{itemImages.length - 3}</span>
                                      <img src={src} alt="" className="hidden" /> 
                                    </a>
                                  );
                                }

                                return (
                                  <a
                                    key={imgIndex}
                                    data-src={src}
                                    href={src}
                                    onClick={(e) => e.preventDefault()}
                                    className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden cursor-pointer block"
                                  >
                                    <img
                                      src={src}
                                      alt={`Item ${index + 1} image ${imgIndex + 1}`}
                                      className="w-full h-full object-cover hover:scale-110 transition-transform"
                                      onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Error'; }}
                                    />
                                  </a>
                                );
                              })}
                            </LightGallery>
                          )}
                          {itemImages.length === 0 && (
                             <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                               <ImageIcon className="w-6 h-6 text-gray-300" />
                             </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Excel File */}
          {offer.excelFileUrl && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <FileSpreadsheet className="w-5 h-5 text-gray-600" />
                  {t('mediation.trader.excelFile') || 'Excel File'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">{offer.excelFileName || 'excel-file.xlsx'}</p>
                      {offer.excelFileSize && (
                        <p className="text-sm text-gray-500">{(offer.excelFileSize / 1024 / 1024).toFixed(2)} MB</p>
                      )}
                    </div>
                  </div>
                  <a
                    href={offer.excelFileUrl.startsWith('http') ? offer.excelFileUrl : `${API_URL}${offer.excelFileUrl.startsWith('/') ? '' : '/'}${offer.excelFileUrl}`}
                    download
                    className={`flex items-center gap-2 px-6 py-2.5 bg-yellow-400 text-blue-900 font-bold rounded-lg hover:bg-yellow-300 transition-colors shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('common.download') || 'Download'}</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Stats */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <FileText className="w-5 h-5 text-gray-600" />
                {t('mediation.trader.summary') || 'Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">
                  {t('mediation.offers.totalItems') || 'Total Items'}
                </label>
                <p className="text-2xl font-bold text-gray-900">{offer._count?.items || offer.items?.length || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">
                  {t('mediation.offers.totalCartons') || 'Total Cartons'}
                </label>
                <p className="text-2xl font-bold text-gray-900">{offer.totalCartons || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">
                  {t('mediation.offers.totalCBM') || 'Total CBM'}
                </label>
                <p className="text-2xl font-bold text-gray-900">{(Number(offer.totalCBM) || 0).toFixed(3)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">
                  {t('mediation.offers.deals') || 'Deals'}
                </label>
                <p className="text-2xl font-bold text-gray-900">{offer._count?.deals || 0}</p>
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
                <label className="text-sm font-medium text-gray-500 mb-1 block">
                  {t('mediation.common.createdAt') || 'Created At'}
                </label>
                <p className="text-sm text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(offer.createdAt)}
                </p>
              </div>
              {offer.validatedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.offers.validatedAt') || 'Validated At'}
                  </label>
                  <p className="text-sm text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {formatDate(offer.validatedAt)}
                  </p>
                </div>
              )}
              {offer.closedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.offers.closedAt') || 'Closed At'}
                  </label>
                  <p className="text-sm text-gray-900 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    {formatDate(offer.closedAt)}
                  </p>
                </div>
              )}
              {offer.excelDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.trader.excelDate') || 'Excel Date'}
                  </label>
                  <p className="text-sm text-gray-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-gray-400" />
                    {formatDate(offer.excelDate)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trader Information */}
          {offer.trader && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Gift className="w-5 h-5 text-gray-600" />
                  {t('mediation.trader.traderInfo') || 'Trader Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.traders.name') || 'Name'}
                  </label>
                  <p className="text-sm text-gray-900">{offer.trader.name || 'N/A'}</p>
                </div>
                {offer.trader.companyName && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-1 block">
                      {t('mediation.traders.companyName') || 'Company Name'}
                    </label>
                    <p className="text-sm text-gray-900">{offer.trader.companyName}</p>
                  </div>
                )}
                  {offer.trader.traderCode && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-1 block">
                      {t('mediation.traders.traderCode') || 'Trader Code'}
                    </label>
                    <p className="text-sm text-gray-900 font-mono">{offer.trader.traderCode}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Platform Commission Rate Card */}
          {platformSettings && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  {t('mediation.trader.platformCommission') || 'Platform Commission Rate'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.trader.commissionRate') || 'Commission Rate'}
                  </label>
                  <p className="text-base font-semibold text-gray-900">
                    {platformSettings.platformCommissionRate || 0}%
                  </p>
                </div>
                {platformSettings.commissionMethod && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-1 block">
                      {t('mediation.trader.commissionMethod') || 'Commission Method'}
                    </label>
                    <p className="text-sm text-gray-900">
                      {platformSettings.commissionMethod === 'PERCENTAGE' && (t('mediation.trader.percentage') || 'Percentage')}
                      {platformSettings.commissionMethod === 'CBM' && (t('mediation.trader.cbm') || 'CBM')}
                      {platformSettings.commissionMethod === 'BOTH' && (t('mediation.trader.both') || 'Both (Percentage or CBM)')}
                    </p>
                  </div>
                )}
                {platformSettings.cbmRate && (platformSettings.commissionMethod === 'CBM' || platformSettings.commissionMethod === 'BOTH') && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-1 block">
                      {t('mediation.trader.cbmRate') || 'CBM Rate'}
                    </label>
                    <p className="text-sm text-gray-900">
                      ${formatCurrency(platformSettings.cbmRate)} / CBM
                    </p>
                  </div>
                )}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    {t('mediation.trader.commissionNote') || 'Note: This commission will be deducted from completed deals. The platform will take the higher value if "Both" method is selected.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TraderViewOffer;

