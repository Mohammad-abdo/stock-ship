import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { dealApi, negotiationApi } from '@/lib/mediationApi';
import { motion } from 'framer-motion';
import { ArrowLeft, X, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import showToast from '@/lib/toast';

const TraderViewDeal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { getAuth } = useMultiAuth();
  const { user } = getAuth('trader');

  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState(null);
  const [productState, setProductState] = useState([]);
  const [notes, setNotes] = useState('');
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approvingDeal, setApprovingDeal] = useState(false);
  const [updatingFinalOffer, setUpdatingFinalOffer] = useState(false);

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const response = await dealApi.getDealById(id);
      const responseData = response.data?.data || response.data;

      const dealData = responseData.deal || responseData;

      // Verify this deal belongs to the current trader
      if (dealData.traderId !== user.id) {
        showToast.error(
          t('mediation.deals.accessDenied') || 'Access Denied',
          t('mediation.deals.notYourDeal') || 'This deal does not belong to you'
        );
        navigate('/stockship/trader/deals');
        return;
      }

      setDeal(dealData);
      setNotes(dealData.notes || '');

      // Transform deal items to product format
      if (dealData.items && dealData.items.length > 0) {
        const products = dealData.items.map((dealItem) => {
          const { offerItem } = dealItem;
          if (!offerItem) return null;

          // Parse images
          let images = [];
          try {
            const parsedImages = typeof offerItem.images === 'string'
              ? JSON.parse(offerItem.images)
              : offerItem.images;
            if (Array.isArray(parsedImages)) {
              images = parsedImages.map(img => {
                const imgUrl = typeof img === 'string' ? img : (img?.url || img?.src || img);
                if (!imgUrl) return null;
                if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
                  return imgUrl;
                }
                const BASE_URL = 'http://localhost:5000';
                return `${BASE_URL}${imgUrl.startsWith('/') ? imgUrl : '/uploads/' + imgUrl}`;
              }).filter(Boolean);
            }
          } catch (e) {
            console.warn('Error parsing images:', e);
          }

          const imageUrl = images.length > 0
            ? images[0]
            : 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';

          return {
            id: dealItem.id,
            dealItemId: dealItem.id,
            offerItemId: offerItem.id,
            image: imageUrl,
            thumbnails: images.length > 1 ? images.slice(1, 4) : [],
            images: images,
            title: offerItem.productName || offerItem.description || t("mediation.deals.product") || "منتج",
            itemNumber: offerItem.itemNo || `#${offerItem.id?.substring(0, 8) || 'N/A'}`,
            country: dealData.offer?.country || "🇨🇳",
            description: offerItem.description || offerItem.notes || "",
            quantity: parseInt(offerItem.quantity) || 0,
            piecesPerCarton: Math.max(1, parseInt(offerItem.packageQuantity ?? offerItem.package_quantity ?? 1)),
            pricePerPiece: parseFloat(offerItem.unitPrice) || 0,
            cbm: parseFloat(offerItem.totalCBM || offerItem.cbm || 0),
            negotiationPrice: dealItem.negotiatedPrice ? parseFloat(dealItem.negotiatedPrice) : "",
            negotiationQuantity: dealItem.quantity || "",
            currency: offerItem.currency || 'SAR',
            soldOut: false
          };
        }).filter(Boolean);

        setProductState(products);
      }
    } catch (error) {
      console.error('Error fetching deal:', error);
      showToast.error(
        t('mediation.deals.loadDealFailed') || 'Failed to load deal',
        error.response?.data?.message || t('common.notFound') || 'Deal not found'
      );
      navigate('/stockship/trader/deals');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setMessagesLoading(true);
      const res = await negotiationApi.getMessages(id);
      const messagesData = res.data?.data || res.data || [];
      const sortedMessages = [...messagesData].sort((a, b) => {
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      setMessages(sortedMessages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDeal();
      fetchMessages();
    }
  }, [id, user]);

  const handleNegotiationChange = (productId, field, value) => {
    setProductState((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  const calculateTotals = () => {
    const selectedProducts = productState.filter(
      (p) => !p.soldOut && (p.negotiationQuantity || p.negotiationPrice)
    );

    let totalQuantity = 0;
    let totalPrice = 0;
    let totalCbm = 0;

    selectedProducts.forEach((p) => {
      const qty = parseInt(p.negotiationQuantity) || 0;
      const price = parseFloat(p.negotiationPrice) || p.pricePerPiece;
      totalQuantity += qty;
      totalPrice += qty * price;
      totalCbm += (qty / p.quantity) * p.cbm;
    });

    return { totalQuantity, totalPrice, totalCbm };
  };

  const { totalQuantity, totalPrice, totalCbm } = calculateTotals();

  const handleApproveDeal = async () => {
    if (!totalPrice || totalPrice <= 0) {
      showToast.error(
        t('mediation.deals.cannotApprove') || 'Cannot Approve',
        t('mediation.deals.noNegotiatedAmount') || 'Please set negotiated prices and quantities first'
      );
      return;
    }

    // Validate carton quantities before approving (same rule as send message)
    const cartonSizeForApprove = (p) => Math.max(1, p.piecesPerCarton || 1);
    const invalidForApprove = productState.filter(p => {
      const qty = parseInt(p.negotiationQuantity, 10);
      const size = cartonSizeForApprove(p);
      return p.negotiationQuantity != null && p.negotiationQuantity !== '' && !Number.isNaN(qty) && qty > 0 && qty % size !== 0;
    });
    if (invalidForApprove.length > 0) {
      showToast.error(
        t("mediation.deals.cannotApproveInvalidQty") || "Cannot approve: Invalid carton quantities.",
        t("mediation.deals.pleaseFixErrors") || "Please correct the red fields before approving."
      );
      return;
    }

    const confirmed = window.confirm(
      t('mediation.deals.confirmApproval') || 
      `هل أنت متأكد من الموافقة على الصفقة بمبلغ $${formatCurrency(totalPrice)}؟`
    );

    if (!confirmed) return;

    try {
      setApprovingDeal(true);
      await dealApi.approveDeal(id, { 
        negotiatedAmount: totalPrice,
        totalCBM: totalCbm,
        totalQuantity: totalQuantity
      });
      
      showToast.success(
        t('mediation.deals.dealApproved') || 'Deal Approved',
        t('mediation.deals.dealApprovedSuccess') || 'The deal has been approved successfully'
      );
      
      // Refresh deal data
      await fetchDeal();
    } catch (error) {
      console.error('Error approving deal:', error);
      showToast.error(
        t('mediation.deals.approvalFailed') || 'Approval Failed',
        error.response?.data?.message || t('common.errorOccurred') || 'An error occurred'
      );
    } finally {
      setApprovingDeal(false);
    }
  };

  const handleSendNegotiationMessage = async () => {
    if (isNegotiationClosed) {
      showToast.error(
        t('mediation.deals.negotiationClosed') || 'Negotiation closed',
        t('mediation.deals.negotiationClosedDescription') || 'Negotiation is closed for this deal. You cannot send messages or change quantities/prices.'
      );
      return;
    }
    if (!notes.trim() && !productState.some(p => p.negotiationPrice || p.negotiationQuantity)) {
      showToast.error(
        t('mediation.deals.negotiationForm.required') || 'Required',
        t('mediation.deals.negotiationForm.provideMessageOrProposal') || 'Please provide a message or update prices/quantities'
      );
      return;
    }

    // STRICT VALIDATION: Check for carton multiples before sending (must match backend rule)
    const cartonSize = (p) => Math.max(1, p.piecesPerCarton || 1);
    const invalidProducts = productState.filter(p => {
      const qty = parseInt(p.negotiationQuantity, 10);
      const size = cartonSize(p);
      return p.negotiationQuantity != null && p.negotiationQuantity !== '' && !Number.isNaN(qty) && qty > 0 && size > 0 && qty % size !== 0;
    });
    if (invalidProducts.length > 0) {
      const first = invalidProducts[0];
      const size = cartonSize(first);
      const qty = parseInt(first.negotiationQuantity, 10);
      const lower = Math.floor(qty / size) * size;
      const upper = Math.ceil(qty / size) * size;
      const hint = size > 1
        ? (isRTL ? `الكمية يجب أن تكون من مضاعفات ${size}. الأقرب: ${lower} أو ${upper}` : `Quantity must be a multiple of ${size}. Nearest: ${lower} or ${upper}`)
        : (t("mediation.deals.pleaseFixErrors") || "Please correct the red fields before sending.");
      showToast.error(
        t("mediation.deals.cantSendInvalidQty") || "Cannot send: Invalid carton quantities.",
        `${first.title || ''}: ${hint}`
      );
      return;
    }

    try {
      setSubmitting(true);

      // Collect product changes for detailed history
      const productChanges = productState
        .filter(p => p.negotiationPrice || p.negotiationQuantity)
        .map(p => ({
          itemNumber: p.itemNumber,
          title: p.title,
          oldPrice: p.pricePerPiece,
          newPrice: parseFloat(p.negotiationPrice) || p.pricePerPiece,
          oldQuantity: p.quantity,
          newQuantity: parseInt(p.negotiationQuantity) || 0,
          priceChanged: p.negotiationPrice && parseFloat(p.negotiationPrice) !== p.pricePerPiece,
          quantityChanged: p.negotiationQuantity && parseInt(p.negotiationQuantity) !== p.quantity
        }));

      let proposedPrice = null;
      const hasNegotiation = productState.some(p => p.negotiationPrice || p.negotiationQuantity);
      if (hasNegotiation) {
        proposedPrice = totalPrice > 0 ? totalPrice : null;
      }

      // Build detailed message with changes
      let detailedMessage = notes.trim() || '';
      if (productChanges.length > 0) {
        const changesText = productChanges.map((change, idx) => {
          let productText = `${idx + 1}. ${change.title} (${change.itemNumber}):\n`;
          if (change.quantityChanged) {
            productText += `   الكمية: ${change.newQuantity.toLocaleString()}\n`;
          }
          if (change.priceChanged) {
            productText += `   السعر: $${formatCurrency(change.newPrice)}\n`;
          }
          return productText;
        }).join('\n');

        if (detailedMessage) {
          detailedMessage += '\n\n--- تفاصيل المنتجات ---\n' + changesText;
        } else {
          detailedMessage = '--- تفاصيل المنتجات ---\n' + changesText;
        }
      }

      // Backend requires at least one of: content, proposedPrice, proposedQuantity, or non-empty productChanges
      const payload = {
        content: detailedMessage || (productChanges.length > 0 ? (t('mediation.deals.productUpdate') || 'تحديث على المنتجات') : ''),
        message: detailedMessage || (productChanges.length > 0 ? (t('mediation.deals.productUpdate') || 'تحديث على المنتجات') : ''),
        proposedPrice: proposedPrice ?? null,
        messageType: proposedPrice ? 'PRICE_PROPOSAL' : 'TEXT',
        productChanges: productChanges.length > 0 ? JSON.stringify(productChanges) : undefined
      };

      await negotiationApi.sendMessage(id, payload);
      setNotes('');
      await fetchMessages();
      await fetchDeal(); // Re-fetch to get updated product data

      showToast.success(
        t('mediation.deals.negotiationForm.messageSent') || 'Message Sent',
        t('mediation.deals.negotiationForm.messageSentSuccess') || 'Your message has been sent successfully'
      );
    } catch (error) {
      console.error("Error sending negotiation message:", error);
      const msg = error.response?.data?.message || error.message || t('common.errorOccurred') || 'An error occurred';
      showToast.error(
        t('admin.support.sendFailed') || 'Failed to send message',
        msg
      );
    } finally {
      setSubmitting(false);
    }
  };

  const summaryData = productState
    .filter((p) => p.soldOut || p.negotiationQuantity || p.negotiationPrice)
    .map((p) => ({
      id: p.id,
      itemNumber: p.itemNumber,
      quantity: p.soldOut ? p.negotiationQuantity : p.negotiationQuantity || 1,
      price: p.soldOut ? p.negotiationPrice : p.negotiationPrice || p.pricePerPiece,
      cbm: p.soldOut
        ? ((p.negotiationQuantity || 0) / p.quantity) * p.cbm
        : ((parseInt(p.negotiationQuantity) || 0) / p.quantity) * p.cbm || p.cbm,
    }));

  // When deal is approved/settled, or trader marked price/quantity as final — no more negotiation
  const isNegotiationClosed = deal && (deal.status !== 'NEGOTIATION' || !!deal.priceQuantityFinal);

  const handleSetPriceQuantityFinal = async (checked) => {
    if (!deal?.id || updatingFinalOffer) return;
    try {
      setUpdatingFinalOffer(true);
      await dealApi.setDealPriceQuantityFinal(deal.id, checked);
      setDeal((prev) => (prev ? { ...prev, priceQuantityFinal: checked } : null));
      showToast.success(
        t('mediation.deals.finalOfferUpdated') || 'تم التحديث',
        checked
          ? (t('mediation.deals.finalOfferOn') || 'السعر والكمية نهائية. العميل يمكنه قبول أو رفض الصفقة فقط.')
          : (t('mediation.deals.finalOfferOff') || 'تم إلغاء تحديد العرض النهائي.')
      );
    } catch (err) {
      showToast.error(
        t('common.error') || 'خطأ',
        err.response?.data?.message || err.message || (t('mediation.deals.finalOfferUpdateFailed') || 'فشل التحديث')
      );
    } finally {
      setUpdatingFinalOffer(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  if (loading && !deal) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading') || 'Loading...'}</p>
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
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/stockship/trader/deals')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </motion.button>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-3xl font-bold text-gray-900">
              {deal.offer?.title || t('mediation.deals.dealDetails') || 'تفاصيل الصفقة'}
            </h1>
            <p className="text-muted-foreground mt-2">{deal.dealNumber || 'N/A'}</p>
            {productState.length > 0 && (
              <div className="text-xs text-green-600 mt-1">
                ✅ {productState.length} {t("mediation.deals.products") || "منتجات"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products List */}
      {!loading && (
        <div className="space-y-6 mb-8">
          {productState.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-yellow-800 font-semibold mb-2">
                  {t("mediation.deals.noProducts") || "لا توجد منتجات"}
                </p>
              </div>
            </div>
          ) : (
            productState.map((product, index) => {
              const negotiationQty = product.soldOut
                ? (parseInt(product.negotiationQuantity) || 0)
                : (parseInt(product.negotiationQuantity) || 0);
              const negotiationPrice = product.soldOut
                ? (parseFloat(product.negotiationPrice) || 0)
                : (parseFloat(product.negotiationPrice) || product.pricePerPiece || 0);

              const totalQty = negotiationQty;
              const totalCbmForProduct = product.quantity > 0
                ? (negotiationQty / product.quantity) * product.cbm
                : 0;
              const totalPriceForProduct = negotiationQty * negotiationPrice;

              return (
                <div
                  key={product.id}
                  className="relative bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
                >
                  {product.soldOut && (
                    <div className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center z-10 pointer-events-none">
                      <div className="bg-red-600 text-white px-8 py-4 rounded-lg text-2xl font-bold">
                        {t("mediation.deals.soldOut") || "نفذت الكمية"}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
                    {/* Product Image Section */}
                    <div className="space-y-2">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                      <div className="flex gap-2">
                        {product.thumbnails && product.thumbnails.length > 0 ? (
                          product.thumbnails.map((thumb, idx) => (
                            <img
                              key={idx}
                              src={thumb}
                              alt={`${product.title} ${idx + 1}`}
                              className="w-16 h-16 object-cover rounded border border-slate-200"
                              onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=100&q=80";
                              }}
                            />
                          ))
                        ) : null}
                        <div className="w-16 h-16 rounded border border-slate-200 flex items-center justify-center bg-slate-50">
                          <span className="text-xs">🎥</span>
                        </div>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{product.country}</span>
                          <h3 className="text-lg font-bold text-slate-900">
                            {product.title}
                          </h3>
                          <span className="text-sm text-slate-500">
                            {product.itemNumber}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      {/* Product Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                          <div className="text-slate-500 mb-1">
                            {t("mediation.deals.quantity") || "الكمية"}
                          </div>
                          <div className="font-semibold text-slate-900">
                            {product.quantity.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                            <span className="text-xs font-normal text-slate-500 mx-1">
                              ({product.piecesPerCarton} {t("mediation.deals.piecesInCarton") || "قطع/كرتون"})
                            </span>
                          </div>
                        </div>
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                          <div className="text-slate-500 mb-1">
                            {t("mediation.deals.pricePerPiece") || "سعر القطعة"}
                          </div>
                          <div className="font-semibold text-slate-900">
                            ${formatCurrency(product.pricePerPiece)}
                          </div>
                        </div>
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                          <div className="text-slate-500 mb-1">
                            {t("mediation.deals.cbm") || "CBM"}
                          </div>
                          <div className="font-semibold text-slate-900">
                            {product.cbm.toFixed(2)} CBM
                          </div>
                        </div>
                      </div>

                      {/* Negotiation Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-700 mb-2">
                            {t("mediation.deals.negotiationPrice") || "السعر المتفاوض عليه"}
                          </label>
                          {product.soldOut ? (
                            <div className="px-4 py-2 bg-slate-50 rounded-md text-slate-900 font-semibold">
                              ${formatCurrency(product.negotiationPrice)}
                            </div>
                          ) : (
                            <input
                              type="number"
                              value={product.negotiationPrice}
                              onChange={(e) =>
                                handleNegotiationChange(
                                  product.id,
                                  "negotiationPrice",
                                  e.target.value
                                )
                              }
                              disabled={isNegotiationClosed}
                              readOnly={isNegotiationClosed}
                              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isNegotiationClosed ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'border-slate-300'}`}
                              placeholder={t("mediation.deals.enterPrice") || "أدخل السعر"}
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm text-slate-700 mb-2">
                            {t("mediation.deals.negotiationQuantity") || "الكمية المتفاوض عليها"}
                            <span className="text-slate-500 font-normal ml-1">
                              ({t("mediation.deals.multiplesOf") || "مضاعفات"} {Math.max(1, product.piecesPerCarton || 1)})
                            </span>
                          </label>
                          {product.soldOut ? (
                            <div className="px-4 py-2 bg-slate-50 rounded-md text-slate-900 font-semibold">
                              {product.negotiationQuantity}
                            </div>
                          ) : (
                              <div className="space-y-2">
                                <input
                                  type="number"
                                  value={product.negotiationQuantity}
                                  onChange={(e) =>
                                    handleNegotiationChange(
                                      product.id,
                                      "negotiationQuantity",
                                      e.target.value
                                    )
                                  }
                                  disabled={isNegotiationClosed}
                                  readOnly={isNegotiationClosed}
                                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isNegotiationClosed ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : ''} ${
                                    product.negotiationQuantity && parseInt(product.negotiationQuantity) % product.piecesPerCarton !== 0
                                      ? 'border-red-300 ring-1 ring-red-200'
                                      : 'border-slate-300'
                                  }`}
                                  placeholder={t("mediation.deals.enterQuantity") || "أدخل الكمية"}
                                />
                                {product.negotiationQuantity > 0 && (
                                  <div className="text-xs">
                                    {parseInt(product.negotiationQuantity) % product.piecesPerCarton === 0 ? (
                                      <span className="text-green-600 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        {t("mediation.deals.contains") || "Contains"} {parseInt(product.negotiationQuantity) / product.piecesPerCarton} {t("mediation.deals.cartons") || "Cartons"}
                                      </span>
                                    ) : (
                                      <div className="bg-red-50 p-2 rounded border border-red-100 animate-in fade-in slide-in-from-top-1">
                                        <p className="text-red-700 flex items-center gap-1 mb-1 font-medium">
                                          <AlertCircle className="w-3 h-3" />
                                          {t("mediation.deals.invalidCartonQty") || "Must be whole cartons"} ({product.piecesPerCarton} {t("mediation.deals.pcsPerCarton") || "pcs/ctn"})
                                        </p>
                                        <div className="flex gap-2 mt-1">
                                          <button
                                            type="button"
                                            onClick={() => handleNegotiationChange(product.id, "negotiationQuantity", Math.floor(parseInt(product.negotiationQuantity) / product.piecesPerCarton) * product.piecesPerCarton)}
                                            disabled={isNegotiationClosed}
                                            className="px-2 py-1 bg-white border border-red-200 rounded text-red-700 hover:bg-red-50 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {t("common.roundDown") || "Round Down"}: {Math.floor(parseInt(product.negotiationQuantity) / product.piecesPerCarton) * product.piecesPerCarton}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleNegotiationChange(product.id, "negotiationQuantity", Math.ceil(parseInt(product.negotiationQuantity) / product.piecesPerCarton) * product.piecesPerCarton)}
                                            disabled={isNegotiationClosed}
                                            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {t("common.roundUp") || "Round Up"}: {Math.ceil(parseInt(product.negotiationQuantity) / product.piecesPerCarton) * product.piecesPerCarton}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                          )}
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-slate-500 mb-1">{t("mediation.deals.totalQuantity") || "الكمية الإجمالية"}</div>
                          <div className="font-semibold text-slate-900">
                            {totalQty.toLocaleString()} {t("mediation.deals.piece") || "قطعة"}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 mb-1">{t("mediation.deals.totalCbm") || "إجمالي CBM"}</div>
                          <div className="font-semibold text-slate-900">
                            {totalCbmForProduct.toFixed(2)} CBM
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 mb-1">{t("mediation.deals.totalPrice") || "السعر الإجمالي"}</div>
                          <div className="font-semibold text-slate-900">
                            ${formatCurrency(totalPriceForProduct)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Number */}
                  <div className="absolute top-4 left-4 bg-blue-900 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Order Summary Table */}
      {summaryData.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">{t("mediation.deals.orderSummary") || "ملخص الطلب"}</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t("mediation.deals.serial") || "م"}
                  </th>
                  <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t("mediation.deals.itemNumber") || "رقم الصنف"}
                  </th>
                  <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t("mediation.deals.quantity") || "الكمية"}
                  </th>
                  <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t("mediation.deals.price") || "السعر"}
                  </th>
                  <th className={`py-3 px-4 text-sm font-semibold text-slate-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                    CBM
                  </th>
                </tr>
              </thead>
              <tbody>
                {summaryData.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-3 px-4 text-sm text-slate-900">{idx + 1}</td>
                    <td className="py-3 px-4 text-sm text-slate-900">{item.itemNumber}</td>
                    <td className="py-3 px-4 text-sm text-slate-900">{item.quantity}</td>
                    <td className="py-3 px-4 text-sm text-slate-900">
                      ${formatCurrency(item.price)}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-900">
                      {item.cbm.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="py-3 px-4 text-sm text-slate-900" colSpan={2}>
                    {t("mediation.deals.total") || "المجموع"}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-900">
                    {totalQuantity.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-900">
                    ${formatCurrency(totalPrice)}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-900">
                    {totalCbm.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            {t("mediation.deals.siteFee") || "سيتم احتساب رسوم الموقع"}
          </p>

          {/* Deal Approval Section */}
          {deal.status === 'NEGOTIATION' && totalPrice > 0 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    {t('mediation.deals.readyForApproval') || 'جاهز للموافقة'}
                  </h3>
                  <p className="text-sm text-green-700 mb-3">
                    {t('mediation.deals.approvalDescription') || 'بعد الموافقة، سيتم إرسال الصفقة للعميل للدفع'}
                  </p>
                  <div className="text-sm text-green-800">
                    <strong>{t('mediation.deals.finalAmount') || 'المبلغ النهائي'}: ${formatCurrency(totalPrice)}</strong>
                  </div>
                </div>
                <button
                  onClick={handleApproveDeal}
                  disabled={approvingDeal || productState.some(p => p.negotiationQuantity && parseInt(p.negotiationQuantity) % p.piecesPerCarton !== 0)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {approvingDeal ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('mediation.deals.approving') || 'جاري الموافقة...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {t('mediation.deals.approveDeal') || 'الموافقة على الصفقة'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Deal Status Info */}
          {deal.status !== 'NEGOTIATION' && (
            <div className={`mt-6 p-4 rounded-lg ${
              deal.status === 'APPROVED' ? 'bg-blue-50 border border-blue-200' :
              deal.status === 'PAID' ? 'bg-green-50 border border-green-200' :
              deal.status === 'SETTLED' ? 'bg-purple-50 border border-purple-200' :
              deal.status === 'CANCELLED' ? 'bg-red-50 border border-red-200' :
              'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  deal.status === 'APPROVED' ? 'bg-blue-500' :
                  deal.status === 'PAID' ? 'bg-green-500' :
                  deal.status === 'SETTLED' ? 'bg-purple-500' :
                  deal.status === 'CANCELLED' ? 'bg-red-500' :
                  'bg-gray-500'
                }`}></div>
                <span className={`font-medium ${
                  deal.status === 'APPROVED' ? 'text-blue-800' :
                  deal.status === 'PAID' ? 'text-green-800' :
                  deal.status === 'SETTLED' ? 'text-purple-800' :
                  deal.status === 'CANCELLED' ? 'text-red-800' :
                  'text-gray-800'
                }`}>
                  {deal.status === 'APPROVED' && (t('mediation.deals.status.approved') || 'موافق عليه')}
                  {deal.status === 'PAID' && (t('mediation.deals.status.paid') || 'مدفوع')}
                  {deal.status === 'SETTLED' && (t('mediation.deals.status.settled') || 'مسوى')}
                  {deal.status === 'CANCELLED' && (t('mediation.deals.status.cancelled') || 'ملغى')}
                </span>
              </div>
              <p className={`text-sm mt-2 ${
                deal.status === 'APPROVED' ? 'text-blue-700' :
                deal.status === 'PAID' ? 'text-green-700' :
                deal.status === 'SETTLED' ? 'text-purple-700' :
                deal.status === 'CANCELLED' ? 'text-red-700' :
                'text-gray-700'
              }`}>
                {deal.status === 'APPROVED' && (t('mediation.deals.approvedDescription') || 'تم الموافقة على الصفقة وأرسلت للعميل')}
                {deal.status === 'PAID' && (t('mediation.deals.paidDescription') || 'تم دفع المبلغ من قبل العميل')}
                {deal.status === 'SETTLED' && (t('mediation.deals.settledDescription') || 'تم تسوية الصفقة بالكامل')}
                {deal.status === 'CANCELLED' && (t('mediation.deals.cancelledDescription') || 'تم إلغاء الصفقة')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Trader: Mark price & quantity as final — client will only see Accept / Reject */}
      {deal && deal.status === 'NEGOTIATION' && (
        <div className={`mb-6 p-4 rounded-lg border ${deal.priceQuantityFinal ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
          <label className={`flex items-center gap-3 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
            <input
              type="checkbox"
              checked={!!deal.priceQuantityFinal}
              onChange={(e) => handleSetPriceQuantityFinal(e.target.checked)}
              disabled={updatingFinalOffer}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-semibold text-slate-800">
              {t('mediation.deals.priceQuantityFinalLabel') || 'السعر والكمية نهائية — لا يمكن التفاوض بعد التفعيل، ويظهر للعميل زرّي قبول الصفقة أو رفضها فقط'}
            </span>
          </label>
          {deal.priceQuantityFinal && (
            <p className={`mt-2 text-xs text-amber-700 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('mediation.deals.finalOfferActive') || 'العرض النهائي مفعّل. العميل يمكنه قبول أو رفض الصفقة فقط.'}
            </p>
          )}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            {t("mediation.deals.negotiationForm.message") || "رسالة التفاوض"}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            disabled={isNegotiationClosed}
            readOnly={isNegotiationClosed}
            className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${isNegotiationClosed ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'border-slate-300'}`}
            placeholder={t("mediation.deals.negotiationForm.messagePlaceholder") || "أدخل رسالتك للتفاوض..."}
          />
        </div>

        {/* Validation Error Summary */}
        {productState.some(p => p.negotiationQuantity && parseInt(p.negotiationQuantity) % p.piecesPerCarton !== 0) && (
           <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">
                 {t("mediation.deals.cantSendInvalidQty") || "Cannot send: Some products have invalid carton quantities. Please correct them."}
              </span>
           </div>
        )}

        <button
          type="button"
          onClick={handleSendNegotiationMessage}
          disabled={submitting || isNegotiationClosed || productState.some(p => p.negotiationQuantity && parseInt(p.negotiationQuantity) % p.piecesPerCarton !== 0)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t("mediation.deals.negotiationForm.sending") || "جاري الإرسال..."}
            </>
          ) : (
            t("mediation.deals.negotiationForm.sendMessage") || "إرسال رسالة التفاوض"
          )}
        </button>
      </div>

      {/* Negotiation History Timeline */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          {t("mediation.deals.negotiationHistory") || "سجل التفاوض"}
        </h2>

        {messagesLoading ? (
          <div className="text-center py-8 text-slate-500">
            {t("common.loading") || "جاري التحميل..."}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            {t("mediation.deals.noMessages") || "لا توجد رسائل تفاوض"}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isClient = message.senderType === 'CLIENT' || message.clientId;
              const isTrader = message.senderType === 'TRADER' || message.traderId;
              const isEmployee = message.senderType === 'EMPLOYEE' || message.employeeId;

              return (
                <div
                  key={message.id || index}
                  className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Timeline Dot */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full mt-1 ${isClient ? 'bg-blue-500' :
                      isTrader ? 'bg-green-500' :
                        'bg-purple-500'
                      }`} />
                    {index < messages.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-200 mt-1" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-semibold ${isClient ? 'text-blue-700' :
                        isTrader ? 'text-green-700' :
                          'text-purple-700'
                        }`}>
                        {isClient && (t("mediation.deals.client") || "العميل")}
                        {isTrader && (t("mediation.deals.trader") || "التاجر")}
                        {isEmployee && (t("mediation.deals.employee") || "الموظف")}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(message.createdAt).toLocaleString(
                          isRTL ? 'ar-SA' : 'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }
                        )}
                      </span>
                    </div>

                    {/* Display message with product changes highlighted */}
                    {(message.content || message.message) && (
                      <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700">
                        <div className="whitespace-pre-wrap">{message.content || message.message}</div>
                      </div>
                    )}

                    {/* Price and Quantity Info */}
                    <div className="mt-2 space-y-1">
                      {message.proposedPrice && (
                        <div className="text-sm bg-green-50 border border-green-200 rounded px-3 py-2">
                          <span className="text-slate-600 font-medium">{t("mediation.deals.proposedPrice") || "السعر المقترح"}: </span>
                          <span className="font-bold text-green-700">
                            ${formatCurrency(message.proposedPrice)}
                          </span>
                        </div>
                      )}

                      {message.counterOffer !== null && message.counterOffer !== undefined && (
                        <div className="text-sm bg-orange-50 border border-orange-200 rounded px-3 py-2">
                          <span className="text-slate-600 font-medium">{t("mediation.deals.counterOffer") || "عرض مضاد"}: </span>
                          <span className="font-bold text-orange-700">
                            ${formatCurrency(message.counterOffer)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TraderViewDeal;
