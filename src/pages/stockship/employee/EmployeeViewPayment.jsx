import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { employeeApi, dealApi, financialApi } from '@/lib/mediationApi';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  User, 
  Building2, 
  FileText, 
  Receipt, 
  Building, 
  ExternalLink,
  Download,
  Clock,
  Save,
  Loader2
} from 'lucide-react';
import showToast from '@/lib/toast';
import NotFound from '@/pages/ErrorPages/NotFound';
import Forbidden from '@/pages/ErrorPages/Forbidden';
import ServerError from '@/pages/ErrorPages/ServerError';

const EmployeeViewPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { getAuth } = useMultiAuth();
  const { user } = getAuth('employee');
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null); // '404', '403', '500'
  const [verificationData, setVerificationData] = useState({
    verified: true,
    notes: ''
  });
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchPayment();
    }
  }, [id, user]);

  const fetchPayment = async () => {
    try {
      setLoading(true);
      
      // Since payments are nested in deals, we need to find the payment through deals
      // First, get all deals for the employee
      const dealsResponse = await employeeApi.getEmployeeDeals(user.id, {
        page: 1,
        limit: 1000
      });
      
      let deals = [];
      if (dealsResponse?.data?.data) {
        deals = Array.isArray(dealsResponse.data.data) ? dealsResponse.data.data : [];
      } else if (dealsResponse?.data) {
        deals = Array.isArray(dealsResponse.data) ? dealsResponse.data : [];
      }
      
      // Find the payment in all deals
      // Payment ID can be UUID (string) or integer
      let foundPayment = null;
      for (const deal of deals) {
        if (deal.payments && Array.isArray(deal.payments)) {
          // Try to match by string first (UUID), then by parsed integer
          const paymentMatch = deal.payments.find(p => {
            // Direct string match (for UUIDs)
            if (p.id === id) return true;
            // Try integer match (for numeric IDs)
            const parsedId = parseInt(id, 10);
            if (!isNaN(parsedId) && p.id === parsedId) return true;
            // Try string comparison (in case of string numbers)
            return String(p.id) === String(id);
          });
          if (paymentMatch) {
            foundPayment = {
              ...paymentMatch,
              deal: {
                id: deal.id,
                dealNumber: deal.dealNumber,
                status: deal.status,
                negotiatedAmount: deal.negotiatedAmount,
                trader: deal.trader,
                client: deal.client
              }
            };
            break;
          }
        }
      }
      
      if (!foundPayment) {
        setErrorType('404');
        setError(new Error(t('mediation.payments.paymentNotFound') || 'Payment not found'));
        setLoading(false);
        return;
      }
      
      setPayment(foundPayment);
      setError(null);
      setErrorType(null);
    } catch (error) {
      console.error('Error fetching payment:', error);
      const status = error.response?.status;
      
      if (status === 404) {
        setErrorType('404');
        setError(error);
      } else if (status === 403 || status === 401) {
        setErrorType('403');
        setError(error);
      } else if (status >= 500) {
        setErrorType('500');
        setError(error);
      } else {
        setErrorType('500');
        setError(error);
      }
      
      showToast.error(
        t('mediation.payments.loadPaymentFailed') || 'Failed to load payment',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!payment) return;

    try {
      setVerifying(true);
      await financialApi.verifyPayment(payment.id, verificationData);
      showToast.success(
        verificationData.verified 
          ? (t('mediation.employee.paymentVerified') || 'Payment Verified')
          : (t('mediation.employee.paymentRejected') || 'Payment Rejected'),
        verificationData.verified
          ? (t('mediation.employee.paymentVerifiedSuccess') || 'Payment has been verified successfully')
          : (t('mediation.employee.paymentRejectedSuccess') || 'Payment has been rejected')
      );
      // Refresh payment data
      fetchPayment();
    } catch (error) {
      console.error('Error verifying payment:', error);
      showToast.error(
        t('mediation.employee.verifyFailed') || 'Failed to verify payment',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('mediation.payments.pending') || 'Pending', icon: Clock },
      PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-800', label: t('mediation.payments.processing') || 'Processing', icon: Clock },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: t('mediation.payments.completed') || 'Completed', icon: CheckCircle },
      VERIFIED: { bg: 'bg-green-100', text: 'text-green-800', label: t('mediation.payments.verified') || 'Verified', icon: CheckCircle },
      FAILED: { bg: 'bg-red-100', text: 'text-red-800', label: t('mediation.payments.failed') || 'Failed', icon: XCircle },
      REFUNDED: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.payments.refunded') || 'Refunded', icon: XCircle },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.payments.cancelled') || 'Cancelled', icon: XCircle }
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status || 'Unknown', icon: Clock };
    const Icon = config.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text} flex items-center gap-2`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Build full URL for receipt (backend serves /uploads at its origin)
  const getReceiptFullUrl = (receiptUrl) => {
    if (!receiptUrl) return null;
    if (receiptUrl.startsWith('http')) return receiptUrl;
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    return `${base}${receiptUrl.startsWith('/') ? '' : '/'}${receiptUrl}`;
  };

  // Show error pages
  if (errorType === '404') {
    return <NotFound />;
  }
  if (errorType === '403') {
    return <Forbidden />;
  }
  if (errorType === '500') {
    return <ServerError error={error} resetError={() => {
      setError(null);
      setErrorType(null);
      fetchPayment();
    }} />;
  }

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

  if (!payment && !error) {
    return <NotFound />;
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
            onClick={() => navigate('/stockship/employee/payments')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold">{t('mediation.payments.title') || 'Payment'} - {t('mediation.payments.viewDetails') || 'Details'}</h1>
            <p className="text-muted-foreground mt-2">
              #{payment.id} - {payment.transactionId || payment.deal?.dealNumber || 'N/A'}
            </p>
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
                {payment.transactionId && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.transactionId') || 'Transaction ID'}</label>
                    <p className="mt-1 font-mono">{payment.transactionId}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.status')}</label>
                  <div className="mt-1">{getStatusBadge(payment.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.payments.paymentMethod')}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <p className="capitalize">{payment.method?.replace(/_/g, ' ') || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.amount') || 'Amount'}</label>
                  <p className="mt-1 text-lg font-semibold">
                    ${(Number(payment.amount) || 0).toFixed(2)}
                  </p>
                </div>
                {payment.tax && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.tax') || 'Tax'}</label>
                    <p className="mt-1">${(Number(payment.tax) || 0).toFixed(2)}</p>
                  </div>
                )}
                {payment.siteCommission && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.commission') || 'Commission'}</label>
                    <p className="mt-1">${(Number(payment.siteCommission) || 0).toFixed(2)}</p>
                  </div>
                )}
                {(payment.tax || payment.siteCommission) && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.netAmount') || 'Net Amount'}</label>
                    <p className="mt-1 font-semibold">
                      ${((Number(payment.amount) || 0) - (Number(payment.tax || 0)) - (Number(payment.siteCommission || 0))).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Deal Information */}
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
                  {payment.deal.negotiatedAmount && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewPayment.dealAmount') || 'Deal Amount'}</label>
                      <p className="mt-1 font-semibold">
                        ${(Number(payment.deal.negotiatedAmount) || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Actions</label>
                    <div className="mt-1">
                      <button
                        onClick={() => navigate(`/stockship/employee/deals/${payment.deal.id}`)}
                        className="text-primary hover:underline text-sm"
                      >
                        {t('mediation.viewPayment.viewDeal') || 'View Deal'} →
                      </button>
                    </div>
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
                  {payment.deal.client.email && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('mediation.common.email')}</label>
                      <p className="mt-1">{payment.deal.client.email || 'N/A'}</p>
                    </div>
                  )}
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
                  {payment.deal.trader.traderCode && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('mediation.traders.traderCode')}</label>
                      <p className="mt-1 font-mono">{payment.deal.trader.traderCode}</p>
                    </div>
                  )}
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
                {payment.receiptUrl ? (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">{t('mediation.viewPayment.receipt') || 'Receipt'}</label>
                    {(() => {
                      const fullUrl = getReceiptFullUrl(payment.receiptUrl);
                      const isPdf = /\.pdf$/i.test(payment.receiptUrl);
                      const fileName = payment.receiptUrl.split('/').pop() || (isPdf ? 'receipt.pdf' : 'receipt.png');
                      return (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
                          {isPdf ? (
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                            >
                              <FileText className="w-5 h-5" />
                              {t('mediation.viewPayment.viewReceipt') || 'View Receipt'} (PDF)
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : (
                            <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="block">
                              <img
                                src={fullUrl}
                                alt={t('mediation.viewPayment.receipt') || 'Receipt'}
                                className="max-w-full max-h-80 w-auto rounded-lg border border-gray-200 object-contain bg-white"
                              />
                              <span className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline">
                                <ExternalLink className="w-3 h-3" />
                                {t('mediation.viewPayment.viewFullSize') || 'View full size'}
                              </span>
                            </a>
                          )}
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                            <a
                              href={fullUrl}
                              download={fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              {t('mediation.viewPayment.downloadReceipt') || 'تنزيل الملف'}
                            </a>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('mediation.viewPayment.noReceiptUploaded') || 'No receipt uploaded yet.'}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Verification Form (only for pending payments) */}
          {payment.status === 'PENDING' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('mediation.employee.verificationDecision') || 'Verification Decision'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="verified"
                      checked={verificationData.verified === true}
                      onChange={() => setVerificationData(prev => ({ ...prev, verified: true }))}
                      disabled={verifying}
                      className="w-4 h-4 text-green-600"
                    />
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">{t('mediation.employee.verify') || 'Verify'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="verified"
                      checked={verificationData.verified === false}
                      onChange={() => setVerificationData(prev => ({ ...prev, verified: false }))}
                      disabled={verifying}
                      className="w-4 h-4 text-red-600"
                    />
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-gray-900">{t('mediation.employee.reject') || 'Reject'}</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('mediation.employee.verificationNotes') || 'Verification Notes'}
                  </label>
                  <textarea
                    value={verificationData.notes}
                    onChange={(e) => setVerificationData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={t('mediation.employee.verificationNotesPlaceholder') || 'Add notes about your verification decision...'}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                    rows="4"
                    disabled={verifying}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleVerify}
                  disabled={verifying}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 ${
                    verificationData.verified 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('mediation.employee.verifying') || 'Verifying...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {verificationData.verified 
                        ? (t('mediation.employee.verifyPayment') || 'Verify Payment')
                        : (t('mediation.employee.rejectPayment') || 'Reject Payment')
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
                <span className="font-semibold">${(Number(payment.amount) || 0).toFixed(2)}</span>
              </div>
              {payment.tax && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('mediation.viewPayment.tax') || 'Tax'}</span>
                  <span>- ${(Number(payment.tax) || 0).toFixed(2)}</span>
                </div>
              )}
              {payment.siteCommission && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('mediation.viewPayment.commission') || 'Commission'}</span>
                  <span>- ${(Number(payment.siteCommission) || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">{t('mediation.viewPayment.netAmount') || 'Net Amount'}</span>
                <span className="font-bold text-lg">
                  ${((Number(payment.amount) || 0) - (Number(payment.tax || 0)) - (Number(payment.siteCommission || 0))).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default EmployeeViewPayment;
