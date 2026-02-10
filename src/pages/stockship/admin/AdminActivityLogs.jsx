import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import StandardDataTable from '@/components/StandardDataTable';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  User,
  FileText,
  Activity,
  Globe,
  Clock,
} from 'lucide-react';
import showToast from '@/lib/toast';

const AdminActivityLogs = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    userType: '',
    action: '',
    entityType: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.userType && { userType: filters.userType }),
        ...(filters.action && { action: filters.action }),
        ...(filters.entityType && { entityType: filters.entityType }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      };
      const response = await adminApi.getActivityLogs(params);
      const data = response.data?.data || response.data || [];
      setLogs(Array.isArray(data) ? data : []);
      if (response.data?.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      showToast.error(
        t('admin.activityLogs.loadFailed') || 'Failed to load activity logs',
        error.response?.data?.message || 'Please try again'
      );
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, filters, t]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleViewDetails = (id) => {
    navigate(`/stockship/admin/activity-logs/${id}/view`);
  };

  const handleExport = async (format = 'json') => {
    try {
      showToast.info(
        t('admin.activityLogs.exporting') || 'Exporting...',
        t('admin.activityLogs.pleaseWait') || 'Please wait'
      );
      
      const params = {
        ...(filters.userType && { userType: filters.userType }),
        ...(filters.action && { action: filters.action }),
        ...(filters.entityType && { entityType: filters.entityType }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        format
      };
      
      const response = await adminApi.getActivityLogs(params);
      const data = response.data?.data || response.data || [];
      
      if (format === 'csv') {
        const csvHeaders = [
          'ID',
          'User ID',
          'User Type',
          'User Name',
          'User Email',
          'Action',
          'Entity Type',
          'Entity ID',
          'Description',
          'IP Address',
          'Location',
          'Created At'
        ];
        
        const csvRows = data.map(log => {
          const user = log.admin || log.employee || log.trader || log.client || {};
          return [
            log.id,
            log.userId || '',
            log.userType || '',
            user.name || '',
            user.email || '',
            log.action || '',
            log.entityType || '',
            log.entityId || '',
            (log.description || '').replace(/,/g, ';'),
            log.ipAddress || '',
            log.location || '',
            new Date(log.createdAt).toLocaleString()
          ].map(field => `"${field}"`).join(',');
        });
        
        const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      showToast.success(
        t('admin.activityLogs.exportSuccess') || 'Export successful',
        t('admin.activityLogs.downloadStarted') || 'Download started'
      );
    } catch (error) {
      console.error('Error exporting logs:', error);
      showToast.error(
        t('admin.activityLogs.exportFailed') || 'Export failed',
        error.response?.data?.message || 'Please try again'
      );
    }
  };

  const getUserName = (log) => {
    const user = log.admin || log.employee || log.trader || log.client || {};
    return user.name || user.email || t('common.unknown') || 'Unknown';
  };

  const getUserEmail = (log) => {
    const user = log.admin || log.employee || log.trader || log.client || {};
    return user.email || '';
  };

  const formatDate = (date) => {
    if (!date) return t('common.notAvailable') || 'N/A';
    return new Date(date).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionBadge = (action) => {
    const actionColors = {
      'CREATE': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'DELETE': 'bg-red-100 text-red-800',
      'VIEW': 'bg-gray-100 text-gray-800',
      'LOGIN': 'bg-purple-100 text-purple-800',
      'LOGOUT': 'bg-orange-100 text-orange-800',
      'APPROVE': 'bg-emerald-100 text-emerald-800',
      'REJECT': 'bg-red-100 text-red-800',
      'VALIDATE': 'bg-indigo-100 text-indigo-800'
    };
    
    const color = Object.keys(actionColors).find(key => 
      action?.toUpperCase().includes(key)
    );
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        color ? actionColors[color] : 'bg-gray-100 text-gray-800'
      }`}>
        {action || t('common.unknown')}
      </span>
    );
  };

  const getUserTypeBadge = (userType) => {
    const typeColors = {
      'ADMIN': 'bg-purple-100 text-purple-800',
      'EMPLOYEE': 'bg-blue-100 text-blue-800',
      'TRADER': 'bg-green-100 text-green-800',
      'CLIENT': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        typeColors[userType] || 'bg-gray-100 text-gray-800'
      }`}>
        {userType || t('common.unknown')}
      </span>
    );
  };

  const columns = [
    {
      key: 'id',
      label: t('admin.activityLogs.id') || 'ID',
      align: 'right',
      minWidth: '80px'
    },
    {
      key: 'user',
      label: t('admin.activityLogs.user') || 'User',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-sm font-medium">{getUserName(row)}</div>
            {getUserEmail(row) && (
              <div className="text-xs text-gray-500">{getUserEmail(row)}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'userType',
      label: t('admin.activityLogs.userType') || 'User Type',
      render: (value) => getUserTypeBadge(value)
    },
    {
      key: 'action',
      label: t('admin.activityLogs.action') || 'Action',
      render: (value) => getActionBadge(value)
    },
    {
      key: 'entityType',
      label: t('admin.activityLogs.entityType') || 'Entity Type',
      render: (value) => (
        <span className="text-sm">{value || t('common.notAvailable')}</span>
      )
    },
    {
      key: 'description',
      label: t('admin.activityLogs.description') || 'Description',
      render: (value) => (
        <span className="text-sm text-gray-600 line-clamp-2">
          {value || t('common.notAvailable')}
        </span>
      )
    },
    {
      key: 'ipAddress',
      label: t('admin.activityLogs.ipAddress') || 'IP Address',
      render: (value) => (
        <div className="flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-mono">{value || t('common.notAvailable')}</span>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: t('admin.activityLogs.createdAt') || 'Created At',
      render: (value) => (
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-600">{formatDate(value)}</span>
        </div>
      )
    }
  ];

  const rowActions = (row) => (
    <div className="flex items-center gap-1 justify-end">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleViewDetails(row.id);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('admin.activityLogs.viewDetails') || 'View Details'}
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('admin.activityLogs.title') || 'Activity Logs'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('admin.activityLogs.subtitle') || 'Monitor and track all platform activities'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('admin.activityLogs.exportCSV') || 'Export CSV'}
          </button>
          <button
            onClick={() => handleExport('json')}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('admin.activityLogs.exportJSON') || 'Export JSON'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              {t('admin.activityLogs.filters') || 'Filters'}
            </CardTitle>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {showFilters ? t('common.hide') || 'Hide' : t('common.show') || 'Show'}
            </button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('admin.activityLogs.searchPlaceholder') || 'Search...'}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
                />
              </div>
              <select
                value={filters.userType}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, userType: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
              >
                <option value="">{t('admin.activityLogs.allUserTypes') || 'All User Types'}</option>
                <option value="ADMIN">{t('common.admin') || 'Admin'}</option>
                <option value="EMPLOYEE">{t('mediation.employees.title') || 'Employee'}</option>
                <option value="TRADER">{t('mediation.traders.title') || 'Trader'}</option>
                <option value="CLIENT">{t('admin.activityLogs.client') || 'Client'}</option>
              </select>
              <select
                value={filters.action}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, action: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
              >
                <option value="">{t('admin.activityLogs.allActions') || 'All Actions'}</option>
                <option value="CREATE">{t('admin.activityLogs.create') || 'Create'}</option>
                <option value="UPDATE">{t('admin.activityLogs.update') || 'Update'}</option>
                <option value="DELETE">{t('admin.activityLogs.delete') || 'Delete'}</option>
                <option value="LOGIN">{t('admin.activityLogs.login') || 'Login'}</option>
                <option value="LOGOUT">{t('admin.activityLogs.logout') || 'Logout'}</option>
                <option value="APPROVE">{t('admin.activityLogs.approve') || 'Approve'}</option>
                <option value="REJECT">{t('admin.activityLogs.reject') || 'Reject'}</option>
              </select>
              <select
                value={filters.entityType}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, entityType: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
              >
                <option value="">{t('admin.activityLogs.allEntityTypes') || 'All Entity Types'}</option>
                <option value="DEAL">{t('mediation.deals.title') || 'Deal'}</option>
                <option value="OFFER">{t('mediation.offers.title') || 'Offer'}</option>
                <option value="PAYMENT">{t('sidebar.payments') || 'Payment'}</option>
                <option value="TRADER">{t('mediation.traders.title') || 'Trader'}</option>
                <option value="EMPLOYEE">{t('mediation.employees.title') || 'Employee'}</option>
                <option value="CLIENT">{t('admin.activityLogs.client') || 'Client'}</option>
              </select>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, startDate: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, endDate: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
                />
              </div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilters({
                    userType: '',
                    action: '',
                    entityType: '',
                    startDate: '',
                    endDate: ''
                  });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors flex items-center gap-2 justify-center"
              >
                <X className="w-4 h-4" />
                {t('admin.activityLogs.clearFilters') || 'Clear Filters'}
              </button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Activity Logs Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {t('admin.activityLogs.list') || 'Activity Logs'} ({pagination.total || logs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <StandardDataTable
            columns={columns}
            data={logs}
            loading={loading && logs.length === 0}
            emptyMessage={t('admin.activityLogs.noLogs') || 'No activity logs found'}
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

export default AdminActivityLogs;
