import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import StandardDataTable from '@/components/StandardDataTable';
import { motion } from 'framer-motion';
import { Eye, ShoppingCart, Store, User, CheckCircle, Box, Package, DollarSign } from 'lucide-react';
import showToast from '@/lib/toast';

const AdminDeals = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchDeals();
  }, [pagination.page, statusFilter, searchTerm]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await adminApi.getDeals(params);
      const data = response.data?.data || response.data || [];
      setDeals(Array.isArray(data) ? data : []);
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
      showToast.error('Failed to fetch deals', error.response?.data?.message || 'Please try again');
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (id) => {
    if (!window.confirm(t('mediation.deals.settleDeal') + '?')) return;
    try {
      await adminApi.settleDeal(id);
      showToast.success('Deal settled', 'The deal has been settled successfully');
      fetchDeals();
    } catch (error) {
      console.error('Error settling deal:', error);
      showToast.error('Failed to settle deal', error.response?.data?.message || 'Please try again');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      NEGOTIATION: { bg: 'bg-gray-100', text: 'text-gray-600', label: t('mediation.deals.negotiation') },
      APPROVED: { bg: 'bg-gray-100', text: 'text-gray-700', label: t('mediation.deals.approved') },
      PAID: { bg: 'bg-gray-100', text: 'text-gray-700', label: t('mediation.deals.paid') },
      SETTLED: { bg: 'bg-gray-100', text: 'text-gray-700', label: t('mediation.deals.settled') },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-600', label: t('mediation.deals.cancelled') }
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-600', label: status || 'Unknown' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const filteredDeals = deals.filter((deal) =>
    (deal.dealNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (deal.trader?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (deal.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'dealNumber',
      label: t('mediation.deals.dealNumber'),
      render: (value) => (
        <span className="font-mono text-xs text-gray-900">{value || 'N/A'}</span>
      )
    },
    {
      key: 'trader',
      label: t('mediation.deals.trader'),
      render: (value, row) => (
        <div className="flex items-center gap-1.5">
          <Store className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{row.trader?.companyName || row.trader?.name || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'client',
      label: t('mediation.deals.client'),
      render: (value, row) => (
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{row.client?.name || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'negotiatedAmount',
      label: t('mediation.deals.amount'),
      align: 'right',
      render: (value) => (
        <div className="flex items-center gap-1.5 justify-end">
          <DollarSign className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-medium">{value ? `${value.toLocaleString()} SAR` : 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'totalCBM',
      label: t('mediation.deals.cbm'),
      align: 'right',
      render: (value) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Box className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{value || 0}</span>
        </div>
      )
    },
    {
      key: 'totalCartons',
      label: t('mediation.deals.cartons'),
      align: 'right',
      render: (value) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Package className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{value || 0}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: t('mediation.common.status'),
      render: (value, row) => getStatusBadge(row.status)
    },
    {
      key: 'createdAt',
      label: t('mediation.deals.created'),
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? new Date(value).toLocaleDateString() : 'N/A'}
        </span>
      )
    }
  ];

  const rowActions = (row) => (
    <div className="flex items-center gap-1 justify-end">
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/stockship/admin/deals/${row.id}/view`);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('mediation.deals.viewDetails')}
      >
        <Eye className="w-4 h-4 text-gray-600" />
      </button>
      {row.status === 'PAID' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSettle(row.id);
          }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title={t('mediation.deals.settleDeal')}
        >
          <CheckCircle className="w-4 h-4 text-gray-600" />
        </button>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('mediation.deals.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('mediation.deals.subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder={t('mediation.deals.search')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
            >
              <option value="">{t('mediation.deals.allStatus')}</option>
              <option value="NEGOTIATION">{t('mediation.deals.negotiation')}</option>
              <option value="APPROVED">{t('mediation.deals.approved')}</option>
              <option value="PAID">{t('mediation.deals.paid')}</option>
              <option value="SETTLED">{t('mediation.deals.settled')}</option>
              <option value="CANCELLED">{t('mediation.deals.cancelled')}</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
            >
              {t('mediation.deals.clearFilters')}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Deals Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {t('mediation.deals.list')} ({pagination.total || filteredDeals.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <StandardDataTable
            columns={columns}
            data={filteredDeals}
            loading={loading && deals.length === 0}
            emptyMessage={t('mediation.deals.noDeals')}
            searchable={false}
            pagination={pagination.pages > 1 ? pagination : null}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            rowActions={rowActions}
            compact={false}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminDeals;
