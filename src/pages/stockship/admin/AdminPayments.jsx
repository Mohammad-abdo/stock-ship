import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { Search, Eye, CreditCard, Filter, Download } from 'lucide-react';

const AdminPayments = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchPayments();
  }, [pagination.page, statusFilter, methodFilter, searchTerm]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
        ...(methodFilter && { method: methodFilter }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await adminApi.getPayments(params);
      const data = response.data.data || response.data;
      setPayments(Array.isArray(data) ? data : []);
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayment = (id) => {
    navigate(`/stockship/admin/payments/${id}/view`);
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {t(`mediation.payments.status.${status?.toLowerCase()}`) || status?.replace(/_/g, ' ') || 'Unknown'}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.payments.loading') || 'Loading payments...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('mediation.payments.title') || 'Payments Management'}</h1>
          <p className="text-muted-foreground mt-2">{t('mediation.payments.subtitle') || 'Manage all platform payments'}</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('mediation.payments.searchPlaceholder') || 'Search payments...'}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('mediation.payments.allStatus') || 'All Status'}</option>
              <option value="PENDING">{t('mediation.payments.pending') || 'Pending'}</option>
              <option value="PROCESSING">{t('mediation.payments.processing') || 'Processing'}</option>
              <option value="COMPLETED">{t('mediation.payments.completed') || 'Completed'}</option>
              <option value="FAILED">{t('mediation.payments.failed') || 'Failed'}</option>
              <option value="REFUNDED">{t('mediation.payments.refunded') || 'Refunded'}</option>
              <option value="CANCELLED">{t('mediation.payments.cancelled') || 'Cancelled'}</option>
            </select>
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('mediation.payments.allMethods') || 'All Methods'}</option>
              <option value="BANK_CARD">{t('mediation.payments.methods.bankCard') || 'Bank Card'}</option>
              <option value="BANK_TRANSFER">{t('mediation.payments.methods.bankTransfer') || 'Bank Transfer'}</option>
              <option value="WALLET">{t('mediation.payments.methods.wallet') || 'Wallet'}</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setMethodFilter('');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              {t('mediation.payments.clearFilters') || 'Clear Filters'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('mediation.payments.paymentsList') || 'Payments List'} ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('mediation.payments.noPayments') || 'No payments found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">{t('mediation.common.id') || 'ID'}</th>
                    <th className="text-left p-4">{t('mediation.payments.order') || 'Order'}</th>
                    <th className="text-left p-4">{t('mediation.payments.customer') || 'Customer'}</th>
                    <th className="text-left p-4">{t('mediation.payments.vendor') || 'Vendor'}</th>
                    <th className="text-left p-4">{t('mediation.payments.amount') || 'Amount'}</th>
                    <th className="text-left p-4">{t('mediation.payments.method') || 'Method'}</th>
                    <th className="text-left p-4">{t('mediation.common.status') || 'Status'}</th>
                    <th className="text-left p-4">{t('mediation.payments.date') || 'Date'}</th>
                    <th className="text-left p-4">{t('mediation.common.actions') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-semibold">#{payment.id}</div>
                        {payment.transactionId && (
                          <div className="text-sm text-gray-500">{payment.transactionId}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{payment.order?.orderNumber || `${t('mediation.payments.orderNumber') || 'Order #'}${payment.orderId}`}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{payment.order?.user?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{payment.order?.user?.email || ''}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{payment.order?.vendor?.companyName || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold">{payment.amount ? `${payment.amount} SAR` : 'N/A'}</div>
                        {payment.siteCommission && (
                          <div className="text-sm text-gray-500">{t('mediation.payments.commission') || 'Commission'}: {payment.siteCommission} SAR</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span>{t(`mediation.payments.methods.${payment.method?.toLowerCase().replace(/_/g, '')}`) || payment.method?.replace(/_/g, ' ') || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{formatDate(payment.createdAt)}</div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleViewPayment(payment.id)}
                          className="p-2 hover:bg-gray-100 rounded"
                          title={t('mediation.payments.viewDetails') || 'View Details'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                {t('mediation.common.page') || 'Page'} {pagination.page} {t('mediation.common.of') || 'of'} {pagination.pages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t('mediation.common.previous') || 'Previous'}
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t('mediation.common.next') || 'Next'}
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default AdminPayments;
