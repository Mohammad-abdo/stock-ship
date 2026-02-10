import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import StandardDataTable from '@/components/StandardDataTable';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Gift, 
  Search, 
  Filter,
  Eye,
  Loader2,
  AlertCircle,
  Store,
  Edit2
} from 'lucide-react';
import { employeeApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';

const EmployeeOfferUpdateRequests = () => {
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { getAuth } = useMultiAuth();
  const { user } = getAuth('employee');

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchUpdateRequests();
    }
  }, [user?.id, statusFilter]);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const fetchUpdateRequests = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getAllOfferUpdateRequests({
        status: statusFilter || undefined
      });
      const data = response.data?.data || response.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching update requests:', error);
      showToast.error(t('mediation.offers.updateRequest.loadFailed') || 'Failed to load update requests');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(req => 
        req.offer?.title?.toLowerCase().includes(searchLower) ||
        req.offer?.trader?.name?.toLowerCase().includes(searchLower) ||
        req.offer?.trader?.companyName?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredRequests(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: t('mediation.offers.updateRequest.status.pending') || 'Pending' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: t('mediation.offers.updateRequest.status.approved') || 'Approved' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: t('mediation.offers.updateRequest.status.rejected') || 'Rejected' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle, label: t('mediation.offers.updateRequest.status.cancelled') || 'Cancelled' },
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle, label: status };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getRequestedChangesPreview = (requestedData) => {
    if (!requestedData || Object.keys(requestedData).length === 0) {
      return <span className="text-xs text-gray-400 italic">{t('common.none') || 'None'}</span>;
    }
    
    const changes = Object.keys(requestedData).slice(0, 2);
    const moreCount = Object.keys(requestedData).length - 2;
    
    return (
      <div className="flex flex-col gap-1">
        {changes.map((key) => (
          <span key={key} className="text-xs text-gray-600">
            <span className="font-medium">{key}:</span> {String(requestedData[key]).substring(0, 30)}
            {String(requestedData[key]).length > 30 ? '...' : ''}
          </span>
        ))}
        {moreCount > 0 && (
          <span className="text-xs text-gray-400">
            +{moreCount} {t('common.more') || 'more'}
          </span>
        )}
      </div>
    );
  };

  const columns = [
    {
      key: 'offer',
      label: t('mediation.offers.offerTitle') || 'Offer',
      minWidth: '250px',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Gift className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">
              {row.offer?.title || t('common.unknown') || 'Unknown'}
            </p>
            {row.offer?.trader?.traderCode && (
              <p className="text-xs text-gray-500 truncate">
                {t('mediation.traders.traderCode') || 'Code'}: {row.offer.trader.traderCode}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'trader',
      label: t('mediation.offers.trader') || 'Trader',
      minWidth: '200px',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 truncate">
              {row.offer?.trader?.companyName || row.offer?.trader?.name || 'N/A'}
            </p>
            {row.offer?.trader?.name && row.offer?.trader?.name !== row.offer?.trader?.companyName && (
              <p className="text-xs text-gray-500 truncate">{row.offer.trader.name}</p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: t('mediation.common.status') || 'Status',
      minWidth: '120px',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'requestedChanges',
      label: t('mediation.offers.updateRequest.requestedChanges') || 'Requested Changes',
      minWidth: '200px',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Edit2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {getRequestedChangesPreview(row.requestedData)}
          </div>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: t('common.submittedAt') || 'Submitted',
      minWidth: '150px',
      render: (value) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span className="whitespace-nowrap">
            {value ? new Date(value).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'reviewedAt',
      label: t('mediation.offers.updateRequest.reviewedAt') || 'Reviewed',
      minWidth: '150px',
      render: (value, row) => {
        if (!value && row.status === 'PENDING') {
          return <span className="text-xs text-gray-400 italic">{t('common.pending') || 'Pending'}</span>;
        }
        return value ? (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="whitespace-nowrap">
              {new Date(value).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        ) : null;
      }
    }
  ];

  const rowActions = (row) => (
    <div className="flex items-center gap-1 justify-end">
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/stockship/employee/offer-update-requests/${row.id}`);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('common.view') || 'View Details'}
      >
        <Eye className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('mediation.offers.updateRequest.reviewTitle') || 'Offer Update Requests'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('mediation.offers.updateRequest.reviewSubtitle') || 'Review and approve or reject offer update requests'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className={`flex flex-col sm:flex-row gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`relative flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
              <input
                type="text"
                placeholder={t('mediation.employee.searchOffers') || 'Search by offer title or trader...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white`}
              />
            </div>
            <div className="relative">
              <Filter className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none`} />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                }}
                className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white appearance-none min-w-[200px]`}
              >
                <option value="">{t('mediation.offers.updateRequest.allStatus') || 'All Status'}</option>
                <option value="PENDING">{t('mediation.offers.updateRequest.status.pending') || 'Pending'}</option>
                <option value="APPROVED">{t('mediation.offers.updateRequest.status.approved') || 'Approved'}</option>
                <option value="REJECTED">{t('mediation.offers.updateRequest.status.rejected') || 'Rejected'}</option>
                <option value="CANCELLED">{t('mediation.offers.updateRequest.status.cancelled') || 'Cancelled'}</option>
              </select>
            </div>
            {statusFilter && (
              <button
                onClick={() => {
                  setStatusFilter('');
                }}
                className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                {t('mediation.employee.clearFilter') || 'Clear Filter'}
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className={`text-lg font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('mediation.offers.updateRequest.reviewTitle') || 'Offer Update Requests'} ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <StandardDataTable
            columns={columns}
            data={filteredRequests}
            loading={loading}
            emptyMessage={t('mediation.offers.updateRequest.noRequests') || 'No update requests found'}
            searchable={false}
            rowActions={rowActions}
            compact={false}
            onRowClick={(row) => navigate(`/stockship/employee/offer-update-requests/${row.id}`)}
          />
        </CardContent>
      </Card>

    </motion.div>
  );
};

export default EmployeeOfferUpdateRequests;
