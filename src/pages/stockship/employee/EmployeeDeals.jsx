import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { employeeApi } from "@/lib/mediationApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StandardDataTable from "@/components/StandardDataTable";
import { motion } from "framer-motion";
import { ShoppingCart, Search, Eye, Filter, Calendar, DollarSign, Building2, User, Truck } from "lucide-react";
import showToast from "@/lib/toast";

export default function EmployeeDeals() {
  const navigate = useNavigate();
  const { getAuth } = useMultiAuth();
  const { t, language } = useLanguage();
  const { user } = getAuth('employee');
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (user?.id && !fetchingRef.current) {
      loadDeals();
    }
  }, [user, pagination.page, statusFilter]);

  const loadDeals = async () => {
    if (fetchingRef.current) return;
    
    try {
      fetchingRef.current = true;
      setLoading(true);
      const response = await employeeApi.getEmployeeDeals(user.id, {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });
      const data = response.data.data || response.data;
      setDeals(Array.isArray(data) ? data : (data?.deals || []));
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error loading deals:', error);
      showToast.error(
        t('mediation.employee.loadDealsFailed') || 'Failed to load deals',
        error.response?.data?.message || 'Please try again'
      );
      setDeals([]);
      if (error.response?.status !== 429) {
        // Only show error if not rate limited
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined && !fetchingRef.current) {
        setPagination(prev => ({ ...prev, page: 1 }));
        loadDeals();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      NEGOTIATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('mediation.deals.negotiation') || 'Negotiation' },
      APPROVED: { bg: 'bg-blue-100', text: 'text-blue-800', label: t('mediation.deals.approved') || 'Approved' },
      PAID: { bg: 'bg-green-100', text: 'text-green-800', label: t('mediation.deals.paid') || 'Paid' },
      SETTLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.deals.settled') || 'Settled' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: t('mediation.deals.cancelled') || 'Cancelled' }
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status || 'Unknown' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const columns = [
    {
      key: 'dealNumber',
      label: t('mediation.deals.dealNumber') || 'Deal Number',
      render: (value) => <span className="font-mono text-sm font-medium">{value || 'N/A'}</span>
    },
    {
      key: 'trader',
      label: t('mediation.deals.trader') || 'Trader',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{row.trader?.companyName || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'client',
      label: t('mediation.deals.client') || 'Client',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{row.client?.name || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'negotiatedAmount',
      label: t('mediation.deals.negotiatedAmount') || 'Amount',
      render: (value) => (
        <span className="font-medium text-gray-900">
          ${(Number(value) || 0).toFixed(2)}
        </span>
      )
    },
    {
      key: 'shippingCompany',
      label: 'Shipping Company',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {row.shippingCompany?.avatar && (
            <img 
              src={row.shippingCompany.avatar} 
              alt={row.shippingCompany.nameEn || row.shippingCompany.nameAr} 
              className="w-5 h-5 rounded-full object-cover"
            />
          )}
          <span className="text-sm">{row.shippingCompany?.nameEn || row.shippingCompany?.nameAr || 'Not Assigned'}</span>
        </div>
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
          <span>
            {value ? new Date(value).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : 'N/A'}
          </span>
        </div>
      )
    }
  ];

  const rowActions = (row) => (
    <div className="flex items-center gap-1 justify-end">
      {row.shippingCompany && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/stockship/employee/shipping-tracking/${row.id}/view`);
          }}
          className="p-1.5 hover:bg-blue-100 rounded transition-colors"
          title={t('mediation.employee.shippingTracking.title') || 'View Shipping Tracking'}
        >
          <Truck className="w-4 h-4 text-blue-600" />
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/stockship/employee/deals/${row.id}`);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('mediation.deals.viewDetails') || 'View Details'}
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
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('mediation.deals.title') || 'My Deals'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('mediation.employee.manageDealsDesc') || 'Monitor and manage deals from your traders'}
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
                placeholder={t('mediation.employee.searchDeals') || 'Search deals by number, trader, or client...'}
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
                <option value="">{t('mediation.deals.allStatus') || 'All Status'}</option>
                <option value="NEGOTIATION">{t('mediation.deals.negotiation') || 'Negotiation'}</option>
                <option value="APPROVED">{t('mediation.deals.approved') || 'Approved'}</option>
                <option value="PAID">{t('mediation.deals.paid') || 'Paid'}</option>
                <option value="SETTLED">{t('mediation.deals.settled') || 'Settled'}</option>
                <option value="CANCELLED">{t('mediation.deals.cancelled') || 'Cancelled'}</option>
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

      {/* Deals Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {t('mediation.deals.dealsList') || 'Deals'} ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <StandardDataTable
            columns={columns}
            data={deals}
            loading={loading}
            emptyMessage={t('mediation.employee.noDeals') || 'No deals found'}
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
}
