import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import StandardDataTable from '@/components/StandardDataTable';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Gift, 
  Store, 
  Package, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { offerApi, employeeApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';

const EmployeeOffers = () => {
  const navigate = useNavigate();
  const { getAuth } = useMultiAuth();
  const { t, language } = useLanguage();
  const { user } = getAuth('employee');
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
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (user?.id && !fetchingRef.current) {
      fetchOffers();
    }
  }, [user, pagination.page, statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined && !fetchingRef.current) {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchOffers();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchOffers = async () => {
    if (fetchingRef.current) return; // Prevent concurrent requests
    
    try {
      fetchingRef.current = true;
      setLoading(true);
      // Use employee-specific endpoint
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      };
      
      const response = await offerApi.getEmployeeOffers(params);
      const data = response.data?.data || response.data || [];
      const paginationData = response.data?.pagination;
      
      setOffers(Array.isArray(data) ? data : []);
      if (paginationData) {
        setPagination(prev => ({
          ...prev,
          total: paginationData.total || 0,
          pages: paginationData.pages || 1
        }));
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      // Only show error if not rate limited (to avoid spam)
      if (error.response?.status !== 429) {
        showToast.error(
          t('mediation.employee.loadOffersFailed') || 'Failed to load offers',
          error.response?.data?.message || 'Please try again'
        );
      }
      setOffers([]);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const handleDeleteOffer = async (id) => {
    if (!confirm(t('mediation.employee.confirmDeleteOffer') || 'Are you sure you want to delete this offer?')) {
      return;
    }

    try {
      await offerApi.deleteOfferEmployee(id);
      showToast.success(
        t('mediation.employee.offerDeleted') || 'Offer Deleted',
        t('mediation.employee.offerDeletedSuccess') || 'The offer has been deleted successfully'
      );
      fetchOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      showToast.error(
        t('mediation.employee.deleteOfferFailed') || 'Failed to delete offer',
        error.response?.data?.message || 'Please try again'
      );
    }
  };

  const handleViewOffer = (id) => {
    // Navigate to offer details page
    navigate(`/stockship/employee/offers/${id}`);
  };


  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING_VALIDATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('mediation.offers.pendingValidation') || 'Pending Validation', icon: Clock },
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: t('mediation.offers.active') || 'Active', icon: CheckCircle },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: t('mediation.offers.rejected') || 'Rejected', icon: XCircle },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.offers.inactive') || 'Inactive', icon: Package }
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status || 'Unknown', icon: Package };
    const Icon = config.icon;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const columns = [
    {
      key: 'title',
      label: t('mediation.offers.offerTitle') || 'Title',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-sm">{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'trader',
      label: t('mediation.offers.trader') || 'Trader',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{row.trader?.companyName || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: t('mediation.common.status') || 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'items',
      label: t('mediation.offers.items') || 'Items',
      align: 'right',
      render: (value, row) => (
        <span className="text-sm text-gray-600">
          {row._count?.items || row.items?.length || 0}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: t('mediation.common.createdAt') || 'Created',
      render: (value) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Clock className="w-3 h-3" />
          <span>
            {value ? new Date(value).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : 'N/A'}
          </span>
        </div>
      )
    }
  ];

  const rowActions = (row) => (
    <div className="flex items-center gap-1 justify-end">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleViewOffer(row.id);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('mediation.offers.viewDetails') || 'View & Validate'}
      >
        <Eye className="w-4 h-4 text-gray-600" />
      </button>
      {row.status === 'ACTIVE' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/stockship/employee/offers/${row.id}/support-tickets/create`);
          }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title={t('mediation.support.createTicket') || 'Create Support Ticket'}
        >
          <MessageSquare className="w-4 h-4 text-green-600" />
        </button>
      )}
      {row.status === 'DRAFT' || row.status === 'PENDING_VALIDATION' ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteOffer(row.id);
          }}
          className="p-1.5 hover:bg-red-100 rounded transition-colors"
          title={t('mediation.offers.delete') || 'Delete Offer'}
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      ) : null}
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
            {language === 'ar' ? 'إدارة الإعلانات التجارية' : 'Commercial Advertisements Management'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === 'ar' ? 'إدارة ومراجعة الإعلانات التجارية للتجار' : 'Manage and review commercial advertisements from traders'}
          </p>
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
                placeholder={t('mediation.employee.searchOffers') || 'Search offers by title or trader...'}
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
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white appearance-none min-w-[200px]"
              >
                <option value="">{t('mediation.offers.allStatus') || 'All Status'}</option>
                <option value="PENDING_VALIDATION">{t('mediation.offers.pendingValidation') || 'Pending Validation'}</option>
                <option value="ACTIVE">{t('mediation.offers.active') || 'Active'}</option>
                <option value="REJECTED">{t('mediation.offers.rejected') || 'Rejected'}</option>
                <option value="INACTIVE">{t('mediation.offers.inactive') || 'Inactive'}</option>
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
                {t('mediation.employee.clearFilter') || 'Clear Filter'}
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Offers Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {t('mediation.offers.offersList') || 'Offers'} ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <StandardDataTable
            columns={columns}
            data={offers}
            loading={loading}
            emptyMessage={t('mediation.employee.noOffers') || 'No offers found'}
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

    </motion.div>
  );
};

export default EmployeeOffers;

