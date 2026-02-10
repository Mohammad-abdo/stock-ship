import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import StandardDataTable from '@/components/StandardDataTable';
import { motion } from 'framer-motion';
import { Plus, Edit, Eye, Briefcase, Mail, Phone, Users, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import showToast from '@/lib/toast';

const AdminEmployees = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchEmployees();
  }, [pagination.page]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm })
      };
      const response = await adminApi.getEmployees(params);
      const data = response.data?.data || response.data || [];
      setEmployees(Array.isArray(data) ? data : []);
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      showToast.error('Failed to fetch employees', error.response?.data?.message || 'Please try again');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((employee) =>
    (employee.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.employeeCode || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'id',
      label: t('mediation.common.id'),
      align: 'right',
      minWidth: '80px'
    },
    {
      key: 'employeeCode',
      label: t('mediation.employees.employeeCode'),
      render: (value) => (
        <div className="flex items-center gap-2">
          <Briefcase className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-mono text-xs">{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'name',
      label: t('mediation.employees.name')
    },
    {
      key: 'email',
      label: t('mediation.employees.email'),
      render: (value) => (
        <div className="flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'phone',
      label: t('mediation.employees.phone'),
      render: (value) => (
        <div className="flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'commissionRate',
      label: t('mediation.employees.commissionRate'),
      align: 'right',
      render: (value) => (
        <div className="flex items-center gap-1.5 justify-end">
          <DollarSign className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{value || 0}%</span>
        </div>
      )
    },
    {
      key: 'traders',
      label: t('mediation.employees.traders'),
      align: 'right',
      render: (value, row) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{row._count?.traders || 0}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: t('mediation.common.status'),
      render: (value, row) => (
        row.isActive ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
            <CheckCircle className="w-3 h-3" />
            {t('mediation.employees.active')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            <XCircle className="w-3 h-3" />
            {t('mediation.employees.inactive')}
          </span>
        )
      )
    }
  ];

  const rowActions = (row) => (
    <div className="flex items-center gap-1 justify-end">
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/stockship/admin/employees/${row.id}/view`);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('mediation.employees.viewDetails')}
      >
        <Eye className="w-4 h-4 text-gray-600" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/stockship/admin/employees/${row.id}/edit`);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('mediation.employees.edit')}
      >
        <Edit className="w-4 h-4 text-gray-600" />
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
          <h1 className="text-2xl font-semibold text-gray-900">{t('mediation.employees.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('mediation.employees.subtitle')}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/stockship/admin/employees/create')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('mediation.employees.addEmployee')}
        </motion.button>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {t('mediation.employees.list')} ({pagination.total || filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <StandardDataTable
            columns={columns}
            data={filteredEmployees}
            loading={loading && employees.length === 0}
            emptyMessage={t('mediation.employees.noEmployees')}
            searchable={true}
            searchValue={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            searchPlaceholder={t('mediation.employees.search')}
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

export default AdminEmployees;
