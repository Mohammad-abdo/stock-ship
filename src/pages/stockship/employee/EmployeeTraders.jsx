import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { employeeApi, traderApi } from "@/lib/mediationApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StandardDataTable from "@/components/StandardDataTable";
import { motion } from "framer-motion";
import { Users, Plus, Search, Eye, Edit, QrCode, Building2 } from "lucide-react";
import showToast from "@/lib/toast";

export default function EmployeeTraders() {
  const navigate = useNavigate();
  const { getAuth } = useMultiAuth();
  const { t, language } = useLanguage();
  const { user } = getAuth('employee');
  
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [activeTab, setActiveTab] = useState("active"); // "active" or "requests"
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (user?.id && !fetchingRef.current) {
      loadTraders();
    }
  }, [user, pagination.page, activeTab]);

  const loadTraders = async () => {
    if (fetchingRef.current) return;
    
    try {
      fetchingRef.current = true;
      setLoading(true);
      
      const response = await employeeApi.getEmployeeTraders(user.id, {
        page: pagination.page,
        limit: pagination.limit,
        isVerified: activeTab === 'active',
        ...(searchTerm && { search: searchTerm })
      });
      
      const data = response.data.data || response.data;
      setTraders(Array.isArray(data) ? data : (data?.traders || []));
      
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error loading traders:', error);
      showToast.error(
        t('mediation.employee.loadTradersFailed') || 'Failed to load traders',
        error.response?.data?.message || 'Please try again'
      );
      setTraders([]);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined && !fetchingRef.current) {
        setPagination(prev => ({ ...prev, page: 1 }));
        loadTraders();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleApprove = async (traderId) => {
    try {
      await traderApi.updateTrader(traderId, { isVerified: true });
      showToast.success(t('mediation.traders.verifiedSuccess') || "Trader verified successfully");
      loadTraders(); // Reload to refresh list
    } catch (error) {
       console.error(error);
       showToast.error("Failed to verify trader");
    }
  };

  const handleDecline = async (traderId) => {
     if(!window.confirm("Are you sure you want to decline this trader? They will be deactivated.")) return;
     try {
       await traderApi.updateTrader(traderId, { isActive: false });
       showToast.success(t('mediation.traders.declinedSuccess') || "Trader declined successfully");
       loadTraders();
     } catch (error) {
        console.error(error);
        showToast.error("Failed to decline trader");
     }
  };

  const columns = [
    {
      key: 'traderCode',
      label: t('mediation.traders.traderCode') || 'Trader Code',
      render: (value) => <span className="font-mono text-sm font-medium">{value || 'N/A'}</span>
    },
    {
      key: 'companyName',
      label: t('mediation.traders.companyName') || 'Company Name',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'name',
      label: t('mediation.traders.contactPerson') || 'Contact Person',
      render: (value) => <span className="text-sm">{value || 'N/A'}</span>
    },
    {
      key: 'email',
      label: t('mediation.common.email') || 'Email',
      render: (value) => <span className="text-sm text-gray-600">{value || 'N/A'}</span>
    },
    {
      key: 'phone',
      label: t('mediation.common.phone') || 'Phone',
      render: (value) => <span className="text-sm text-gray-600">{value || 'N/A'}</span>
    },
    {
      key: 'isActive',
      label: t('mediation.common.status') || 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? (t('mediation.common.active') || 'Active') : (t('mediation.common.inactive') || 'Inactive')}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: t('mediation.common.createdAt') || 'Created',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? new Date(value).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : 'N/A'}
        </span>
      )
    }
  ];

  const rowActions = (row) => (
    <div className="flex items-center gap-1 justify-end">
      {!row.isVerified && (
         <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleApprove(row.id);
              }}
              className="p-1 px-2 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs transition-colors mr-1"
              title="Approve"
            >
              Approve
            </button>
            <button
               onClick={(e) => {
                 e.stopPropagation();
                 handleDecline(row.id);
               }}
               className="p-1 px-2 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs transition-colors mr-2"
               title="Decline"
            >
               Decline
            </button>
         </>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/stockship/employee/traders/${row.id}`);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('mediation.employee.viewTrader') || 'View Trader'}
      >
        <Eye className="w-4 h-4 text-gray-600" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/stockship/employee/traders/${row.id}/edit`);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('common.edit') || 'Edit'}
      >
        <Edit className="w-4 h-4 text-gray-600" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/stockship/employee/traders/${row.id}?qr=true`);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('mediation.employee.viewQR') || 'View QR Code'}
      >
        <QrCode className="w-4 h-4 text-gray-600" />
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
            {t('mediation.employee.myTraders') || 'My Traders'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('mediation.employee.manageTradersDesc') || 'Manage traders assigned to you'}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/stockship/employee/traders/create')}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('mediation.employee.registerTrader') || 'Register New Trader'}
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab("requests");
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "requests"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {t('mediation.employee.requests') || 'Requests'}
        </button>
        <button
          onClick={() => {
            setActiveTab("active");
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "active"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {t('mediation.employee.myTraders') || 'My Traders'}
        </button>
      </div>

      {/* Search */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('mediation.employee.searchTraders') || 'Search traders by name, company, or code...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Traders Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {t('mediation.employee.tradersList') || 'Traders'} ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <StandardDataTable
            columns={columns}
            data={traders}
            loading={loading}
            emptyMessage={t('mediation.employee.noTraders') || 'No traders found'}
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
