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
  Store,
  User,
  Save,
  Loader2,
  Eye,
  MessageSquare
} from 'lucide-react';
import { offerApi } from '@/lib/mediationApi';
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

const EmployeeViewOffer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuth } = useMultiAuth();
  const { t, language, isRTL } = useLanguage();
  
  const employeeAuth = getAuth('employee');
  const user = employeeAuth?.user || null;
  
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
  const [validating, setValidating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    images: [],
    country: '',
    city: '',
    categoryId: null,
    acceptsNegotiation: false
  });
  const [validationData, setValidationData] = useState({
    approved: true,
    validationNotes: ''
  });
  const excelFileInputRef = React.useRef(null);

  const fetchOffer = useCallback(async () => {
    try {
      setLoading(true);
      const response = await offerApi.getOfferById(id);
      const responseData = response.data?.data || response.data;
      
      // Extract offer from response (backend returns { offer, platformSettings })
      const data = responseData.offer || responseData;
      
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
          
          // Filter out invalid image URLs
          if (item.images && Array.isArray(item.images)) {
            item.images = item.images.filter(imgUrl => {
              if (!imgUrl || typeof imgUrl !== 'string') return false;
              
              const trimmedUrl = imgUrl.trim();
              if (!trimmedUrl) return false;
              
              const invalidTexts = ['الصورة', '图片', 'NO IMAGE', 'IMAGE', 'NO', 'N/A', 'null', 'undefined'];
              const lowerImgUrl = trimmedUrl.toLowerCase();
              
              if (invalidTexts.some(text => lowerImgUrl === text.toLowerCase() || lowerImgUrl.includes(text.toLowerCase()))) {
                return false;
              }
              
              const validPatterns = [
                /^https?:\/\//i,
                /^\/uploads\//i,
                /^uploads\//i,
                /^data:image/i,
                /\.(jpg|jpeg|png|gif|webp|svg)$/i
              ];
              
              return validPatterns.some(pattern => pattern.test(trimmedUrl));
            });
          }
          
          return item;
        });
      }
      
      setOffer(data);
      // Initialize edit data
      setEditData({
        title: data.title || '',
        description: data.description || '',
        images: Array.isArray(data.images) ? data.images : (data.images ? JSON.parse(data.images) : []),
        country: data.country || '',
        city: data.city || '',
        categoryId: data.categoryId || null,
        acceptsNegotiation: data.acceptsNegotiation || false
      });
    } catch (error) {
      console.error('Error fetching offer:', error);
      showToast.error(
        t('mediation.employee.loadOfferFailed') || 'Failed to load offer',
        error.response?.data?.message || 'Offer not found'
      );
      navigate('/stockship/employee/offers');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, t]);

  useEffect(() => {
    fetchOffer();
  }, [fetchOffer]);

  const handleValidate = async () => {
    if (!offer) return;

    try {
      setValidating(true);
      await offerApi.validateOffer(offer.id, validationData);
      showToast.success(
        validationData.approved 
          ? (t('mediation.employee.offerApproved') || 'Offer Approved')
          : (t('mediation.employee.offerRejected') || 'Offer Rejected'),
        validationData.approved
          ? (t('mediation.employee.offerApprovedSuccess') || 'Offer has been approved successfully')
          : (t('mediation.employee.offerRejectedSuccess') || 'Offer has been rejected')
      );
      // Refresh offer data
      await fetchOffer();
    } catch (error) {
      console.error('Error validating offer:', error);
      showToast.error(
        t('mediation.employee.validateFailed') || 'Failed to validate offer',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setValidating(false);
    }
  };

  const handleUpdateOffer = async () => {
    if (!offer) return;

    try {
      setValidating(true);
      await offerApi.updateOffer(offer.id, editData);
      showToast.success(
        t('mediation.offers.updated') || 'Offer Updated',
        t('mediation.offers.updatedSuccess') || 'Offer has been updated successfully'
      );
      setEditing(false);
      await fetchOffer();
    } catch (error) {
      console.error('Error updating offer:', error);
      showToast.error(
        t('mediation.offers.updateFailed') || 'Failed to update offer',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setValidating(false);
    }
  };

  const handleUploadExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      showToast.error(
        t('mediation.offers.invalidFileType') || 'Invalid File Type',
        language === 'ar' ? 'يرجى اختيار ملف Excel (.xlsx, .xls, .csv)' : 'Please select an Excel file (.xlsx, .xls, .csv)'
      );
      return;
    }

    try {
      setUploadingExcel(true);
      await offerApi.uploadOfferExcelEmployee(offer.id, file);
      showToast.success(
        t('mediation.offers.fileUploaded') || 'File Uploaded',
        t('mediation.offers.excelUploadedSuccess') || 'Excel file uploaded and processed successfully'
      );
      await fetchOffer();
    } catch (error) {
      console.error('Error uploading Excel:', error);
      showToast.error(
        t('mediation.offers.uploadFailed') || 'Failed to upload file',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setUploadingExcel(false);
      if (excelFileInputRef.current) {
        excelFileInputRef.current.value = '';
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.offers.draft') || 'Draft', icon: FileText },
      PENDING_VALIDATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('mediation.offers.pendingValidation') || 'Pending Validation', icon: Clock },
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: t('mediation.offers.active') || 'Active', icon: CheckCircle },
      CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.offers.closed') || 'Closed', icon: XCircle },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: t('mediation.offers.rejected') || 'Rejected', icon: XCircle },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.offers.inactive') || 'Inactive', icon: Package }
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
    if (!amount && amount !== 0) return '0.00';
    
    const currencyMap = {
      'SR': 'SAR',
      'SAR': 'SAR',
      'USD': 'USD',
      'EUR': 'EUR',
      'GBP': 'GBP',
      'JPY': 'JPY',
      'CNY': 'CNY',
      'AED': 'AED',
      'EGP': 'EGP',
      '¥': 'CNY',
      '$': 'USD',
      '€': 'EUR',
      '£': 'GBP'
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
    const trimmedUrl = imgUrl.trim();
    if (!trimmedUrl) return false;
    
    // 1. If it looks like a valid URL/Path, accept it immediately (PRIORITY)
    const validPatterns = [/^https?:\/\//i, /^\/uploads\//i, /^uploads\//i, /^data:image/i];
    if (validPatterns.some(pattern => pattern.test(trimmedUrl))) return true;
    
    // 2. Remove specific invalid text values (Exact match only)
    const invalidTexts = ['الصورة', '图片', 'NO IMAGE', 'IMAGE', 'NO', 'N/A', 'null', 'undefined', ''];
    if (invalidTexts.some(text => trimmedUrl.toLowerCase() === text.toLowerCase())) return false;
    
    // 3. Fallback: Check for file extension
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(trimmedUrl);
  });

  const canValidate = offer.status === 'PENDING_VALIDATION' || offer.status === 'DRAFT';

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
            onClick={() => navigate('/stockship/employee/offers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </motion.button>
          {offer.status === 'ACTIVE' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/stockship/employee/offers/${offer.id}/support-tickets/create`)}
              className={`flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t('mediation.support.createTicket') || 'Create Support Ticket'}</span>
            </motion.button>
          )}
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('mediation.employee.offerDetails') || 'Offer Details'}
            </h1>
            <p className="text-muted-foreground mt-2">{offer.title || 'N/A'}</p>
          </div>
        </div>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {getStatusBadge(offer.status)}
          {!editing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              {language === 'ar' ? 'تعديل' : 'Edit'}
            </motion.button>
          )}
          {editing && (
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setEditing(false);
                  setEditData({
                    title: offer.title || '',
                    description: offer.description || '',
                    images: Array.isArray(offer.images) ? offer.images : (offer.images ? JSON.parse(offer.images) : []),
                    country: offer.country || '',
                    city: offer.city || '',
                    categoryId: offer.categoryId || null,
                    acceptsNegotiation: offer.acceptsNegotiation || false
                  });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUpdateOffer}
                disabled={validating}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {validating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {language === 'ar' ? 'حفظ' : 'Save'}
                  </>
                )}
              </motion.button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Gift className="w-5 h-5 text-gray-600" />
                {t('mediation.employee.basicInfo') || 'Basic Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.offers.offerTitle') || 'Title'}
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  ) : (
                    <p className="text-base text-gray-900">{offer.title || 'N/A'}</p>
                  )}
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
                {offer.trader && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-1 block">
                      {t('mediation.offers.trader') || 'Trader'}
                    </label>
                    <p className="text-base text-gray-900 flex items-center gap-2">
                      <Store className="w-4 h-4 text-gray-400" />
                      {offer.trader.companyName || offer.trader.name || 'N/A'}
                    </p>
                  </div>
                )}
                {offer.trader?.traderCode && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-1 block">
                      {t('mediation.traders.traderCode') || 'Trader Code'}
                    </label>
                    <p className="text-base text-gray-900">{offer.trader.traderCode}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">
                  {t('mediation.trader.description') || 'Description'}
                </label>
                {editing ? (
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                    rows="4"
                  />
                ) : (
                  <p className="text-base text-gray-900 whitespace-pre-wrap">{offer.description || 'N/A'}</p>
                )}
              </div>
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

          {/* Excel File */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <FileSpreadsheet className="w-5 h-5 text-gray-600" />
                  {t('mediation.trader.excelFile') || 'Excel File'}
                </div>
                <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  {language === 'ar' ? 'رفع ملف جديد' : 'Upload New File'}
                  <input
                    ref={excelFileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleUploadExcel}
                    disabled={uploadingExcel}
                    className="hidden"
                  />
                </label>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {uploadingExcel ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">{language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</span>
                </div>
              ) : offer.excelFileUrl ? (
                <div className={`flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <FileSpreadsheet className="w-10 h-10 text-blue-600" />
                  <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <p className="font-medium text-gray-900">{offer.excelFileName || 'Offer Excel File'}</p>
                    {offer.excelFileSize && (
                      <p className="text-sm text-gray-500 mt-1">
                        {(offer.excelFileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                  <a
                    href={offer.excelFileUrl.startsWith('http') ? offer.excelFileUrl : `${API_URL}${offer.excelFileUrl}`}
                    download
                    className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('common.download') || 'Download'}</span>
                  </a>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {language === 'ar' ? 'لا يوجد ملف Excel' : 'No Excel file uploaded'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Offer Items */}
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
                    let itemImages = Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []);
                    
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
                      const invalidTexts = ['الصورة', '图片', 'NO IMAGE', 'IMAGE', 'NO', 'N/A', 'null', 'undefined'];
                      const lowerImgUrl = trimmedUrl.toLowerCase();
                      
                      if (invalidTexts.some(text => lowerImgUrl === text.toLowerCase())) {
                        return false;
                      }
                      
                      // 3. Fallback: Check for file extension
                      return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(trimmedUrl);
                    });

                    return (
                      <div key={item.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className={`flex flex-col md:flex-row gap-4 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                          {/* Item Images */}
                          {itemImages.length > 0 && (
                            <LightGallery
                              key={`item-images-${index}-${itemImages.length}`}
                              speed={500}
                              plugins={[lgThumbnail, lgZoom, lgFullscreen, lgRotate]}
                              licenseKey="0000-0000-000-0000"
                              elementClassNames={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
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
                          
                          {/* Item Details */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {item.productName || item.description || `Item ${index + 1}`}
                                </h3>
                                {item.itemNo && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    {t('mediation.offers.itemNo') || 'Item No.'}: {item.itemNo}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {item.description && item.description !== item.productName && (
                              <p className="text-sm text-gray-600">{item.description}</p>
                            )}
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                              <div>
                                <label className="text-xs text-gray-500 block">{t('mediation.offers.quantity') || 'Quantity'}</label>
                                <p className="text-sm font-medium text-gray-900">{item.quantity || 0} {item.unit || 'SET'}</p>
                              </div>
                              {item.unitPrice && (
                                <div>
                                  <label className="text-xs text-gray-500 block">{t('mediation.offers.unitPrice') || 'Unit Price'}</label>
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatCurrency(item.unitPrice, item.currency)}
                                  </p>
                                </div>
                              )}
                              {item.amount && (
                                <div>
                                  <label className="text-xs text-gray-500 block">{t('mediation.offers.amount') || 'Amount'}</label>
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatCurrency(item.amount, item.currency)}
                                  </p>
                                </div>
                              )}
                              {item.totalCBM && (
                                <div>
                                  <label className="text-xs text-gray-500 block">{t('mediation.offers.totalCBM') || 'Total CBM'}</label>
                                  <p className="text-sm font-medium text-gray-900">{parseFloat(item.totalCBM).toFixed(4)}</p>
                                </div>
                              )}
                            </div>
                            
                            {(item.colour || item.spec || item.packing) && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {item.colour && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    {t('mediation.offers.colour') || 'Colour'}: {item.colour}
                                  </span>
                                )}
                                {item.spec && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    {t('mediation.offers.spec') || 'Spec'}: {item.spec}
                                  </span>
                                )}
                                {item.packing && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    {t('mediation.offers.packing') || 'Packing'}: {item.packing}
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {(item.cartonLength || item.cartonWidth || item.cartonHeight) && (
                              <div className="text-xs text-gray-500 mt-2">
                                {t('mediation.offers.cartonSize') || 'Carton Size'}: {item.cartonLength || 0} × {item.cartonWidth || 0} × {item.cartonHeight || 0} cm
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation Section (if pending) */}
          {canValidate && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="w-5 h-5 text-gray-600" />
                  {t('mediation.employee.validationDecision') || 'Validation Decision'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <label className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <input
                      type="radio"
                      name="approved"
                      checked={validationData.approved === true}
                      onChange={() => setValidationData(prev => ({ ...prev, approved: true }))}
                      disabled={validating}
                      className="w-4 h-4 text-green-600"
                    />
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">{t('mediation.employee.approve') || 'Approve'}</span>
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <input
                      type="radio"
                      name="approved"
                      checked={validationData.approved === false}
                      onChange={() => setValidationData(prev => ({ ...prev, approved: false }))}
                      disabled={validating}
                      className="w-4 h-4 text-red-600"
                    />
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-gray-900">{t('mediation.employee.reject') || 'Reject'}</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('mediation.employee.validationNotes') || 'Validation Notes'}
                  </label>
                  <textarea
                    value={validationData.validationNotes}
                    onChange={(e) => setValidationData(prev => ({ ...prev, validationNotes: e.target.value }))}
                    placeholder={t('mediation.employee.validationNotesPlaceholder') || 'Add notes about your validation decision...'}
                    className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none ${isRTL ? 'text-right' : 'text-left'}`}
                    rows="4"
                    disabled={validating}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleValidate}
                  disabled={validating}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white transition-colors disabled:opacity-50 ${
                    validationData.approved 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  } ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  {validating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('mediation.employee.validating') || 'Validating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {validationData.approved 
                        ? (t('mediation.employee.approveOffer') || 'Approve Offer')
                        : (t('mediation.employee.rejectOffer') || 'Reject Offer')
                      }
                    </>
                  )}
                </motion.button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Offer Statistics */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <DollarSign className="w-5 h-5 text-gray-600" />
                {t('mediation.employee.statistics') || 'Statistics'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  {t('mediation.offers.totalItems') || 'Total Items'}
                </label>
                <p className="text-2xl font-bold text-gray-900">
                  {offer._count?.items || offer.items?.length || 0}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  {t('mediation.offers.totalCartons') || 'Total Cartons'}
                </label>
                <p className="text-2xl font-bold text-gray-900">
                  {offer.totalCartons || 0}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  {t('mediation.offers.totalCBM') || 'Total CBM'}
                </label>
                <p className="text-2xl font-bold text-gray-900">
                  {offer.totalCBM ? parseFloat(offer.totalCBM).toFixed(3) : '0.000'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Calendar className="w-5 h-5 text-gray-600" />
                {t('mediation.employee.dates') || 'Important Dates'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  {t('mediation.common.createdAt') || 'Created At'}
                </label>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {formatDate(offer.createdAt)}
                </p>
              </div>
              {offer.validatedAt && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    {t('mediation.employee.validatedAt') || 'Validated At'}
                  </label>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {formatDate(offer.validatedAt)}
                  </p>
                </div>
              )}
              {offer.validatedBy && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    {t('mediation.employee.validatedBy') || 'Validated By'}
                  </label>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    {offer.validatedBy?.name || `Employee #${offer.validatedBy}`}
                  </p>
                </div>
              )}
              {offer.validationNotes && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    {t('mediation.employee.validationNotes') || 'Validation Notes'}
                  </label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{offer.validationNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trader Information */}
          {offer.trader && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Store className="w-5 h-5 text-gray-600" />
                  {t('mediation.offers.traderInfo') || 'Trader Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    {t('mediation.traders.companyName') || 'Company Name'}
                  </label>
                  <p className="text-sm font-medium text-gray-900">{offer.trader.companyName || 'N/A'}</p>
                </div>
                {offer.trader.traderCode && (
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">
                      {t('mediation.traders.traderCode') || 'Trader Code'}
                    </label>
                    <p className="text-sm font-medium text-gray-900">{offer.trader.traderCode}</p>
                  </div>
                )}
                {offer.trader.email && (
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">
                      {t('common.email') || 'Email'}
                    </label>
                    <p className="text-sm font-medium text-gray-900">{offer.trader.email}</p>
                  </div>
                )}
                {offer.trader.phone && (
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">
                      {t('common.phone') || 'Phone'}
                    </label>
                    <p className="text-sm font-medium text-gray-900">{offer.trader.phone}</p>
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

export default EmployeeViewOffer;



