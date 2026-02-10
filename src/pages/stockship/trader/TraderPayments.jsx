import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import StandardDataTable from '@/components/StandardDataTable';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Eye, 
  CreditCard, 
  Filter, 
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Building2,
  User,
  Calendar,
  X,
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  Share2,
  Loader2
} from 'lucide-react';
import { dealApi, invoiceApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';

const TraderPayments = () => {
  const navigate = useNavigate();
  const { getAuth } = useMultiAuth();
  const { t, language } = useLanguage();
  const { user } = getAuth('trader');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchPayments();
    } else {
      console.warn('No user found, cannot fetch payments');
      setLoading(false);
    }
  }, [user, pagination.page, statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchPayments();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      // Get trader's deals first (don't filter by deal status, get all deals)
      const dealsResponse = await dealApi.getDeals({
        traderId: user.id,
        page: 1,
        limit: 1000 // Get all deals to extract payments
      });
      
      // Handle different response structures
      let deals = [];
      if (dealsResponse?.data?.data) {
        deals = Array.isArray(dealsResponse.data.data) ? dealsResponse.data.data : [];
      } else if (dealsResponse?.data) {
        deals = Array.isArray(dealsResponse.data) ? dealsResponse.data : [];
      }
      
      // Extract all payments from deals
      let allPayments = [];
      deals.forEach(deal => {
        if (deal.payments && Array.isArray(deal.payments) && deal.payments.length > 0) {
          deal.payments.forEach(payment => {
            allPayments.push({
              ...payment,
              deal: {
                id: deal.id,
                dealNumber: deal.dealNumber,
                trader: deal.trader,
                client: deal.client
              },
              dealNumber: deal.dealNumber,
              client: deal.client,
              trader: deal.trader
            });
          });
        }
      });
      
      // Filter by payment status if needed
      if (statusFilter) {
        allPayments = allPayments.filter(p => p.status === statusFilter);
      }
      
      // Filter by search term if needed
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        allPayments = allPayments.filter(p => 
          p.deal?.dealNumber?.toLowerCase().includes(searchLower) ||
          p.deal?.client?.name?.toLowerCase().includes(searchLower) ||
          p.deal?.trader?.companyName?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply pagination client-side
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedPayments = allPayments.slice(startIndex, endIndex);
      
      setPayments(paginatedPayments);
      setPagination(prev => ({
        ...prev,
        total: allPayments.length,
        pages: Math.ceil(allPayments.length / pagination.limit) || 1
      }));
    } catch (error) {
      console.error('Error fetching payments:', error);
      showToast.error(
        t('mediation.trader.loadPaymentsFailed') || 'Failed to load payments',
        error.response?.data?.message || 'Please try again'
      );
      setPayments([]);
      setPagination(prev => ({
        ...prev,
        total: 0,
        pages: 0
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayment = async (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const handleDownloadInvoice = async (payment) => {
    if (!payment.deal?.id) {
      showToast.error(t('mediation.payments.noDealId') || 'Deal ID not found');
      return;
    }

    try {
      setDownloadingInvoice(true);
      // First, get invoices for the deal
      const invoicesResponse = await invoiceApi.getInvoicesByDeal(payment.deal.id);
      const invoices = invoicesResponse.data?.data || invoicesResponse.data || [];
      
      if (invoices.length === 0) {
        showToast.error(t('mediation.payments.noInvoice') || 'No invoice found for this payment');
        return;
      }

      // Get the first invoice (or find the one matching the payment)
      const invoice = invoices[0];
      
      // Download the invoice PDF
      const response = await invoiceApi.downloadInvoicePDF(invoice.id);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${payment.deal.dealNumber || payment.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast.success(t('mediation.payments.invoiceDownloaded') || 'Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showToast.error(
        t('mediation.payments.downloadFailed') || 'Failed to download invoice',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handleExportPayments = async () => {
    try {
      setExporting(true);
      
      // Get all payments (without pagination)
      const dealsResponse = await dealApi.getDeals({
        traderId: user.id,
        page: 1,
        limit: 10000
      });
      
      let deals = [];
      if (dealsResponse?.data?.data) {
        deals = Array.isArray(dealsResponse.data.data) ? dealsResponse.data.data : [];
      } else if (dealsResponse?.data) {
        deals = Array.isArray(dealsResponse.data) ? dealsResponse.data : [];
      }
      
      let allPayments = [];
      deals.forEach(deal => {
        if (deal.payments && Array.isArray(deal.payments) && deal.payments.length > 0) {
          deal.payments.forEach(payment => {
            allPayments.push({
              ...payment,
              dealNumber: deal.dealNumber,
              clientName: deal.client?.name || 'N/A',
              clientEmail: deal.client?.email || 'N/A'
            });
          });
        }
      });

      // Filter by status if needed
      if (statusFilter) {
        allPayments = allPayments.filter(p => p.status === statusFilter);
      }

      // Create CSV content
      const headers = [
        'Payment ID',
        'Deal Number',
        'Client Name',
        'Client Email',
        'Amount',
        'Method',
        'Status',
        'Transaction ID',
        'Created At'
      ];
      
      const rows = allPayments.map(p => [
        p.id,
        p.dealNumber || 'N/A',
        p.clientName,
        p.clientEmail,
        (Number(p.amount) || 0).toFixed(2),
        p.method || 'N/A',
        p.status || 'N/A',
        p.transactionId || 'N/A',
        p.createdAt ? new Date(p.createdAt).toLocaleString() : 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast.success(t('mediation.payments.exported') || 'Payments exported successfully');
    } catch (error) {
      console.error('Error exporting payments:', error);
      showToast.error(
        t('mediation.payments.exportFailed') || 'Failed to export payments',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setExporting(false);
    }
  };

  const handlePrintPayment = (payment) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${payment.deal?.dealNumber || payment.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; color: #666; }
            .value { margin-top: 5px; font-size: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment Receipt</h1>
            <p>Deal Number: ${payment.deal?.dealNumber || payment.id}</p>
          </div>
          <div class="section">
            <div class="label">Amount</div>
            <div class="value">$${(Number(payment.amount) || 0).toFixed(2)}</div>
          </div>
          <div class="section">
            <div class="label">Payment Method</div>
            <div class="value">${payment.method || 'N/A'}</div>
          </div>
          <div class="section">
            <div class="label">Status</div>
            <div class="value">${payment.status || 'N/A'}</div>
          </div>
          <div class="section">
            <div class="label">Transaction ID</div>
            <div class="value">${payment.transactionId || 'N/A'}</div>
          </div>
          <div class="section">
            <div class="label">Client</div>
            <div class="value">${payment.deal?.client?.name || payment.client?.name || 'N/A'}</div>
          </div>
          <div class="section">
            <div class="label">Date</div>
            <div class="value">${formatDate(payment.createdAt)}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
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

  const columns = [
    {
      key: 'dealNumber',
      label: t('mediation.deals.dealNumber') || 'Deal Number',
      render: (value, row) => (
        <span className="font-mono text-sm font-medium">
          {row.deal?.dealNumber || row.dealNumber || value || 'N/A'}
        </span>
      )
    },
    {
      key: 'client',
      label: t('mediation.deals.client') || 'Client',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{row.deal?.client?.name || row.client?.name || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'amount',
      label: t('mediation.payments.amount') || 'Amount',
      render: (value) => (
        <span className="font-semibold text-gray-900">
          ${(Number(value) || 0).toFixed(2)}
        </span>
      )
    },
    {
      key: 'method',
      label: t('mediation.payments.method') || 'Method',
      render: (value) => (
        <span className="text-sm text-gray-600 capitalize">{value || 'N/A'}</span>
      )
    },
    {
      key: 'status',
      label: t('mediation.common.status') || 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'createdAt',
      label: t('mediation.common.createdAt') || 'Created',
      render: (value) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(value)}</span>
        </div>
      )
    }
  ];

  const rowActions = (row) => (
    <div className="flex items-center gap-1 justify-end">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleViewPayment(row);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('mediation.payments.viewDetails') || 'View Details'}
      >
        <Eye className="w-4 h-4 text-gray-600" />
      </button>
      {row.deal?.id && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownloadInvoice(row);
          }}
          disabled={downloadingInvoice}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
          title={t('mediation.payments.downloadInvoice') || 'Download Invoice'}
        >
          {downloadingInvoice ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
          ) : (
            <Download className="w-4 h-4 text-gray-600" />
          )}
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePrintPayment(row);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('mediation.payments.print') || 'Print'}
      >
        <Printer className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('mediation.trader.payments') || 'Payments'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('mediation.trader.paymentsDesc') || 'View and track payments from your deals'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportPayments}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            {t('mediation.payments.export') || 'Export'}
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('mediation.trader.searchPayments') || 'Search payments by deal number or client...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white appearance-none min-w-[180px]"
              >
                <option value="">{t('mediation.payments.allStatus') || 'All Status'}</option>
                <option value="PENDING">{t('mediation.payments.pending') || 'Pending'}</option>
                <option value="PROCESSING">{t('mediation.payments.processing') || 'Processing'}</option>
                <option value="COMPLETED">{t('mediation.payments.completed') || 'Completed'}</option>
                <option value="VERIFIED">{t('mediation.payments.verified') || 'Verified'}</option>
                <option value="FAILED">{t('mediation.payments.failed') || 'Failed'}</option>
              </select>
            </div>
            {statusFilter && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                {t('mediation.trader.clearFilter') || 'Clear Filter'}
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {t('mediation.payments.paymentsList') || 'Payments'} ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <StandardDataTable
            columns={columns}
            data={payments}
            loading={loading}
            emptyMessage={t('mediation.trader.noPayments') || 'No payments found'}
            searchable={false}
            rowActions={rowActions}
            compact={false}
            pagination={{
              page: pagination.page,
              pages: pagination.pages,
              total: pagination.total,
              limit: pagination.limit
            }}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          />
        </CardContent>
      </Card>

      {/* Payment Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {t('mediation.payments.paymentDetails') || 'Payment Details'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedPayment.deal?.dealNumber || selectedPayment.dealNumber || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Payment Info */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      {t('mediation.payments.paymentInfo') || 'Payment Information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{t('mediation.payments.amount') || 'Amount'}</p>
                        <p className="font-semibold text-lg text-gray-900">
                          ${(Number(selectedPayment.amount) || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{t('mediation.payments.method') || 'Payment Method'}</p>
                        <p className="font-medium text-gray-900 capitalize">{selectedPayment.method || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{t('mediation.common.status') || 'Status'}</p>
                        <div>{getStatusBadge(selectedPayment.status)}</div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{t('mediation.common.createdAt') || 'Created At'}</p>
                        <p className="text-sm text-gray-900">{formatDate(selectedPayment.createdAt)}</p>
                      </div>
                      {selectedPayment.transactionId && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">{t('mediation.payments.transactionId') || 'Transaction ID'}</p>
                          <p className="font-mono text-sm text-gray-900">{selectedPayment.transactionId}</p>
                        </div>
                      )}
                      {selectedPayment.receiptUrl && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">{t('mediation.payments.receipt') || 'Receipt'}</p>
                          <a
                            href={selectedPayment.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {t('mediation.payments.viewReceipt') || 'View Receipt'}
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Deal Info */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {t('mediation.deals.dealInfo') || 'Deal Information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.dealNumber') || 'Deal Number'}</p>
                        <p className="font-medium text-gray-900">
                          {selectedPayment.deal?.dealNumber || selectedPayment.dealNumber || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.client') || 'Client'}</p>
                        <p className="font-medium text-gray-900">
                          {selectedPayment.deal?.client?.name || selectedPayment.client?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.negotiatedAmount') || 'Negotiated Amount'}</p>
                        <p className="font-medium text-gray-900">
                          ${(Number(selectedPayment.deal?.negotiatedAmount) || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">{t('mediation.deals.status') || 'Deal Status'}</p>
                        <p className="font-medium text-gray-900 capitalize">
                          {selectedPayment.deal?.status || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-2">
                {selectedPayment.deal?.id && (
                  <button
                    onClick={() => handleDownloadInvoice(selectedPayment)}
                    disabled={downloadingInvoice}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {downloadingInvoice ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {t('mediation.payments.downloadInvoice') || 'Download Invoice'}
                  </button>
                )}
                <button
                  onClick={() => handlePrintPayment(selectedPayment)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  {t('mediation.payments.print') || 'Print'}
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('common.close') || 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TraderPayments;







