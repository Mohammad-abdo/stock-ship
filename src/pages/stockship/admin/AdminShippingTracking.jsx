import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import StandardDataTable from '@/components/StandardDataTable';
import { motion } from 'framer-motion';
import { 
  Truck, MapPin, Clock, CheckCircle2, AlertCircle, Package, 
  User, Store, DollarSign, Calendar, Eye, Filter, X 
} from 'lucide-react';
import showToast from '@/lib/toast';

const AdminShippingTracking = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const [trackings, setTrackings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shippingCompanies, setShippingCompanies] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    shippingCompanyId: '',
    status: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchShippingCompanies();
    fetchStats();
    // Check if there's a shippingCompanyId in location state
    const state = window.history.state;
    if (state?.shippingCompanyId) {
      setFilters(prev => ({ ...prev, shippingCompanyId: state.shippingCompanyId }));
    }
  }, []);

  useEffect(() => {
    fetchTrackings();
  }, [pagination.page, filters]);

  const fetchShippingCompanies = async () => {
    try {
      const response = await adminApi.getActiveShippingCompanies();
      const data = response.data.data || response.data || [];
      setShippingCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching shipping companies:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminApi.getShippingTrackingStats();
      const data = response.data.data || response.data;
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchTrackings = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.shippingCompanyId && { shippingCompanyId: filters.shippingCompanyId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      };
      const response = await adminApi.getAllShippingTracking(params);
      const data = response.data?.data || response.data || [];
      setTrackings(Array.isArray(data) ? data : []);
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching shipping tracking:', error);
      showToast.error(t('shippingTracking.loadFailed') || 'Failed to load tracking', error.response?.data?.message || t('shippingTracking.loadFailedDesc') || 'Please try again');
      setTrackings([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: <Clock className="w-4 h-4 text-gray-500" />,
      PREPARING: <Package className="w-4 h-4 text-blue-500" />,
      PICKED_UP: <Package className="w-4 h-4 text-purple-500" />,
      IN_TRANSIT: <Truck className="w-4 h-4 text-blue-500" />,
      OUT_FOR_DELIVERY: <Truck className="w-4 h-4 text-orange-500" />,
      DELIVERED: <CheckCircle2 className="w-4 h-4 text-green-500" />,
      RETURNED: <AlertCircle className="w-4 h-4 text-red-500" />,
      CANCELLED: <X className="w-4 h-4 text-red-500" />
    };
    return icons[status] || <Clock className="w-4 h-4 text-gray-500" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-gray-100 text-gray-800',
      PREPARING: 'bg-blue-100 text-blue-800',
      PICKED_UP: 'bg-purple-100 text-purple-800',
      IN_TRANSIT: 'bg-blue-100 text-blue-800',
      OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
      DELIVERED: 'bg-green-100 text-green-800',
      RETURNED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0.00';
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const columns = [
    {
      key: 'deal',
      label: t('shippingTracking.deal') || 'Deal',
      render: (value, row) => (
        <button
          onClick={() => navigate(`/stockship/admin/shipping-tracking/${row.dealId}/view`)}
          className="flex items-center gap-2 hover:text-primary transition-colors text-left"
        >
          <Package className="w-4 h-4 text-gray-400" />
          <div>
            <p className="font-medium text-sm">{row.deal?.dealNumber || 'N/A'}</p>
            <p className="text-xs text-gray-500">
              {row.deal?.trader?.companyName || row.deal?.trader?.name || 'N/A'}
            </p>
          </div>
        </button>
      )
    },
    {
      key: 'shippingCompany',
      label: t('shippingTracking.shippingCompany') || 'Shipping Company',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {row.shippingCompany?.avatar && (
            <img 
              src={row.shippingCompany.avatar} 
              alt={row.shippingCompany.nameEn || row.shippingCompany.nameAr} 
              className="w-6 h-6 rounded-full object-cover"
            />
          )}
          <div>
            <p className="text-sm font-medium">{row.shippingCompany?.nameEn || row.shippingCompany?.nameAr || 'N/A'}</p>
            {row.shippingCompany?.nameAr && row.shippingCompany?.nameEn && (
              <p className="text-xs text-gray-500" dir="rtl">{row.shippingCompany.nameAr}</p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'trackingNumber',
      label: t('shippingTracking.trackingNumber') || 'Tracking Number',
      render: (value) => (
        <span className="font-mono text-sm">{value || 'N/A'}</span>
      )
    },
    {
      key: 'status',
      label: t('shippingTracking.status') || 'Status',
      render: (value) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(value)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
            {value.replace('_', ' ')}
          </span>
        </div>
      )
    },
    {
      key: 'currentLocation',
      label: t('shippingTracking.currentLocation') || 'Current Location',
      render: (value) => (
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span className="text-sm text-gray-600 max-w-xs truncate">{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'deal',
      label: t('shippingTracking.client') || 'Client',
      render: (value, row) => (
        <div className="flex items-center gap-1">
          <User className="w-3 h-3 text-gray-400" />
          <span className="text-sm">{row.deal?.client?.name || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'deal',
      label: t('shippingTracking.amount') || 'Amount',
      render: (value, row) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-gray-400" />
          <span className="text-sm font-medium">
            {row.deal?.negotiatedAmount ? formatCurrency(row.deal.negotiatedAmount) : 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'estimatedDelivery',
      label: t('shippingTracking.estimatedDelivery') || 'Est. Delivery',
      render: (value) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-600">{value ? formatDate(value) : 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: t('shippingTracking.created') || 'Created',
      render: (value) => (
        <span className="text-xs text-gray-600">{formatDate(value)}</span>
      )
    }
  ];

  const rowActions = (row) => (
    <div className="flex items-center gap-1 justify-end">
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/stockship/admin/shipping-tracking/${row.dealId}/view`);
        }}
        className="p-1.5 hover:bg-blue-100 rounded transition-colors"
        title={t('shippingTracking.viewTrackingDetails') || 'View Tracking Details'}
      >
        <Truck className="w-4 h-4 text-blue-600" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/stockship/admin/deals/${row.dealId}/view`);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('shippingTracking.viewDeal') || 'View Deal'}
      >
        <Eye className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('shippingTracking.title') || 'Shipping Tracking'}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('shippingTracking.subtitle') || 'Track all shipments and their status'}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t('shippingTracking.totalShipments') || 'Total Shipments'}</p>
                  <p className="text-2xl font-semibold mt-1">{stats.total || 0}</p>
                </div>
                <Truck className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          {stats.byStatus?.map((stat) => (
            <Card key={stat.status} className="border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      {t(`shippingTracking.${stat.status.toLowerCase()}`) || stat.status.replace('_', ' ')}
                    </p>
                    <p className="text-2xl font-semibold mt-1">{stat._count.status || 0}</p>
                  </div>
                  {getStatusIcon(stat.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('shippingTracking.shippingCompany') || 'Shipping Company'}</label>
              <select
                value={filters.shippingCompanyId}
                onChange={(e) => {
                  setFilters({ ...filters, shippingCompanyId: e.target.value });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">{t('shippingTracking.allCompanies') || 'All Companies'}</option>
                {shippingCompanies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.nameEn || company.nameAr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('shippingTracking.status') || 'Status'}</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">{t('shippingTracking.allStatuses') || 'All Statuses'}</option>
                <option value="PENDING">{t('shippingTracking.pending') || 'Pending'}</option>
                <option value="PREPARING">{t('shippingTracking.preparing') || 'Preparing'}</option>
                <option value="PICKED_UP">{t('shippingTracking.pickedUp') || 'Picked Up'}</option>
                <option value="IN_TRANSIT">{t('shippingTracking.inTransit') || 'In Transit'}</option>
                <option value="OUT_FOR_DELIVERY">{t('shippingTracking.outForDelivery') || 'Out for Delivery'}</option>
                <option value="DELIVERED">{t('shippingTracking.delivered') || 'Delivered'}</option>
                <option value="RETURNED">{t('shippingTracking.returned') || 'Returned'}</option>
                <option value="CANCELLED">{t('shippingTracking.cancelled') || 'Cancelled'}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('shippingTracking.search') || 'Search'}</label>
              <input
                type="text"
                placeholder={t('shippingTracking.searchPlaceholder') || 'Tracking number, deal number...'}
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({ shippingCompanyId: '', status: '', search: '' });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                {t('shippingCompanies.clearFilters') || t('common.filter') || 'Clear Filters'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Shipping Tracking ({pagination.total || trackings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <StandardDataTable
            columns={columns}
            data={trackings}
            loading={loading && trackings.length === 0}
            emptyMessage={t('shippingTracking.noRecords') || 'No shipping tracking records found'}
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

export default AdminShippingTracking;

