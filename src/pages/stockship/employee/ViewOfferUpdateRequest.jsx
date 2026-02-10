import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Gift, 
  FileText,
  MapPin,
  Tag,
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  AlertCircle,
  Edit2,
  X,
  Image as ImageIcon,
  Package,
  Store,
  User,
  Download,
  FileSpreadsheet,
  Building2,
  Mail,
  Phone
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { employeeApi } from '@/lib/mediationApi';
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

const ViewOfferUpdateRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { getAuth } = useMultiAuth();
  const { user } = getAuth('employee');

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'

  useEffect(() => {
    if (user?.id && id) {
      fetchUpdateRequest();
    }
  }, [user?.id, id]);

  const fetchUpdateRequest = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getOfferUpdateRequestById(id);
      setRequest(response.data?.data || response.data);
    } catch (error) {
      console.error('Error fetching update request:', error);
      showToast.error(t('mediation.offers.updateRequest.loadFailed') || 'Failed to load update request');
      navigate('/stockship/employee/offer-update-requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    setActionType('approve');
    setShowConfirmModal(true);
  };

  const handleReject = () => {
    if (!reviewNotes.trim()) {
      showToast.error(t('mediation.offers.updateRequest.reviewNotesRequired') || 'Please provide rejection reason');
      return;
    }
    setActionType('reject');
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    if (!request) return;

    try {
      setProcessing(true);
      
      if (actionType === 'approve') {
        await employeeApi.approveOfferUpdateRequest(request.id, {
          reviewNotes: reviewNotes.trim() || undefined
        });
        showToast.success(t('mediation.offers.updateRequest.approved') || 'Update request approved successfully');
      } else {
        await employeeApi.rejectOfferUpdateRequest(request.id, {
          reviewNotes: reviewNotes.trim()
        });
        showToast.success(t('mediation.offers.updateRequest.rejected') || 'Update request rejected');
      }
      
      setShowConfirmModal(false);
      navigate('/stockship/employee/offer-update-requests');
    } catch (error) {
      console.error(`Error ${actionType}ing request:`, error);
      showToast.error(
        error.response?.data?.message || 
        (actionType === 'approve' 
          ? t('mediation.offers.updateRequest.approveFailed') 
          : t('mediation.offers.updateRequest.rejectFailed')) || 
        `Failed to ${actionType} request`
      );
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: t('mediation.offers.updateRequest.status.pending') || 'Pending' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: t('mediation.offers.updateRequest.status.approved') || 'Approved' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: t('mediation.offers.updateRequest.status.rejected') || 'Rejected' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle, label: t('mediation.offers.updateRequest.status.cancelled') || 'Cancelled' },
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle, label: status };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const renderFieldComparison = (fieldKey, fieldLabel, currentValue, newValue, icon) => {
    const Icon = icon;
    const hasChange = currentValue !== newValue;
    
    // Helper function to translate category keys
    const translateValue = (value) => {
      if (!value) return value;
      if (typeof value === 'string' && value.startsWith('category.')) {
        return t(value) || value;
      }
      return value;
    };
    
    const translatedCurrent = translateValue(currentValue);
    const translatedNew = translateValue(newValue);
    
    return (
      <div className={`p-4 rounded-lg border-2 ${hasChange ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
        <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Icon className={`w-5 h-5 ${hasChange ? 'text-blue-600' : 'text-gray-500'}`} />
          <Label className={`text-sm font-semibold ${hasChange ? 'text-blue-900' : 'text-gray-700'}`}>
            {fieldLabel}
          </Label>
          {hasChange && (
            <span className="ml-auto px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {t('common.changed') || 'Changed'}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">
              {t('common.current') || 'Current'}
            </Label>
            <p className="text-sm text-gray-700 break-words">
              {translatedCurrent || <span className="text-gray-400 italic">N/A</span>}
            </p>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">
              {t('common.requested') || 'Requested'}
            </Label>
            <p className={`text-sm break-words ${hasChange ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
              {translatedNew || <span className="text-gray-400 italic">N/A</span>}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('mediation.offers.updateRequest.notFound') || 'Update request not found'}</p>
        </div>
      </div>
    );
  }

  const offer = request.offer;
  const requestedData = request.requestedData || {};
  const canReview = request.status === 'PENDING';

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
            onClick={() => navigate('/stockship/employee/offer-update-requests')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </motion.button>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('mediation.offers.updateRequest.title') || 'Offer Update Request'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {offer?.title || 'N/A'}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {getStatusBadge(request.status)}
          {canReview && (
            <>
              <Button
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {t('common.approve') || 'Approve'}
              </Button>
              <Button
                onClick={handleReject}
                variant="destructive"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {t('common.reject') || 'Reject'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Request Info */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
            <FileText className="w-5 h-5 text-gray-600" />
            {t('mediation.offers.updateRequest.requestInfo') || 'Request Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500 mb-1 block">
                {t('mediation.offers.updateRequest.requestedAt') || 'Requested At'}
              </Label>
              <p className="text-sm text-gray-900">
                {new Date(request.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
              </p>
            </div>
            {request.reviewedAt && (
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-1 block">
                  {t('mediation.offers.updateRequest.reviewedAt') || 'Reviewed At'}
                </Label>
                <p className="text-sm text-gray-900">
                  {new Date(request.reviewedAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                </p>
              </div>
            )}
            {request.reviewer && (
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-1 block">
                  {t('mediation.offers.updateRequest.reviewedBy') || 'Reviewed By'}
                </Label>
                <p className="text-sm text-gray-900">
                  {request.reviewer.name} ({request.reviewer.employeeCode})
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Offer Details */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Gift className="w-5 h-5 text-gray-600" />
                {t('mediation.offers.updateRequest.offerInfo') || 'Current Offer Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.offers.offerTitle') || 'Title'}
                  </Label>
                  <p className="text-base text-gray-900">{offer?.title || 'N/A'}</p>
                </div>
                {offer?.category && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-1 block">
                      {t('mediation.trader.category') || 'Category'}
                    </Label>
                    <p className="text-base text-gray-900 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      {offer.category?.startsWith('category.') 
                        ? t(offer.category) || offer.category 
                        : offer.category}
                    </p>
                  </div>
                )}
                {(offer?.acceptsPriceNegotiation !== undefined || offer?.acceptsQuantityNegotiation !== undefined) ? (
                  <>
                    {offer?.acceptsPriceNegotiation !== undefined && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 mb-1 block">
                          {t('mediation.trader.acceptPriceNegotiation') || 'Accepts Price Negotiation'}
                        </Label>
                        <p className="text-base text-gray-900 flex items-center gap-2">
                          {offer.acceptsPriceNegotiation ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-green-600">{t('common.yes') || 'Yes'}</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span className="text-red-600">{t('common.no') || 'No'}</span>
                            </>
                          )}
                        </p>
                      </div>
                    )}
                    {offer?.acceptsQuantityNegotiation !== undefined && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 mb-1 block">
                          {t('mediation.trader.acceptQuantityNegotiation') || 'Accepts Quantity Negotiation'}
                        </Label>
                        <p className="text-base text-gray-900 flex items-center gap-2">
                          {offer.acceptsQuantityNegotiation ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-green-600">{t('common.yes') || 'Yes'}</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span className="text-red-600">{t('common.no') || 'No'}</span>
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-1 block">
                      {t('mediation.offers.acceptsNegotiation') || 'Accepts Negotiation'}
                    </Label>
                    <p className="text-base text-gray-900 flex items-center gap-2">
                      {offer?.acceptsNegotiation ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">{t('common.yes') || 'Yes'}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-red-600">{t('common.no') || 'No'}</span>
                        </>
                      )}
                    </p>
                  </div>
                )}
                {(offer?.country || offer?.city) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {offer.country && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 mb-1 block">
                          {t('common.country') || 'Country'}
                        </Label>
                        <p className="text-base text-gray-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {offer.country}
                        </p>
                      </div>
                    )}
                    {offer.city && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 mb-1 block">
                          {t('common.city') || 'City'}
                        </Label>
                        <p className="text-base text-gray-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {offer.city}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {offer?.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.trader.description') || 'Description'}
                  </Label>
                  <p className="text-base text-gray-900 whitespace-pre-wrap">{offer.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images Gallery */}
          {offer?.images && (() => {
            let adImages = [];
            if (offer.images) {
              try {
                adImages = typeof offer.images === 'string' 
                  ? JSON.parse(offer.images) 
                  : offer.images;
                if (!Array.isArray(adImages)) adImages = [];
              } catch (e) {
                adImages = [];
              }
            }
            
            // Filter invalid images
            adImages = adImages.filter(imgUrl => {
              if (!imgUrl || typeof imgUrl !== 'string') return false;
              const trimmedUrl = imgUrl.trim();
              if (!trimmedUrl) return false;
              
              const validPatterns = [/^https?:\/\//i, /^\/uploads\//i, /^uploads\//i, /^data:image/i];
              if (validPatterns.some(pattern => pattern.test(trimmedUrl))) return true;
              
              const invalidTexts = ['الصورة', '图片', 'NO IMAGE', 'IMAGE', 'NO', 'N/A', 'null', 'undefined', ''];
              if (invalidTexts.some(text => trimmedUrl.toLowerCase() === text.toLowerCase())) return false;
              
              return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(trimmedUrl);
            });

            if (adImages.length === 0) return null;

            return (
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
                              e.target.parentElement.innerHTML = '<div class="h-32 flex items-center justify-center bg-gray-100 text-xs text-red-500">Error</div>';
                            }}
                          />
                        </a>
                      );
                    })}
                  </LightGallery>
                </CardContent>
              </Card>
            );
          })()}

          {/* Excel File */}
          {offer?.excelFileUrl && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <FileSpreadsheet className="w-5 h-5 text-gray-600" />
                  {t('mediation.trader.excelFile') || 'Excel File'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
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
              </CardContent>
            </Card>
          )}

          {/* Offer Items */}
          {offer?.items && Array.isArray(offer.items) && offer.items.length > 0 && (() => {
            // Parse items images
            const parsedItems = offer.items.map(item => {
              let itemImages = [];
              if (item.images) {
                try {
                  itemImages = typeof item.images === 'string' 
                    ? JSON.parse(item.images) 
                    : item.images;
                  if (!Array.isArray(itemImages)) itemImages = [];
                } catch (e) {
                  itemImages = [];
                }
              }
              
              // Filter invalid images
              itemImages = itemImages.filter(imgUrl => {
                if (!imgUrl || typeof imgUrl !== 'string') return false;
                const trimmedUrl = imgUrl.trim();
                if (!trimmedUrl) return false;
                
                const validPatterns = [/^https?:\/\//i, /^\/uploads\//i, /^uploads\//i, /^data:image/i];
                if (validPatterns.some(pattern => pattern.test(trimmedUrl))) return true;
                
                const invalidTexts = ['الصورة', '图片', 'NO IMAGE', 'IMAGE', 'NO', 'N/A', 'null', 'undefined'];
                if (invalidTexts.some(text => trimmedUrl.toLowerCase() === text.toLowerCase())) return false;
                
                return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(trimmedUrl);
              });

              return { ...item, itemImages };
            });

            return (
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200 bg-gray-50">
                  <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Package className="w-5 h-5 text-gray-600" />
                    {t('mediation.offers.items') || 'Items'} ({parsedItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {parsedItems.map((item, index) => (
                      <div key={item.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className={`flex flex-col md:flex-row gap-4 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                          {/* Item Images */}
                          {item.itemImages && item.itemImages.length > 0 && (
                            <LightGallery
                              key={`item-images-${index}-${item.itemImages.length}`}
                              speed={500}
                              plugins={[lgThumbnail, lgZoom, lgFullscreen, lgRotate]}
                              licenseKey="0000-0000-000-0000"
                              elementClassNames={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                              selector="a"
                            >
                              {item.itemImages.slice(0, 4).map((imgUrl, imgIndex) => {
                                const src = getImageUrl(imgUrl);
                                const isPlusButton = imgIndex === 3 && item.itemImages.length > 4;
                                
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
                                      <span className="z-10 font-bold">+{item.itemImages.length - 3}</span>
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
                              {/* Hidden images for gallery */}
                              {item.itemImages.slice(4).map((imgUrl, imgIndex) => {
                                const src = getImageUrl(imgUrl);
                                return (
                                  <a key={imgIndex + 4} data-src={src} href={src} className="hidden" onClick={(e) => e.preventDefault()}>
                                    <img src={src} alt={`Hidden item image ${imgIndex + 5}`} />
                                  </a>
                                );
                              })}
                            </LightGallery>
                          )}
                          {(!item.itemImages || item.itemImages.length === 0) && (
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
                                <p className="text-sm font-medium text-gray-900">{item.quantity || 0} {item.unit || ''}</p>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block">{t('mediation.offers.unitPrice') || 'Unit Price'}</label>
                                <p className="text-sm font-medium text-gray-900">
                                  {item.unitPrice ? parseFloat(item.unitPrice).toFixed(2) : '0.00'} {item.currency || 'USD'}
                                </p>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block">{t('mediation.offers.amount') || 'Amount'}</label>
                                <p className="text-sm font-medium text-gray-900">
                                  {item.amount ? parseFloat(item.amount).toFixed(2) : '0.00'} {item.currency || 'USD'}
                                </p>
                              </div>
                              {item.totalCBM && (
                                <div>
                                  <label className="text-xs text-gray-500 block">{t('mediation.offers.totalCBM') || 'Total CBM'}</label>
                                  <p className="text-sm font-medium text-gray-900">{parseFloat(item.totalCBM).toFixed(3)}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Offer Changes */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Edit2 className="w-5 h-5 text-gray-600" />
                {t('mediation.offers.updateRequest.changes') || 'Requested Changes'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {renderFieldComparison('title', t('mediation.offers.offerTitle') || 'Title', offer?.title, requestedData.title, Gift)}
              {renderFieldComparison('description', t('mediation.trader.description') || 'Description', offer?.description, requestedData.description, FileText)}
              {renderFieldComparison('country', t('mediation.trader.country') || 'Country', offer?.country, requestedData.country, MapPin)}
              {renderFieldComparison('city', t('mediation.trader.city') || 'City', offer?.city, requestedData.city, MapPin)}
              {renderFieldComparison('category', t('mediation.trader.category') || 'Category', 
                offer?.category?.startsWith('category.') ? t(offer.category) || offer.category : offer?.category, 
                requestedData.category?.startsWith('category.') ? t(requestedData.category) || requestedData.category : requestedData.category, 
                Tag
              )}
              {/* Excel File Changes */}
              {(requestedData.excelFileUrl || requestedData.excelFileName) && (
                <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                  <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                    <Label className="text-sm font-semibold text-blue-900">
                      {t('mediation.trader.excelFile') || 'Excel File'}
                    </Label>
                    <span className="ml-auto px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {t('common.changed') || 'Changed'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">
                        {t('common.current') || 'Current'}
                      </Label>
                      {offer?.excelFileUrl ? (
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{offer.excelFileName || 'Excel File'}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">N/A</span>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">
                        {t('common.requested') || 'Requested'}
                      </Label>
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-700 font-medium">
                          {requestedData.excelFileName || 'New Excel File'}
                        </span>
                        {requestedData.excelFileSize && (
                          <span className="text-xs text-gray-500">
                            ({(requestedData.excelFileSize / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Items Changes */}
              {requestedData.items && Array.isArray(requestedData.items) && requestedData.items.length > 0 && (
                <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                  <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Package className="w-5 h-5 text-blue-600" />
                    <Label className="text-sm font-semibold text-blue-900">
                      {t('mediation.offers.items') || 'Items'}
                    </Label>
                    <span className="ml-auto px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {t('common.changed') || 'Changed'} ({requestedData.items.length} {t('common.items') || 'items'})
                    </span>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-2 block">
                      {t('common.requested') || 'Requested'} {t('mediation.offers.items') || 'Items'}
                    </Label>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white p-2">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className={`px-2 py-1 text-left text-xs font-semibold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {t('mediation.offers.itemNo') || 'Item No.'}
                            </th>
                            <th className={`px-2 py-1 text-left text-xs font-semibold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {t('mediation.offers.productName') || 'Product'}
                            </th>
                            <th className={`px-2 py-1 text-left text-xs font-semibold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {t('mediation.offers.quantity') || 'Quantity'}
                            </th>
                            <th className={`px-2 py-1 text-left text-xs font-semibold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {t('mediation.offers.unitPrice') || 'Unit Price'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {requestedData.items.slice(0, 10).map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className={`px-2 py-1 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>
                                {item.itemNo || '-'}
                              </td>
                              <td className={`px-2 py-1 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>
                                {item.productName || item.description || '-'}
                              </td>
                              <td className={`px-2 py-1 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>
                                {item.quantity || 0} {item.unit || ''}
                              </td>
                              <td className={`px-2 py-1 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>
                                {item.unitPrice ? parseFloat(item.unitPrice).toFixed(2) : '0.00'} {item.currency || 'USD'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {requestedData.items.length > 10 && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          +{requestedData.items.length - 10} {t('common.more') || 'more'} {t('common.items') || 'items'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {requestedData.images && (
                <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                  <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    <Label className="text-sm font-semibold text-blue-900">
                      {t('mediation.trader.adImages') || 'Advertisement Images'}
                    </Label>
                    <span className="ml-auto px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {t('common.changed') || 'Changed'}
                    </span>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">
                      {t('common.requested') || 'Requested'} ({Array.isArray(requestedData.images) ? requestedData.images.length : 0} {t('common.images') || 'images'})
                    </Label>
                    {Array.isArray(requestedData.images) && requestedData.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {requestedData.images.slice(0, 6).map((imgUrl, idx) => {
                          const src = getImageUrl(imgUrl);
                          return (
                            <img
                              key={idx}
                              src={src}
                              alt={`Requested image ${idx + 1}`}
                              className="w-full h-24 object-cover rounded border border-gray-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          );
                        })}
                        {requestedData.images.length > 6 && (
                          <div className="w-full h-24 rounded border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                            +{requestedData.images.length - 6} {t('common.more') || 'more'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Price Negotiation */}
              {(requestedData.acceptsPriceNegotiation !== undefined || offer?.acceptsPriceNegotiation !== undefined) && (
                renderFieldComparison(
                  'acceptsPriceNegotiation',
                  t('mediation.trader.acceptPriceNegotiation') || 'Accepts Price Negotiation',
                  offer?.acceptsPriceNegotiation !== undefined
                    ? (offer.acceptsPriceNegotiation ? t('common.yes') || 'Yes' : t('common.no') || 'No')
                    : (offer?.acceptsNegotiation ? t('common.yes') || 'Yes' : t('common.no') || 'No'),
                  requestedData.acceptsPriceNegotiation !== undefined
                    ? (requestedData.acceptsPriceNegotiation ? t('common.yes') || 'Yes' : t('common.no') || 'No')
                    : (requestedData.acceptsNegotiation ? t('common.yes') || 'Yes' : t('common.no') || 'No'),
                  Tag
                )
              )}
              {/* Quantity Negotiation */}
              {(requestedData.acceptsQuantityNegotiation !== undefined || offer?.acceptsQuantityNegotiation !== undefined) && (
                renderFieldComparison(
                  'acceptsQuantityNegotiation',
                  t('mediation.trader.acceptQuantityNegotiation') || 'Accepts Quantity Negotiation',
                  offer?.acceptsQuantityNegotiation !== undefined
                    ? (offer.acceptsQuantityNegotiation ? t('common.yes') || 'Yes' : t('common.no') || 'No')
                    : (offer?.acceptsNegotiation ? t('common.yes') || 'Yes' : t('common.no') || 'No'),
                  requestedData.acceptsQuantityNegotiation !== undefined
                    ? (requestedData.acceptsQuantityNegotiation ? t('common.yes') || 'Yes' : t('common.no') || 'No')
                    : (requestedData.acceptsNegotiation ? t('common.yes') || 'Yes' : t('common.no') || 'No'),
                  Tag
                )
              )}
              {/* Fallback for old acceptsNegotiation field */}
              {requestedData.acceptsPriceNegotiation === undefined && 
               requestedData.acceptsQuantityNegotiation === undefined && 
               requestedData.acceptsNegotiation !== undefined && (
                renderFieldComparison(
                  'acceptsNegotiation',
                  t('mediation.offers.acceptsNegotiation') || 'Accepts Negotiation',
                  offer?.acceptsNegotiation ? t('common.yes') || 'Yes' : t('common.no') || 'No',
                  requestedData.acceptsNegotiation ? t('common.yes') || 'Yes' : t('common.no') || 'No',
                  Tag
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trader Information */}
          {offer?.trader && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Store className="w-5 h-5 text-gray-600" />
                  {t('mediation.offers.updateRequest.traderInfo') || 'Trader Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.traders.companyName') || 'Company Name'}
                  </Label>
                  <p className="text-base text-gray-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    {offer.trader.companyName || offer.trader.name || 'N/A'}
                  </p>
                </div>
                {offer.trader.traderCode && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-1 block">
                      {t('mediation.traders.traderCode') || 'Trader Code'}
                    </Label>
                    <p className="text-base text-gray-900">{offer.trader.traderCode}</p>
                  </div>
                )}
                {offer.trader.name && offer.trader.name !== offer.trader.companyName && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-1 block">
                      {t('common.name') || 'Name'}
                    </Label>
                    <p className="text-base text-gray-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {offer.trader.name}
                    </p>
                  </div>
                )}
                {offer.trader.email && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-1 block">
                      {t('common.email') || 'Email'}
                    </Label>
                    <p className="text-base text-gray-900 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {offer.trader.email}
                    </p>
                  </div>
                )}
                {offer.trader.phone && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-1 block">
                      {t('common.phone') || 'Phone'}
                    </Label>
                    <p className="text-base text-gray-900 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {offer.trader.phone}
                    </p>
                  </div>
                )}
                {(offer.trader.country || offer.trader.city) && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-1 block">
                      {t('common.location') || 'Location'}
                    </Label>
                    <p className="text-base text-gray-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {[offer.trader.city, offer.trader.country].filter(Boolean).join(', ') || 'N/A'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Review Notes */}
      {canReview && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
              <FileText className="w-5 h-5 text-gray-600" />
              {t('mediation.offers.updateRequest.reviewNotes') || 'Review Notes'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={t('mediation.offers.updateRequest.reviewNotesPlaceholder') || 'Add review notes (required for rejection)...'}
              rows={4}
              className="w-full"
            />
          </CardContent>
        </Card>
      )}

      {/* Existing Review Notes */}
      {request.reviewNotes && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
              <FileText className="w-5 h-5 text-gray-600" />
              {t('mediation.offers.updateRequest.existingReviewNotes') || 'Review Notes'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.reviewNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-lg shadow-xl max-w-md w-full ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className="p-6 border-b border-gray-200">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h2 className="text-xl font-bold text-gray-900">
                  {actionType === 'approve' 
                    ? (t('mediation.offers.updateRequest.confirmApprove') || 'Confirm Approval')
                    : (t('mediation.offers.updateRequest.confirmReject') || 'Confirm Rejection')}
                </h2>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                {actionType === 'approve'
                  ? (t('mediation.offers.updateRequest.confirmApproveMessage') || 'Are you sure you want to approve this update request?')
                  : (t('mediation.offers.updateRequest.confirmRejectMessage') || 'Are you sure you want to reject this update request?')}
              </p>
            </div>
            <div className={`p-6 border-t border-gray-200 flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button
                onClick={() => setShowConfirmModal(false)}
                variant="outline"
              >
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button
                onClick={confirmAction}
                disabled={processing}
                className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.processing') || 'Processing...'}
                  </>
                ) : (
                  actionType === 'approve' 
                    ? (t('common.approve') || 'Approve')
                    : (t('common.reject') || 'Reject')
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ViewOfferUpdateRequest;
