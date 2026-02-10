import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import StandardDataTable from '@/components/StandardDataTable';
import { motion } from 'framer-motion';
import { Eye, Gift, Store, Package, ShoppingCart } from 'lucide-react';
import showToast from '@/lib/toast';

const AdminOffers = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const searchTimeoutRef = useRef(null);
  const isFetchingRef = useRef(false);

  const fetchOffers = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await adminApi.getOffers(params);
      const data = response.data?.data || response.data || [];
      setOffers(Array.isArray(data) ? data : []);
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      // Don't show error for rate limiting
      if (error.response?.status !== 429) {
        showToast.error('Failed to fetch offers', error.response?.data?.message || 'Please try again');
      }
      setOffers([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [pagination.page, pagination.limit, statusFilter, searchTerm]);

  // Debounce search term and status filter to avoid too many requests
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Reset to page 1 when search/filter changes
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }));
      return;
    }

    // Set new timeout - only fetch after 500ms of no typing
    searchTimeoutRef.current = setTimeout(() => {
      fetchOffers();
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, statusFilter]); // Only depend on search/filter changes

  // Fetch when page changes (but not if search/filter is changing)
  useEffect(() => {
    if (pagination.page > 0) {
      fetchOffers();
    }
  }, [pagination.page]); // Only depend on page changes

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Active' },
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
      PENDING: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Pending' },
      VALIDATED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Validated' },
      REJECTED: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Rejected' },
      EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Expired' }
    };
    const config = statusConfig[status] || statusConfig.DRAFT;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const columns = [
    {
      key: 'id',
      label: t('mediation.common.id'),
      align: 'right',
      minWidth: '80px'
    },
    {
      key: 'title',
      label: t('mediation.offers.offerTitle'),
      render: (value) => (
        <div className="flex items-center gap-2">
          <Gift className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-medium text-sm">{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'trader',
      label: t('mediation.offers.trader'),
      render: (value, row) => (
        <div className="flex items-center gap-1.5">
          <Store className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{row.trader?.companyName || row.trader?.name || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: t('mediation.offers.status'),
      render: (value, row) => getStatusBadge(row.status)
    },
    {
      key: 'items',
      label: t('mediation.offers.items'),
      align: 'right',
      render: (value, row) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Package className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{row._count?.items || 0}</span>
        </div>
      )
    },
    {
      key: 'deals',
      label: t('mediation.offers.deals'),
      align: 'right',
      render: (value, row) => (
        <div className="flex items-center gap-1.5 justify-end">
          <ShoppingCart className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{row._count?.deals || 0}</span>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: t('mediation.offers.createdAt'),
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? new Date(value).toLocaleDateString() : 'N/A'}
        </span>
      )
    }
  ];

  const rowActions = (row) => {
    const handleView = (e) => {
      e.stopPropagation();
      navigate(`/stockship/admin/offers/${row.id}/view`);
    };

    return (
      <div className="flex items-center gap-1 justify-end">
        <button
          onClick={handleView}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title={t('mediation.offers.viewDetails')}
        >
          <Eye className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('mediation.offers.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('mediation.offers.subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder={t('mediation.offers.search')}
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
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="VALIDATED">Validated</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
            >
              {t('mediation.offers.clearFilters')}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Offers Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {t('mediation.offers.list')} ({pagination.total || offers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <StandardDataTable
            columns={columns}
            data={offers}
            loading={loading && offers.length === 0}
            emptyMessage={t('mediation.offers.noOffers')}
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

export default AdminOffers;
