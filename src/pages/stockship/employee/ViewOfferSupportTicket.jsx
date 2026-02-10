import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  Gift,
  Clock,
  CheckCircle,
  XCircle,
  Circle,
  User,
  Store,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { employeeApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';

const ViewOfferSupportTicket = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { getAuth } = useMultiAuth();
  const { user } = getAuth('employee');
  const messagesEndRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusSelect, setStatusSelect] = useState('');

  useEffect(() => {
    if (user?.id && id) {
      fetchTicket();
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchTicket, 5000);
      return () => clearInterval(interval);
    }
  }, [user?.id, id]);

  useEffect(() => {
    if (ticket) {
      setStatusSelect(ticket.status);
    }
  }, [ticket]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTicket = async () => {
    try {
      const response = await employeeApi.getOfferSupportTicketById(id);
      const data = response.data?.data || response.data;
      setTicket(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      showToast.error(t('mediation.support.loadFailed') || 'Failed to load ticket');
      navigate('/stockship/employee/offer-support-tickets');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      return;
    }

    if (ticket.status === 'CLOSED') {
      showToast.error(t('mediation.support.ticketClosed') || 'Cannot send message to closed ticket');
      return;
    }

    try {
      setSending(true);
      await employeeApi.addOfferSupportTicketMessage(id, {
        message: newMessage.trim()
      });
      setNewMessage('');
      await fetchTicket();
      showToast.success(
        t('mediation.support.messageSent') || 'Message Sent',
        t('mediation.support.messageSentSuccess') || 'Your message has been sent successfully'
      );
    } catch (error) {
      console.error('Error sending message:', error);
      showToast.error(
        t('mediation.support.sendFailed') || 'Failed to send message',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusSelect || statusSelect === ticket.status) {
      return;
    }

    try {
      setUpdatingStatus(true);
      await employeeApi.updateOfferSupportTicketStatus(id, {
        status: statusSelect
      });
      await fetchTicket();
      showToast.success(
        t('mediation.support.statusUpdated') || 'Status Updated',
        t('mediation.support.statusUpdatedSuccess') || 'Ticket status has been updated successfully'
      );
    } catch (error) {
      console.error('Error updating status:', error);
      showToast.error(
        t('mediation.support.updateFailed') || 'Failed to update status',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      OPEN: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Circle, label: t('mediation.support.status.open') || 'Open' },
      IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: t('mediation.support.status.inProgress') || 'In Progress' },
      RESOLVED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: t('mediation.support.status.resolved') || 'Resolved' },
      CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle, label: t('mediation.support.status.closed') || 'Closed' },
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

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      LOW: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.support.priority.low') || 'Low' },
      MEDIUM: { bg: 'bg-blue-100', text: 'text-blue-800', label: t('mediation.support.priority.medium') || 'Medium' },
      HIGH: { bg: 'bg-orange-100', text: 'text-orange-800', label: t('mediation.support.priority.high') || 'High' },
      URGENT: { bg: 'bg-red-100', text: 'text-red-800', label: t('mediation.support.priority.urgent') || 'Urgent' },
    };
    const config = priorityConfig[priority] || { bg: 'bg-gray-100', text: 'text-gray-800', label: priority };
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('mediation.support.ticketNotFound') || 'Ticket not found'}</p>
        </div>
      </div>
    );
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
            onClick={() => navigate('/stockship/employee/offer-support-tickets')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </motion.button>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('mediation.support.ticket') || 'Support Ticket'}
            </h1>
            <p className="text-muted-foreground mt-2">{ticket.subject}</p>
          </div>
        </div>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {getStatusBadge(ticket.status)}
          {getPriorityBadge(ticket.priority)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Info */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Gift className="w-5 h-5 text-gray-600" />
                {t('mediation.support.offerInfo') || 'Offer Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.offers.offerTitle') || 'Offer Title'}
                  </label>
                  <p className="text-base text-gray-900">{ticket.offer?.title || 'N/A'}</p>
                </div>
                {ticket.offer?.status && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-1 block">
                      {t('mediation.common.status') || 'Status'}
                    </label>
                    <p className="text-base text-gray-900">{ticket.offer.status}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.offers.trader') || 'Trader'}
                  </label>
                  <p className="text-base text-gray-900 flex items-center gap-2">
                    <Store className="w-4 h-4 text-gray-400" />
                    {ticket.trader?.companyName || ticket.trader?.name || 'N/A'}
                    {ticket.trader?.traderCode && (
                      <span className="text-sm text-gray-500">({ticket.trader.traderCode})</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('common.createdAt') || 'Created At'}
                  </label>
                  <p className="text-base text-gray-900">
                    {new Date(ticket.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <MessageSquare className="w-5 h-5 text-gray-600" />
                {t('mediation.support.messages') || 'Messages'} ({ticket.messages?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {ticket.messages && ticket.messages.length > 0 ? (
                  ticket.messages.map((message, index) => {
                    const isEmployee = message.senderType === 'EMPLOYEE' || message.senderType === 'ADMIN';
                    const senderName = isEmployee 
                      ? (ticket.employee?.name || user?.name || t('mediation.support.you') || 'You')
                      : (ticket.trader?.name || ticket.trader?.companyName || t('mediation.support.trader') || 'Trader');

                    return (
                      <div
                        key={message.id || index}
                        className={`flex ${isEmployee ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-4 ${
                            isEmployee
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            {isEmployee ? (
                              <User className="w-4 h-4" />
                            ) : (
                              <Store className="w-4 h-4" />
                            )}
                            <span className="text-sm font-semibold">{senderName}</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                          <p className={`text-xs mt-2 ${isEmployee ? 'text-blue-100' : 'text-gray-500'}`}>
                            {new Date(message.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{t('mediation.support.noMessages') || 'No messages yet'}</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
          </Card>

          {/* Message Input */}
          {ticket.status !== 'CLOSED' && (
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('mediation.support.messagePlaceholder') || 'Type your message...'}
                    rows={4}
                    className="w-full"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  <div className={`flex justify-end gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('common.sending') || 'Sending...'}
                        </>
                      ) : (
                        <>
                          <Send className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''} mr-2`} />
                          {t('common.send') || 'Send'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Details */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`text-lg font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('mediation.support.ticketDetails') || 'Ticket Details'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">
                  {t('mediation.support.subject') || 'Subject'}
                </label>
                <p className="text-base text-gray-900">{ticket.subject}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">
                  {t('mediation.support.priorityLabel') || 'Priority'}
                </label>
                {getPriorityBadge(ticket.priority)}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-2 block">
                  {t('mediation.common.status') || 'Status'}
                </Label>
                <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <select
                    value={statusSelect}
                    onChange={(e) => setStatusSelect(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
                  >
                    <option value="OPEN">{t('mediation.support.status.open') || 'Open'}</option>
                    <option value="IN_PROGRESS">{t('mediation.support.status.inProgress') || 'In Progress'}</option>
                    <option value="RESOLVED">{t('mediation.support.status.resolved') || 'Resolved'}</option>
                    <option value="CLOSED">{t('mediation.support.status.closed') || 'Closed'}</option>
                  </select>
                  <Button
                    onClick={handleUpdateStatus}
                    disabled={updatingStatus || statusSelect === ticket.status}
                    size="sm"
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    {updatingStatus ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Settings className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              {ticket.resolvedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.support.resolvedAt') || 'Resolved At'}
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(ticket.resolvedAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
              )}
              {ticket.closedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.support.closedAt') || 'Closed At'}
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(ticket.closedAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
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

export default ViewOfferSupportTicket;
