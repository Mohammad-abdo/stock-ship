import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import StandardDataTable from '@/components/StandardDataTable';
import { motion } from 'framer-motion';
import { Eye, Plus, Package, Phone, Mail, MapPin, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import showToast from '@/lib/toast';

const AdminShippingCompanies = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [companies, setCompanies] = useState([]);
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
    fetchCompanies();
  }, [pagination.page, statusFilter, searchTerm]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await adminApi.getShippingCompanies(params);
      const data = response.data?.data || response.data || [];
      setCompanies(Array.isArray(data) ? data : []);
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching shipping companies:', error);
      showToast.error(t('shippingCompanies.loadFailed'), error.response?.data?.message || t('shippingCompanies.loadFailedDesc'));
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(t('shippingCompanies.deleteConfirm').replace('{name}', name))) return;
    try {
      await adminApi.deleteShippingCompany(id);
      showToast.success(t('shippingCompanies.deletedSuccess'), t('shippingCompanies.deletedSuccessDesc'));
      fetchCompanies();
    } catch (error) {
      console.error('Error deleting shipping company:', error);
      showToast.error(t('shippingCompanies.deleteFailed'), error.response?.data?.message || t('shippingCompanies.deleteFailedDesc'));
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t('shippingCompanies.active')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
        <XCircle className="w-3 h-3 mr-1" />
        {t('shippingCompanies.inactive')}
      </span>
    );
  };

  const filteredCompanies = companies.filter((company) =>
    (company.nameAr || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.nameEn || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.contactName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'name',
      label: t('shippingCompanies.companyName'),
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {row.avatar && (
            <img 
              src={row.avatar} 
              alt={row.nameEn || row.nameAr} 
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          {!row.avatar && <Package className="w-4 h-4 text-gray-400" />}
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{row.nameEn || 'N/A'}</span>
            {row.nameAr && (
              <span className="text-xs text-gray-500" dir="rtl">{row.nameAr}</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'contactName',
      label: t('shippingCompanies.contactPerson'),
      render: (value) => (
        <span className="text-sm text-gray-600">{value || 'N/A'}</span>
      )
    },
    {
      key: 'phone',
      label: t('shippingCompanies.phone'),
      render: (value, row) => (
        <div className="flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'email',
      label: t('shippingCompanies.email'),
      render: (value, row) => (
        <div className="flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'address',
      label: t('shippingCompanies.address'),
      render: (value, row) => (
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm text-gray-600 max-w-xs truncate">{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: t('shippingCompanies.status'),
      render: (value, row) => getStatusBadge(row.status)
    },
    {
      key: '_count',
      label: t('shippingCompanies.deals'),
      render: (value, row) => (
        <span className="text-sm text-gray-600">{row._count?.deals || 0}</span>
      )
    },
    {
      key: 'createdAt',
      label: t('shippingCompanies.created'),
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
          navigate(`/stockship/admin/shipping-companies/${row.id}/view`);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('shippingCompanies.viewDetails')}
      >
        <Eye className="w-4 h-4 text-gray-600" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/stockship/admin/shipping-companies/${row.id}/edit`);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('common.edit')}
      >
        <Edit className="w-4 h-4 text-gray-600" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(row.id, row.name);
        }}
        className="p-1.5 hover:bg-red-100 rounded transition-colors"
        title={t('common.delete')}
      >
        <Trash2 className="w-4 h-4 text-red-600" />
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
          <h1 className="text-2xl font-semibold text-gray-900">{t('shippingCompanies.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('shippingCompanies.subtitle')}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/stockship/admin/shipping-companies/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('shippingCompanies.addCompany')}
        </motion.button>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder={t('shippingCompanies.searchPlaceholder')}
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
              <option value="">{t('shippingCompanies.allStatus')}</option>
              <option value="ACTIVE">{t('shippingCompanies.active')}</option>
              <option value="INACTIVE">{t('shippingCompanies.inactive')}</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
            >
              {t('shippingCompanies.clearFilters')}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {t('shippingCompanies.list')} ({pagination.total || filteredCompanies.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <StandardDataTable
            columns={columns}
            data={filteredCompanies}
            loading={loading && companies.length === 0}
            emptyMessage={t('shippingCompanies.noCompanies')}
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

export default AdminShippingCompanies;

