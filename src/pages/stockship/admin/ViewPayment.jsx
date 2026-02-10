import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Calendar, CheckCircle, XCircle, User, Building2, FileText, Receipt, Building, ExternalLink } from 'lucide-react';
import showToast from '@/lib/toast';

const ViewPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    fetchPayment();
  }, [id]);

  const fetchPayment = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPayment(id);
      setPayment(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching payment:', error);
      showToast.error('Failed to load payment', error.response?.data?.message || 'Payment not found');
      navigate('/stockship/admin/payments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace(/_/g, ' ') || 'Unknown'}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.payments.loading') || 'Loading payment...'}</p>
        </div>
      </div>
    );
  }

  if (!payment) {
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
            onClick={() => navigate('/stockship/admin/payments')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold">{t('mediation.payments.title') || 'Payment'} - {t('mediation.payments.viewDetails') || 'Details'}</h1>
            <p className="text-muted-foreground mt-2">#{payment.id} - {payment.transactionId || 'N/A'}</p>
          </div>
        </div>
        {getStatusBadge(payment.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {t('mediation.viewPayment.paymentInfo') || 'Payment Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.id')}</label>
                  <p className="mt-1 font-mono">{payment.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.transactionId') || 'Transaction ID'}</label>
                  <p className="mt-1 font-mono">{payment.transactionId || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.status')}</label>
                  <div className="mt-1">{getStatusBadge(payment.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.payments.paymentMethod')}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <p>{payment.method?.replace(/_/g, ' ') || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.amount') || 'Amount'}</label>
                  <p className="mt-1 text-lg font-semibold">{payment.amount ? `${Number(payment.amount).toLocaleString()} SAR` : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.tax') || 'Tax'}</label>
                  <p className="mt-1">{payment.tax ? `${Number(payment.tax).toLocaleString()} SAR` : '0 SAR'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.commission') || 'Commission'}</label>
                  <p className="mt-1">{payment.siteCommission ? `${Number(payment.siteCommission).toLocaleString()} SAR` : '0 SAR'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.netAmount') || 'Net Amount'}</label>
                  <p className="mt-1 font-semibold">
                    {payment.amount && payment.tax && payment.siteCommission
                      ? `${(Number(payment.amount) - Number(payment.tax || 0) - Number(payment.siteCommission || 0)).toLocaleString()} SAR`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deal/Order Information */}
          {payment.deal && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('mediation.viewPayment.dealInfo') || 'Deal Information'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.dealNumber') || 'Deal Number'}</label>
                    <p className="mt-1 font-mono">{payment.deal.dealNumber || `#${payment.deal.id}`}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.status')}</label>
                    <div className="mt-1">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {payment.deal.status || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.dealAmount') || 'Deal Amount'}</label>
                    <p className="mt-1 font-semibold">
                      {payment.deal.negotiatedAmount ? `${Number(payment.deal.negotiatedAmount).toLocaleString()} SAR` : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Client Information */}
          {payment.deal?.client && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t('mediation.viewPayment.clientInfo') || 'Client Information'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.name')}</label>
                    <p className="mt-1">{payment.deal.client.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.email')}</label>
                    <p className="mt-1">{payment.deal.client.email || 'N/A'}</p>
                  </div>
                  {payment.deal.client.phone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.phone')}</label>
                      <p className="mt-1">{payment.deal.client.phone || 'N/A'}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trader Information */}
          {payment.deal?.trader && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {t('mediation.viewPayment.traderInfo') || 'Trader Information'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.traders.companyName')}</label>
                    <p className="mt-1">{payment.deal.trader.companyName || payment.deal.trader.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.traders.traderCode')}</label>
                    <p className="mt-1 font-mono">{payment.deal.trader.traderCode || 'N/A'}</p>
                  </div>
                  {payment.deal.trader.email && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.email')}</label>
                      <p className="mt-1">{payment.deal.trader.email || 'N/A'}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method Details */}
          {payment.method === 'BANK_CARD' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {t('mediation.viewPayment.cardDetails') || 'Card Details'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {payment.cardLast4 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.last4Digits') || 'Last 4 Digits'}</label>
                      <p className="mt-1 font-mono">**** {payment.cardLast4}</p>
                    </div>
                  )}
                  {payment.cardBrand && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.cardBrand') || 'Card Brand'}</label>
                      <p className="mt-1">{payment.cardBrand}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {payment.method === 'BANK_TRANSFER' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  {t('mediation.viewPayment.bankTransferDetails') || 'Bank Transfer Details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {payment.bankName && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.bankName') || 'Bank Name'}</label>
                      <p className="mt-1">{payment.bankName}</p>
                    </div>
                  )}
                  {payment.iban && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.iban') || 'IBAN'}</label>
                      <p className="mt-1 font-mono">{payment.iban}</p>
                    </div>
                  )}
                  {payment.beneficiary && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.beneficiary') || 'Beneficiary'}</label>
                      <p className="mt-1">{payment.beneficiary}</p>
                    </div>
                  )}
                </div>
                {payment.receiptUrl && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.receipt') || 'Receipt'}</label>
                    <div className="mt-2">
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        <Receipt className="w-4 h-4" />
                        {t('mediation.viewPayment.viewReceipt') || 'View Receipt'}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('mediation.viewPayment.importantDates') || 'Important Dates'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.createdAt') || 'Created At'}</label>
                <p className="mt-1">{formatDate(payment.createdAt)}</p>
              </div>
              {payment.updatedAt && payment.updatedAt !== payment.createdAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.lastUpdated') || 'Last Updated'}</label>
                  <p className="mt-1">{formatDate(payment.updatedAt)}</p>
                </div>
              )}
              {payment.processedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.processedAt') || 'Processed At'}</label>
                  <p className="mt-1">{formatDate(payment.processedAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('mediation.viewPayment.summary') || 'Payment Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('mediation.viewPayment.amount') || 'Amount'}</span>
                <span className="font-semibold">{payment.amount ? `${Number(payment.amount).toLocaleString()} SAR` : 'N/A'}</span>
              </div>
              {payment.tax && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('mediation.viewPayment.tax') || 'Tax'}</span>
                  <span>- {Number(payment.tax).toLocaleString()} SAR</span>
                </div>
              )}
              {payment.siteCommission && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('mediation.viewPayment.commission') || 'Commission'}</span>
                  <span>- {Number(payment.siteCommission).toLocaleString()} SAR</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">{t('mediation.viewPayment.netAmount') || 'Net Amount'}</span>
                <span className="font-bold text-lg">
                  {payment.amount && payment.tax && payment.siteCommission
                    ? `${(Number(payment.amount) - Number(payment.tax || 0) - Number(payment.siteCommission || 0)).toLocaleString()} SAR`
                    : payment.amount
                    ? `${Number(payment.amount).toLocaleString()} SAR`
                    : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default ViewPayment;

