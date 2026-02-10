import React, { useState, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { employeeApi, offerApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';

const CreateOfferSupportTicket = () => {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { getAuth } = useMultiAuth();
  const { user } = getAuth('employee');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [offer, setOffer] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'MEDIUM'
  });

  useEffect(() => {
    if (user?.id && offerId) {
      fetchOffer();
    }
  }, [user?.id, offerId]);

  const fetchOffer = async () => {
    try {
      setLoading(true);
      const response = await offerApi.getOfferById(offerId);
      const data = response.data?.data?.offer || response.data?.data || response.data;
      setOffer(data);
    } catch (error) {
      console.error('Error fetching offer:', error);
      showToast.error(t('mediation.offers.loadFailed') || 'Failed to load offer');
      navigate('/stockship/employee/offer-support-tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject.trim()) {
      showToast.error(
        t('mediation.support.subjectRequired') || 'Subject Required',
        t('mediation.support.subjectRequiredDesc') || 'Please enter a subject for your ticket'
      );
      return;
    }

    if (!formData.message.trim()) {
      showToast.error(
        t('mediation.support.messageRequired') || 'Message Required',
        t('mediation.support.messageRequiredDesc') || 'Please enter a message for your ticket'
      );
      return;
    }

    try {
      setSubmitting(true);
      await employeeApi.createOfferSupportTicket(offerId, {
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        priority: formData.priority
      });
      showToast.success(
        t('mediation.support.ticketCreated') || 'Ticket Created',
        t('mediation.support.ticketCreatedSuccess') || 'Your support ticket has been created successfully'
      );
      navigate(`/stockship/employee/offer-support-tickets`);
    } catch (error) {
      console.error('Error creating ticket:', error);
      showToast.error(
        t('mediation.support.createFailed') || 'Failed to create ticket',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setSubmitting(false);
    }
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

  if (!offer) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('mediation.offers.notFound') || 'Offer not found'}</p>
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
            {t('mediation.support.createTicket') || 'Create Support Ticket'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('mediation.support.createTicketDescEmployee') || 'Create a support ticket for this offer to communicate with the trader'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <MessageSquare className="w-5 h-5 text-gray-600" />
                {t('mediation.support.ticketForm') || 'Ticket Form'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="subject" className="text-sm font-medium text-gray-700 mb-2 block">
                    {t('mediation.support.subject') || 'Subject'} *
                  </Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder={t('mediation.support.subjectPlaceholder') || 'Enter ticket subject...'}
                    className="w-full"
                    required
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>

                <div>
                  <Label htmlFor="priority" className="text-sm font-medium text-gray-700 mb-2 block">
                    {t('mediation.support.priorityLabel') || 'Priority'}
                  </Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
                  >
                    <option value="LOW">{t('mediation.support.priority.low') || 'Low'}</option>
                    <option value="MEDIUM">{t('mediation.support.priority.medium') || 'Medium'}</option>
                    <option value="HIGH">{t('mediation.support.priority.high') || 'High'}</option>
                    <option value="URGENT">{t('mediation.support.priority.urgent') || 'Urgent'}</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="message" className="text-sm font-medium text-gray-700 mb-2 block">
                    {t('mediation.support.message') || 'Message'} *
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={t('mediation.support.messagePlaceholder') || 'Describe your issue or question...'}
                    rows={8}
                    className="w-full"
                    required
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>

                <div className={`flex justify-end gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/stockship/employee/offer-support-tickets')}
                  >
                    {t('common.cancel') || 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !formData.subject.trim() || !formData.message.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('common.creating') || 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Send className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''} mr-2`} />
                        {t('mediation.support.createTicket') || 'Create Ticket'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Offer Info */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Gift className="w-5 h-5 text-gray-600" />
                {t('mediation.offers.offerInfo') || 'Offer Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 block">
                    {t('mediation.offers.offerTitle') || 'Offer Title'}
                  </label>
                  <p className="text-base text-gray-900">{offer.title || 'N/A'}</p>
                </div>
                {offer.status && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-1 block">
                      {t('mediation.common.status') || 'Status'}
                    </label>
                    <p className="text-base text-gray-900">{offer.status}</p>
                  </div>
                )}
                {offer.trader && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-1 block">
                      {t('mediation.traders.trader') || 'Trader'}
                    </label>
                    <p className="text-base text-gray-900">{offer.trader.name || offer.trader.companyName || 'N/A'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h3 className="font-semibold text-blue-900 mb-1">
                    {t('mediation.support.ticketInfo') || 'About Support Tickets'}
                  </h3>
                  <p className="text-sm text-blue-800">
                    {t('mediation.support.ticketInfoDescEmployee') || 'Support tickets allow you to communicate with traders about issues related to their offers. The trader will be notified and can respond to your ticket.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default CreateOfferSupportTicket;
