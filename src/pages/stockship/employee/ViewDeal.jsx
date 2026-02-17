import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { dealApi, employeeApi, negotiationApi } from '@/lib/mediationApi';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Building2, User, Calendar, DollarSign, Package, CheckCircle, MessageSquare, CreditCard, Truck, Edit2, X, MapPin, Clock, CheckCircle2, AlertCircle, Eye, FileText } from 'lucide-react';
import showToast from '@/lib/toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getImageUrl = (img) => {
  if (!img) return '';
  const url = typeof img === 'string' ? img : (img?.url || img?.src || img);
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? url : '/' + url}`;
};

const ViewDeal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState(null);
  const [shippingCompanies, setShippingCompanies] = useState([]);
  const [assigningShipping, setAssigningShipping] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedShippingCompanyId, setSelectedShippingCompanyId] = useState('');
  const [shippingTracking, setShippingTracking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);
  const [activeTab, setActiveTab] = useState('negotiation');
  const [productState, setProductState] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchDeal();
      if (cancelled) return;
      fetchShippingCompanies();
      fetchShippingTracking();
      fetchMessages();
    })();
    const interval = setInterval(fetchMessages, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  useEffect(() => {
    if (deal?.shippingCompanyId) {
      setSelectedShippingCompanyId(deal.shippingCompanyId);
    }
  }, [deal]);

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const response = await dealApi.getDealById(id);
      const raw = response.data;
      const data = raw?.data ?? raw;
      const dealData = data?.deal ?? data;
      setDeal(dealData);

      // Negotiations: backend sends in data.negotiations and in data.deal.negotiations — read from all possible paths
      const negotiationsRaw =
        (Array.isArray(data?.negotiations) ? data.negotiations : null) ??
        (Array.isArray(dealData?.negotiations) ? dealData.negotiations : null) ??
        (Array.isArray(raw?.data?.negotiations) ? raw.data.negotiations : null) ??
        [];
      const negotiations = Array.isArray(negotiationsRaw) ? negotiationsRaw : [];
      setMessages(negotiations.map((m) => ({ ...m, content: m.message ?? m.content ?? '' })));

      if (dealData.items && dealData.items.length > 0) {
        const products = dealData.items.map((dealItem) => {
          const { offerItem } = dealItem;
          if (!offerItem) return null;
          let images = [];
          try {
            const parsed = typeof offerItem.images === 'string' ? JSON.parse(offerItem.images || '[]') : (offerItem.images || []);
            if (Array.isArray(parsed)) {
              images = parsed.map(img => getImageUrl(typeof img === 'string' ? img : img?.url || img?.src)).filter(Boolean);
            }
          } catch (e) {}
          const imageUrl = images[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';
          return {
            id: dealItem.id,
            image: imageUrl,
            thumbnails: images.slice(1, 4),
            title: offerItem.productName || offerItem.description || t('mediation.deals.product') || 'منتج',
            itemNumber: offerItem.itemNo || `#${offerItem.id?.substring(0, 8) || 'N/A'}`,
            description: offerItem.description || offerItem.notes || '',
            quantity: parseInt(offerItem.quantity) || 0,
            piecesPerCarton: parseInt(offerItem.packageQuantity || offerItem.cartons || 1),
            pricePerPiece: parseFloat(offerItem.unitPrice) || 0,
            cbm: parseFloat(offerItem.totalCBM || offerItem.cbm || 0),
            negotiationPrice: dealItem.negotiatedPrice ? parseFloat(dealItem.negotiatedPrice) : parseFloat(offerItem.unitPrice) || 0,
            negotiationQuantity: parseInt(dealItem.quantity) || 0
          };
        }).filter(Boolean);
        setProductState(products);
      } else {
        setProductState([]);
      }
    } catch (error) {
      console.error('Error fetching deal:', error);
      showToast.error(
        t('mediation.employee.loadDealFailed') || 'Failed to load deal',
        error.response?.data?.message || 'Deal not found'
      );
      navigate('/stockship/employee/deals');
    } finally {
      setLoading(false);
    }
  };

  const fetchShippingCompanies = async () => {
    try {
      const response = await employeeApi.getActiveShippingCompanies();
      const data = response.data.data || response.data || [];
      setShippingCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching shipping companies:', error);
    }
  };

  const fetchShippingTracking = async () => {
    try {
      const response = await employeeApi.getShippingTracking(id);
      const data = response.data.data || response.data;
      setShippingTracking(data);
    } catch (error) {
      // It's okay if tracking doesn't exist yet
      if (error.response?.status !== 404) {
        console.error('Error fetching shipping tracking:', error);
      }
    }
  };

  const fetchMessages = async () => {
    if (!id) return;
    try {
      setMessagesLoading(true);
      setMessagesError(null);
      const res = await negotiationApi.getMessages(id, { limit: 100 });
      const list = res.data?.data ?? res.data ?? [];
      setMessages(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setMessages([]);
      const msg = err.response?.data?.message || err.message;
      setMessagesError(msg || (t('mediation.deals.messagesLoadFailed') || 'تعذر تحميل الرسائل'));
    } finally {
      setMessagesLoading(false);
    }
  };


  const handleAssignShipping = async () => {
    if (!selectedShippingCompanyId && deal?.shippingCompanyId) {
      // Removing assignment
      if (!window.confirm('Are you sure you want to remove the shipping company assignment?')) {
        return;
      }
    } else if (selectedShippingCompanyId && selectedShippingCompanyId === deal?.shippingCompanyId) {
      // No change
      setShowShippingModal(false);
      return;
    }

    try {
      setAssigningShipping(true);
      await employeeApi.assignShippingCompany(id, selectedShippingCompanyId || null);
      showToast.success(
        t('mediation.deals.shippingCompanyUpdated') || 'Shipping Company Updated', 
        t('mediation.deals.shippingCompanyUpdatedDesc') || 'Shipping company assignment has been updated successfully'
      );
      setShowShippingModal(false);
      fetchDeal();
    } catch (error) {
      console.error('Error assigning shipping company:', error);
      showToast.error(
        t('mediation.deals.failedToAssignShipping') || 'Failed to assign shipping company', 
        error.response?.data?.message || t('common.tryAgain') || 'Please try again'
      );
    } finally {
      setAssigningShipping(false);
    }
  };

  const getShippingStatusIcon = (status) => {
    const icons = {
      PENDING: <Clock className="w-4 h-4 text-gray-500" />,
      PREPARING: <Package className="w-4 h-4 text-blue-500" />,
      PICKED_UP: <Package className="w-4 h-4 text-purple-500" />,
      IN_TRANSIT: <Truck className="w-4 h-4 text-blue-500" />,
      OUT_FOR_DELIVERY: <Truck className="w-4 h-4 text-orange-500" />,
      DELIVERED: <CheckCircle2 className="w-4 h-4 text-green-500" />,
      RETURNED: <AlertCircle className="w-4 h-4 text-red-500" />,
      CANCELLED: <X className="w-4 h-4 text-red-500" />
    };
    return icons[status] || <Clock className="w-4 h-4 text-gray-500" />;
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      NEGOTIATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('mediation.deals.negotiation') || 'Negotiation' },
      APPROVED: { bg: 'bg-blue-100', text: 'text-blue-800', label: t('mediation.deals.approved') || 'Approved' },
      PAID: { bg: 'bg-green-100', text: 'text-green-800', label: t('mediation.deals.paid') || 'Paid' },
      SETTLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.deals.settled') || 'Settled' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: t('mediation.deals.cancelled') || 'Cancelled' }
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status || 'Unknown' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
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
            onClick={() => navigate('/stockship/employee/deals')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('mediation.deals.viewDetails') || 'Deal Details'}
            </h1>
            <p className="text-muted-foreground mt-2">{deal.dealNumber || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {productState.length > 0 && (
            <Button
              onClick={() => navigate(`/stockship/employee/deals/${id}/quote`)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileText className="w-4 h-4" />
              {t('mediation.deals.sendPriceQuote') || 'عرض السعر للعميل'}
            </Button>
          )}
          {getStatusBadge(deal.status)}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('mediation.deals.dealInfo') || 'Deal Information'}
          </button>
          <button
            onClick={() => setActiveTab('negotiation')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'negotiation'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {t('mediation.deals.negotiation') || 'Negotiation'}
            {messages.length > 0 && (
              <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                {messages.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'negotiation' ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Negotiation Header */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {t('mediation.deals.negotiationRecord') || 'سجل التفاوض'}
            </h3>
          </div>

          {/* Messages Area */}
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {messagesLoading ? (
              <div className="text-center text-gray-500 py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mx-auto mb-3" />
                <p>{t('common.loading') || 'جاري تحميل الرسائل...'}</p>
              </div>
            ) : messagesError ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-amber-500" />
                <p className="text-gray-700 font-medium">{t('mediation.deals.messagesLoadFailed') || 'تعذر تحميل الرسائل'}</p>
                <p className="text-sm text-gray-500 mt-1">{messagesError}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => fetchMessages()}>
                  {t('common.retry') || 'إعادة المحاولة'}
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('mediation.deals.noMessagesEmployee') || 'لا توجد رسائل تفاوض بعد بين العميل والتاجر.'}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {t('mediation.deals.waitingForNegotiation') || 'في انتظار بدء التفاوض...'}
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const messageContent = msg.content || msg.message || '';
                const isFromClient = msg.senderType === 'CLIENT';
                const isFromTrader = msg.senderType === 'TRADER';
                const isFromEmployee = msg.senderType === 'EMPLOYEE';
                const hasPrice = msg.proposedPrice !== null && msg.proposedPrice !== undefined;
                const hasQuantity = msg.proposedQuantity !== null && msg.proposedQuantity !== undefined;
                
                const formatCurrency = (amount) => {
                  if (!amount) return '0.00';
                  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
                  return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).format(num);
                };
                
                return (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      isFromClient ? 'bg-green-500' : isFromTrader ? 'bg-blue-500' : 'bg-purple-500'
                    }`}>
                      {isFromClient ? 'ع' : isFromTrader ? 'ت' : 'م'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {isFromClient ? (t('mediation.deals.client') || 'العميل') : 
                           isFromEmployee ? (t('mediation.deals.employee') || 'الموظف') : 
                           (t('mediation.deals.trader') || 'التاجر')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      {(hasPrice || hasQuantity) && (
                        <div className="mb-2 p-2 bg-white rounded border border-gray-200">
                          {hasPrice && (
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-gray-700">
                                {t('mediation.deals.negotiationForm.proposedPrice') || 'السعر المقترح'}: 
                              </span>
                              <span className="font-bold text-green-600">${formatCurrency(msg.proposedPrice)}</span>
                            </div>
                          )}
                          {hasQuantity && (
                            <div className="flex items-center gap-2 text-sm mt-1">
                              <Package className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-gray-700">
                                {t('mediation.deals.negotiationForm.proposedQuantity') || 'الكمية المقترحة'}: 
                              </span>
                              <span className="font-bold text-blue-600">{msg.proposedQuantity?.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {messageContent && (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{messageContent}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Employee Observer Notice */}
          <div className="bg-blue-50 p-4 border-t border-blue-200">
            <div className="flex items-center justify-center gap-3 text-blue-700">
              <Eye className="w-5 h-5" />
              <div className="text-center">
                <p className="font-medium">
                  {t('mediation.deals.employeeObserverMode') || 'وضع المراقبة - الموظف'}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {t('mediation.deals.employeeObserverNotice') || 'أنت تراقب هذا التفاوض بين العميل والتاجر. لا يمكنك المشاركة في المحادثة.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Info */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                {t('mediation.deals.dealInfo') || 'Deal Information'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.dealNumber') || 'Deal Number'}</p>
                  <p className="font-mono font-semibold text-gray-900">{deal.dealNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.negotiatedAmount') || 'Negotiated Amount'}</p>
                  <p className="font-semibold text-lg text-gray-900">
                    ${(Number(deal.negotiatedAmount) || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.cbm') || 'CBM'}</p>
                  <p className="font-medium text-gray-900">{deal.totalCBM || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.cartons') || 'Cartons'}</p>
                  <p className="font-medium text-gray-900">{deal.totalCartons || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('mediation.common.createdAt') || 'Created At'}</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">
                      {deal.createdAt 
                        ? new Date(deal.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gray-600" />
                  {t('mediation.deals.trader') || 'Trader'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">{t('mediation.traders.companyName') || 'Company'}</p>
                    <p className="font-medium text-gray-900">{deal.trader?.companyName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('mediation.traders.contactPerson') || 'Contact'}</p>
                    <p className="text-sm text-gray-900">{deal.trader?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('mediation.common.email') || 'Email'}</p>
                    <p className="text-sm text-gray-900">{deal.trader?.email || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  {t('mediation.deals.client') || 'Client'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">{t('mediation.common.name') || 'Name'}</p>
                    <p className="font-medium text-gray-900">{deal.client?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('mediation.common.email') || 'Email'}</p>
                    <p className="text-sm text-gray-900">{deal.client?.email || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shipping Company Assignment */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-gray-600" />
                  Shipping Company
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
                            <p className="text-gray-600">{t('shippingCompanies.contactPerson') || 'Contact'}: {deal.shippingCompany.contactName}</p>
                          )}
                          {deal.shippingCompany.phone && (
                            <p className="text-gray-600">{t('common.phone') || 'Phone'}: {deal.shippingCompany.phone}</p>
                          )}
                          {deal.shippingCompany.email && (
                            <p className="text-gray-600">{t('common.email') || 'Email'}: {deal.shippingCompany.email}</p>
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
          {deal?.shippingCompany && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    Shipping Tracking
                  </CardTitle>
                  {shippingTracking && (
                    <button
                      onClick={() => navigate(`/stockship/employee/shipping-tracking/${id}/view`)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {shippingTracking ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getShippingStatusIcon(shippingTracking.status)}
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getShippingStatusColor(shippingTracking.status)}`}>
                            {shippingTracking.status?.replace(/_/g, ' ') || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      {shippingTracking.trackingNumber && (
                        <div className="mb-2">
                          <label className="text-sm font-medium text-gray-700">Tracking Number:</label>
                          <p className="mt-1 font-mono text-sm">{shippingTracking.trackingNumber}</p>
                        </div>
                      )}
                      {shippingTracking.currentLocation && (
                        <div className="mb-2">
                          <label className="text-sm font-medium text-gray-700">Current Location:</label>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <p className="text-sm">{shippingTracking.currentLocation}</p>
                          </div>
                        </div>
                      )}
                      {shippingTracking.estimatedDelivery && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Estimated Delivery:</label>
                          <p className="mt-1 text-sm">
                            {new Date(shippingTracking.estimatedDelivery).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600">
                      <AlertCircle className="w-5 h-5" />
                      <span>No tracking information available yet</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Tracking will be available once shipping starts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Info */}
          {deal.payments && deal.payments.length > 0 && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  {t('mediation.deals.payments') || 'Payments'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deal.payments.map((payment, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">
                          ${(Number(payment.amount) || 0).toFixed(2)}
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                          payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.status || 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {payment.createdAt 
                          ? new Date(payment.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')
                          : 'N/A'
                        }
                      </p>
                      {payment.method === 'BANK_TRANSFER' && payment.receiptUrl && (
                        <div className="mt-2">
                          <a 
                            href={getImageUrl(payment.receiptUrl)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            {t('mediation.deals.downloadReceipt') || 'Download Receipt'}
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-gray-600" />
                {t('mediation.common.status') || 'Status'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getStatusBadge(deal.status)}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-600" />
                {t('mediation.deals.quickStats') || 'Quick Stats'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{t('mediation.deals.totalAmount') || 'Total Amount'}</p>
                  <p className="font-semibold text-gray-900">
                    ${(Number(deal.negotiatedAmount) || 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{t('mediation.deals.cbm') || 'CBM'}</p>
                  <p className="font-medium text-gray-900">{deal.totalCBM || 'N/A'}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{t('mediation.deals.cartons') || 'Cartons'}</p>
                  <p className="font-medium text-gray-900">{deal.totalCartons || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Negotiation messages preview */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  {t('mediation.deals.negotiations') || 'رسائل التفاوض'}
                  {messages.length > 0 && (
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-normal">
                      {messages.length}
                    </span>
                  )}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('negotiation')}
                  className="gap-1"
                >
                  <MessageSquare className="w-4 h-4" />
                  {t('mediation.deals.viewAllMessages') || 'عرض كل الرسائل'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {messagesLoading ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  {t('common.loading') || 'جاري التحميل...'}
                </div>
              ) : messages.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">
                  {t('mediation.deals.noMessagesEmployee') || 'لا توجد رسائل تفاوض بعد.'}
                </p>
              ) : (
                <div className="space-y-3 max-h-[280px] overflow-y-auto">
                  {messages.slice(-5).map((msg, idx) => {
                    const content = msg.content || msg.message || '';
                    const isFromClient = msg.senderType === 'CLIENT';
                    const isFromEmployee = msg.senderType === 'EMPLOYEE';
                    const senderLabel = isFromClient ? (t('mediation.deals.client') || 'العميل') : isFromEmployee ? (t('mediation.deals.employee') || 'الموظف') : (t('mediation.deals.trader') || 'التاجر');
                    return (
                      <div key={msg.id || idx} className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-700">{senderLabel}</span>
                          <span className="text-xs text-gray-500">
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap line-clamp-2">{content || '—'}</p>
                        {(msg.proposedPrice != null || msg.proposedQuantity != null) && (
                          <div className="mt-1 text-xs text-gray-600">
                            {msg.proposedPrice != null && <span>{t('mediation.deals.negotiationForm.proposedPrice') || 'السعر'}: {Number(msg.proposedPrice).toFixed(2)}</span>}
                            {msg.proposedPrice != null && msg.proposedQuantity != null && ' · '}
                            {msg.proposedQuantity != null && <span>{t('mediation.deals.negotiationForm.proposedQuantity') || 'الكمية'}: {msg.proposedQuantity}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {/* Shipping Company Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Assign Shipping Company</h2>
              <button
                onClick={() => setShowShippingModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Shipping Company</label>
                <select
                  value={selectedShippingCompanyId}
                  onChange={(e) => setSelectedShippingCompanyId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">None (Remove Assignment)</option>
                  {shippingCompanies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.nameEn || company.nameAr}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowShippingModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignShipping}
                  disabled={assigningShipping}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {assigningShipping ? 'Saving...' : 'Save'}
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




