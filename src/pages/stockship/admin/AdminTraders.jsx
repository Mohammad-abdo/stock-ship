import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import StandardDataTable from '@/components/StandardDataTable';
import { motion } from 'framer-motion';
import { Eye, Edit, Trash2, CheckCircle, XCircle, Ban, Check, Store, Mail, Phone, MapPin, Package, ShoppingCart, Briefcase, QrCode } from 'lucide-react';
import showToast from '@/lib/toast';

const AdminTraders = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [traders, setTraders] = useState([]);
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
    fetchTraders();
  }, [pagination.page, statusFilter]);

  const fetchTraders = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await adminApi.getTraders(params);
      const data = response.data?.data || response.data || [];
      setTraders(Array.isArray(data) ? data : []);
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching traders:', error);
      showToast.error('Failed to fetch traders', error.response?.data?.message || 'Please try again');
      setTraders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    try {
      await adminApi.updateTrader(id, { isVerified: true });
      showToast.success('Trader verified', 'The trader has been verified successfully');
      fetchTraders();
    } catch (error) {
      console.error('Error verifying trader:', error);
      showToast.error('Failed to verify trader', error.response?.data?.message || 'Please try again');
    }
  };

  const handleActivate = async (id) => {
    try {
      await adminApi.updateTrader(id, { isActive: true });
      showToast.success('Trader activated', 'The trader has been activated');
      fetchTraders();
    } catch (error) {
      console.error('Error activating trader:', error);
      showToast.error('Failed to activate trader', error.response?.data?.message || 'Please try again');
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await adminApi.updateTrader(id, { isActive: false });
      showToast.success('Trader deactivated', 'The trader has been deactivated');
      fetchTraders();
    } catch (error) {
      console.error('Error deactivating trader:', error);
      showToast.error('Failed to deactivate trader', error.response?.data?.message || 'Please try again');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('mediation.traders.deleteConfirm'))) return;
    try {
      await adminApi.deleteTrader(id);
      showToast.success('Trader deleted', 'The trader has been deleted successfully');
      fetchTraders();
    } catch (error) {
      console.error('Error deleting trader:', error);
      showToast.error('Failed to delete trader', error.response?.data?.message || 'Please try again');
    }
  };

  const getStatusBadge = (trader) => {
    if (!trader.isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
          <XCircle className="w-3 h-3" />
          {t('mediation.traders.inactive')}
        </span>
      );
    }
    if (trader.isVerified) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
          <CheckCircle className="w-3 h-3" />
          {t('mediation.traders.verified')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
        {t('mediation.traders.unverified')}
      </span>
    );
  };

  const filteredTraders = traders.filter((trader) =>
    (trader.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (trader.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (trader.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (trader.traderCode || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'id',
      label: t('mediation.common.id'),
      align: 'right',
      minWidth: '80px'
    },
    {
      key: 'traderCode',
      label: t('mediation.traders.traderCode'),
      render: (value) => (
        <div className="flex items-center gap-2">
          <QrCode className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-mono text-xs">{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'companyName',
      label: t('mediation.traders.companyName'),
      render: (value) => (
        <div className="flex items-center gap-2">
          <Store className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-medium text-sm">{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'name',
      label: t('mediation.traders.contactPerson')
    },
    {
      key: 'email',
      label: t('mediation.traders.email'),
      render: (value) => (
        <div className="flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'phone',
      label: t('mediation.traders.phone'),
      render: (value) => (
        <div className="flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'location',
      label: t('mediation.traders.location'),
      render: (value, row) => (
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">
            {row.city && row.country ? `${row.city}, ${row.country}` : row.city || row.country || 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'employee',
      label: t('mediation.traders.employee'),
      render: (value, row) => (
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{row.employee?.name || row.employee?.employeeCode || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'offers',
      label: t('mediation.traders.offers'),
      align: 'right',
      render: (value, row) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Package className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{row._count?.offers || 0}</span>
        </div>
      )
    },
    {
      key: 'deals',
      label: t('mediation.traders.deals'),
      align: 'right',
      render: (value, row) => (
        <div className="flex items-center gap-1.5 justify-end">
          <ShoppingCart className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{row._count?.deals || 0}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: t('mediation.common.status'),
      render: (value, row) => getStatusBadge(row)
    }
  ];

  const rowActions = (row) => (
    <div className="flex items-center gap-1 justify-end">
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/stockship/admin/traders/${row.id}/view`);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('mediation.traders.viewDetails')}
      >
        <Eye className="w-4 h-4 text-gray-600" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/stockship/admin/traders/${row.id}/edit`);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('mediation.traders.edit')}
      >
        <Edit className="w-4 h-4 text-gray-600" />
      </button>
      {!row.isVerified && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleVerify(row.id);
          }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title={t('mediation.traders.verify')}
        >
          <CheckCircle className="w-4 h-4 text-gray-600" />
        </button>
      )}
      {!row.isActive ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleActivate(row.id);
          }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title={t('mediation.traders.activate')}
        >
          <Check className="w-4 h-4 text-gray-600" />
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeactivate(row.id);
          }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title={t('mediation.traders.deactivate')}
        >
          <Ban className="w-4 h-4 text-gray-600" />
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(row.id);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('mediation.traders.delete')}
      >
        <Trash2 className="w-4 h-4 text-gray-600" />
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('mediation.traders.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('mediation.traders.subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder={t('mediation.traders.search')}
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
              <option value="">{t('mediation.traders.allStatus')}</option>
              <option value="active">{t('mediation.traders.active')}</option>
              <option value="inactive">{t('mediation.traders.inactive')}</option>
              <option value="verified">{t('mediation.traders.verified')}</option>
              <option value="unverified">{t('mediation.traders.unverified')}</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
            >
              {t('mediation.traders.clearFilters')}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Traders Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {t('mediation.traders.list')} ({pagination.total || filteredTraders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <StandardDataTable
            columns={columns}
            data={filteredTraders}
            loading={loading && traders.length === 0}
            emptyMessage={t('mediation.traders.noTraders')}
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

export default AdminTraders;
