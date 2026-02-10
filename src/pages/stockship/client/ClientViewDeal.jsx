import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { dealApi, negotiationApi, shippingTrackingApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, User, Store, MapPin, Truck, Clock, CheckCircle2, AlertCircle, DollarSign, Package } from 'lucide-react';

export default function ClientViewDeal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const messagesEndRef = useRef(null);
  
  const [deal, setDeal] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [proposedQuantity, setProposedQuantity] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [shippingTracking, setShippingTracking] = useState(null);

  useEffect(() => {
    fetchDealData();
    fetchShippingTracking();
    const interval = setInterval(fetchMessages, 10000); // Polling for messages
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchShippingTracking = async () => {
    try {
      const response = await shippingTrackingApi.getShippingTracking(id);
      const data = response.data.data || response.data;
      setShippingTracking(data);
    } catch (error) {
      // It's okay if tracking doesn't exist yet
      if (error.response?.status !== 404) {
        console.error('Error fetching shipping tracking:', error);
      }
    }
  };

  const fetchDealData = async () => {
    try {
      setLoading(true);
      const [dealRes, msgsRes] = await Promise.all([
        dealApi.getDealById(id),
        negotiationApi.getMessages(id)
      ]);
      setDeal(dealRes.data?.data || dealRes.data);
      setMessages(msgsRes.data?.data || msgsRes.data || []);
    } catch (error) {
       console.error("Error loading deal:", error);
       showToast.error(t('mediation.deals.loadDealFailed') || "Failed to load deal details");
    } finally {
       setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchMessages = async () => {
     try {
       const res = await negotiationApi.getMessages(id);
       setMessages(res.data?.data || res.data || []);
     } catch (err) {
       console.error("Polling error", err);
     }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !proposedPrice && !proposedQuantity) {
      showToast.error(
        t('mediation.deals.negotiationForm.required') || 'Required',
        t('mediation.deals.negotiationForm.provideMessageOrProposal') || 'Please provide a message, price, or quantity'
      );
      return;
    }

    // STRICT VALIDATION: Check for carton multiples
    if (proposedQuantity && deal.items?.[0]?.offerItem) {
      const item = deal.items[0].offerItem;
      const cartons = parseInt(item.packageQuantity || item.package_quantity || item.cartons || 1);
      
      if (cartons > 1 && parseInt(proposedQuantity) % cartons !== 0) {
        showToast.error(
          t("mediation.deals.cantSendInvalidQty") || "Cannot send: Invalid carton quantities.",
          t("mediation.deals.pleaseFixErrors") || "Please correct the quantity before sending."
        );
        return;
      }
    }

    try {
      setSending(true);
      const payload = {
        content: newMessage.trim() || undefined,
        proposedPrice: proposedPrice ? parseFloat(proposedPrice) : undefined,
        proposedQuantity: proposedQuantity ? parseInt(proposedQuantity) : undefined,
        messageType: proposedPrice || proposedQuantity ? 'PRICE_PROPOSAL' : 'TEXT'
      };
      await negotiationApi.sendMessage(id, payload);
      setNewMessage('');
      setProposedPrice('');
      setProposedQuantity('');
      await fetchMessages();
      showToast.success(
        t('mediation.deals.negotiationForm.messageSent') || 'Message Sent',
        t('mediation.deals.negotiationForm.messageSentSuccess') || 'Your message has been sent successfully'
      );
    } catch (error) {
      console.error("Error sending message:", error);
      showToast.error(
        t('admin.support.sendFailed') || t('chat.sendFailed') || "Failed to send message",
        error.response?.data?.message || t('common.errorOccurred') || 'An error occurred'
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  if (!deal) return <div className="p-8">{t('common.notFound') || 'Deal not found'}</div>;

  return (
    <div className="fixed inset-0 pt-14 flex flex-col bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
       {/* Header */}
       <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate('/stockship/client/deals')}>
                <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
             </Button>
             <div>
                <h1 className="text-lg font-bold text-gray-900">{deal.offer?.title || `Deal #${deal.id}`}</h1>
                <p className="text-sm text-gray-500">{t('common.status')}: {deal.status}</p>
             </div>
          </div>
       </div>

       <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Deal Info */}
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto hidden md:block p-6 space-y-6">
             <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('client.offerDetails') || 'Offer Details'}</h3>
                <Card className="shadow-sm">
                   <CardContent className="p-4 space-y-3">
                      <p className="font-medium">{deal.offer?.title}</p>
                      <div className="text-sm text-gray-600">
                         <div className="flex justify-between py-1 border-b border-gray-100">
                            <span>{t('common.price') || 'Price'}:</span>
                            <span>{deal.offer?.price || (t('mediation.deals.negotiation') || 'Negotiable')}</span>
                         </div>
                         <div className="flex justify-between py-1 border-b border-gray-100">
                            <span>{t('mediation.offers.category') || 'Category'}:</span>
                            <span>{deal.offer?.category || (t('common.notAvailable') || 'N/A')}</span>
                         </div>
                      </div>
                   </CardContent>
                </Card>
             </div>
             
             <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('client.trader') || 'Trader'}</h3>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                   <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Store className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="font-medium text-sm">{deal.trader?.companyName || deal.trader?.name}</p>
                      <p className="text-xs text-gray-500">{t('mediation.traders.traderCode') || 'Code'}: {deal.trader?.traderCode}</p>
                   </div>
                </div>
             </div>

             {/* Shipping Tracking */}
             {deal.shippingCompany && (
               <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('shippingTracking.title') || 'Shipping Tracking'}</h3>
                  <Card className="shadow-sm">
                     <CardContent className="p-4">
                        {shippingTracking ? (
                           <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-2">
                                 {shippingTracking.status === 'DELIVERED' ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                 ) : shippingTracking.status === 'IN_TRANSIT' || shippingTracking.status === 'OUT_FOR_DELIVERY' ? (
                                    <Truck className="w-5 h-5 text-blue-500" />
                                 ) : (
                                    <Clock className="w-5 h-5 text-gray-500" />
                                 )}
                                 <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    shippingTracking.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                    shippingTracking.status === 'IN_TRANSIT' || shippingTracking.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                 }`}>
                                    {shippingTracking.status.replace('_', ' ')}
                                 </span>
                              </div>
                              {shippingTracking.trackingNumber && (
                                 <div className="text-xs">
                                    <span className="text-gray-500">Tracking:</span>
                                    <p className="font-mono mt-1">{shippingTracking.trackingNumber}</p>
                                 </div>
                              )}
                              {shippingTracking.currentLocation && (
                                 <div className="text-xs">
                                    <span className="text-gray-500">Location:</span>
                                    <p className="mt-1">{shippingTracking.currentLocation}</p>
                                 </div>
                              )}
                              {shippingTracking.estimatedDelivery && (
                                 <div className="text-xs">
                                    <span className="text-gray-500">Est. Delivery:</span>
                                    <p className="mt-1">{formatDate(shippingTracking.estimatedDelivery)}</p>
                                 </div>
                              )}
                              {shippingTracking.actualDelivery && (
                                 <div className="text-xs">
                                    <span className="text-gray-500">Delivered:</span>
                                    <p className="mt-1 text-green-600 font-semibold">{formatDate(shippingTracking.actualDelivery)}</p>
                                 </div>
                              )}
                              {shippingTracking.statusHistory && shippingTracking.statusHistory.length > 0 && (
                                 <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-xs font-semibold text-gray-500 mb-2">History</p>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                       {shippingTracking.statusHistory.slice(0, 3).map((history) => (
                                          <div key={history.id} className="text-xs text-gray-600">
                                             <span className="font-medium">{history.status.replace('_', ' ')}</span>
                                             <span className="text-gray-400 ml-2">{formatDate(history.createdAt)}</span>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              )}
                           </div>
                        ) : (
                           <div className="flex items-center gap-2 text-gray-500 text-sm">
                              <AlertCircle className="w-4 h-4" />
                              <span>No tracking info yet</span>
                           </div>
                        )}
                     </CardContent>
                  </Card>
               </div>
             )}
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-gray-50 relative">
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                   <div className="text-center text-gray-400 mt-10">
                      <p>Start the conversation with the trader.</p>
                   </div>
                ) : (
                   messages.map((msg, idx) => {
                      const isMe = msg.clientId === deal.clientId || msg.senderType === 'CLIENT';
                      const messageContent = msg.content || msg.message || '';
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
                         <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                               isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'
                            }`}>
                              {(hasPrice || hasQuantity) && (
                                <div className={`mb-2 pb-2 border-b ${isMe ? 'border-blue-400' : 'border-gray-300'}`}>
                                  {hasPrice && (
                                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                      <DollarSign className={`w-4 h-4 ${isMe ? 'text-blue-100' : 'text-gray-600'}`} />
                                      <span className="font-semibold">
                                        {t('mediation.deals.negotiationForm.proposedPrice') || 'Proposed Price'}: ${formatCurrency(msg.proposedPrice)}
                                      </span>
                                    </div>
                                  )}
                                  {hasQuantity && (
                                    <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                      <Package className={`w-4 h-4 ${isMe ? 'text-blue-100' : 'text-gray-600'}`} />
                                      <span className="font-semibold">
                                        {t('mediation.deals.negotiationForm.proposedQuantity') || 'Proposed Quantity'}: {msg.proposedQuantity?.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                              {messageContent && (
                                <p className="text-sm whitespace-pre-wrap">{messageContent}</p>
                              )}
                               <p className={`text-[10px] mt-2 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                               </p>
                            </div>
                         </div>
                      )
                   })
                )}
                <div ref={messagesEndRef} />
             </div>

             {/* Message Input */}
             <div className="bg-white p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="space-y-3">
                  {/* Price and Quantity Proposals */}
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('mediation.deals.negotiationForm.proposedPrice') || 'Proposed Price (Optional)'}
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          value={proposedPrice}
                          onChange={(e) => setProposedPrice(e.target.value)}
                          placeholder={t('mediation.deals.negotiationForm.pricePlaceholder') || "0.00"}
                          className={`pl-10 ${isRTL ? 'text-right' : 'text-left'}`}
                          dir={isRTL ? 'rtl' : 'ltr'}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('mediation.deals.negotiationForm.proposedQuantity') || 'Proposed Quantity (Optional)'}
                      </label>
                        <div className="relative">
                          <Package className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                          <Input 
                            type="number"
                            min="1"
                            value={proposedQuantity}
                            onChange={(e) => setProposedQuantity(e.target.value)}
                            placeholder={t('mediation.deals.negotiationForm.quantityPlaceholder') || "0"}
                            className={`pl-10 ${isRTL ? 'text-right' : 'text-left'} ${
                              proposedQuantity && deal.items?.[0]?.offerItem?.packageQuantity && parseInt(proposedQuantity) % deal.items[0].offerItem.packageQuantity !== 0
                                ? 'border-red-300 ring-1 ring-red-200'
                                : ''
                            }`}
                            dir={isRTL ? 'rtl' : 'ltr'}
                          />
                          {proposedQuantity && deal.items?.[0]?.offerItem?.packageQuantity && (
                            <div className="mt-2 text-xs">
                              {parseInt(proposedQuantity) % deal.items[0].offerItem.packageQuantity === 0 ? (
                                <span className="text-green-600 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {t("mediation.deals.contains") || "Contains"} {parseInt(proposedQuantity) / deal.items[0].offerItem.packageQuantity} {t("mediation.deals.cartons") || "Cartons"}
                                </span>
                              ) : (
                                <div className="bg-red-50 p-2 rounded border border-red-100 animate-in fade-in slide-in-from-top-1">
                                  <p className="text-red-700 flex items-center gap-1 mb-1 font-medium">
                                    <AlertCircle className="w-3 h-3" />
                                    {t("mediation.deals.invalidCartonQty") || "Must be whole cartons"} ({deal.items[0].offerItem.packageQuantity} {t("mediation.deals.pcsPerCarton") || "pcs/ctn"})
                                  </p>
                                  <div className="flex gap-2 mt-1">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const size = deal.items[0].offerItem.packageQuantity;
                                        setProposedQuantity(Math.floor(parseInt(proposedQuantity) / size) * size);
                                      }}
                                      className="h-6 text-xs px-2 border-red-200 text-red-700 hover:bg-red-50"
                                    >
                                      {t("common.roundDown") || "Round Down"}: {Math.floor(parseInt(proposedQuantity) / deal.items[0].offerItem.packageQuantity) * deal.items[0].offerItem.packageQuantity}
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => {
                                        const size = deal.items[0].offerItem.packageQuantity;
                                        setProposedQuantity(Math.ceil(parseInt(proposedQuantity) / size) * size);
                                      }}
                                      className="h-6 text-xs px-2 bg-red-600 hover:bg-red-700 text-white border-0"
                                    >
                                      {t("common.roundUp") || "Round Up"}: {Math.ceil(parseInt(proposedQuantity) / deal.items[0].offerItem.packageQuantity) * deal.items[0].offerItem.packageQuantity}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                    </div>
                  </div>
                  
                  {/* Message Input */}
                  <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Input 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t('mediation.deals.negotiationForm.messagePlaceholder') || "Type your message or proposal..."}
                      className="flex-1"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    <Button 
                      type="submit" 
                      disabled={sending || (!newMessage.trim() && !proposedPrice && !proposedQuantity) || (proposedQuantity && deal.items?.[0]?.offerItem?.packageQuantity && parseInt(proposedQuantity) % deal.items[0].offerItem.packageQuantity !== 0)} 
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />}
                    </Button>
                  </div>
                </form>
             </div>
          </div>
       </div>
    </div>
  );
}
