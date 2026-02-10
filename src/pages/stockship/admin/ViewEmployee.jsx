import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Briefcase, Mail, Phone, Users, DollarSign, Calendar, CheckCircle, XCircle, Package, ShoppingCart, User } from 'lucide-react';
import showToast from '@/lib/toast';

const ViewEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getEmployee(id);
      setEmployee(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching employee:', error);
      showToast.error('Failed to load employee', error.response?.data?.message || 'Employee not found');
      navigate('/stockship/admin/employees');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.employees.loading')}</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/stockship/admin/employees')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold">{t('mediation.employees.title')} - {t('mediation.employees.viewDetails')}</h1>
            <p className="text-muted-foreground mt-2">{employee.name || 'N/A'}</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/stockship/admin/employees/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Edit className="w-4 h-4" />
          {t('mediation.employees.edit')}
        </motion.button>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-4">
        {employee.isActive ? (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {t('mediation.employees.active')}
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            {t('mediation.employees.inactive')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t('mediation.viewEmployee.basicInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewEmployee.employeeCode')}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="font-mono">{employee.employeeCode || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewEmployee.name')}</label>
                  <p className="mt-1">{employee.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewEmployee.email')}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p>{employee.email || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewEmployee.phone')}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p>{employee.phone || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewEmployee.commissionRate')}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <p>{employee.commissionRate || 0}%</p>
                  </div>
                </div>
                {employee.createdByAdmin && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewEmployee.createdBy')}</label>
                    <p className="mt-1">{employee.createdByAdmin.name || 'N/A'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t('mediation.viewEmployee.statistics')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{employee._count?.traders || 0}</p>
                    <p className="text-sm text-muted-foreground">{t('mediation.viewEmployee.totalTraders')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <ShoppingCart className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{employee._count?.deals || 0}</p>
                    <p className="text-sm text-muted-foreground">{t('mediation.viewEmployee.totalDeals')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Traders */}
          {employee.traders && employee.traders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {t('mediation.viewEmployee.linkedTraders')} ({employee.traders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">{t('mediation.common.id')}</th>
                        <th className="text-left p-3">{t('mediation.traders.traderCode')}</th>
                        <th className="text-left p-3">{t('mediation.traders.companyName')}</th>
                        <th className="text-left p-3">{t('mediation.common.status')}</th>
                        <th className="text-left p-3">{t('mediation.common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.traders.map((trader) => (
                        <tr key={trader.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{trader.id}</td>
                          <td className="p-3 font-mono text-sm">{trader.traderCode || 'N/A'}</td>
                          <td className="p-3">{trader.companyName || trader.name || 'N/A'}</td>
                          <td className="p-3">
                            {trader.isActive ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {t('mediation.traders.active')}
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {t('mediation.traders.inactive')}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => navigate(`/stockship/admin/traders/${trader.id}/view`)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              {t('mediation.common.view')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('mediation.viewEmployee.importantDates')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewEmployee.createdAt')}</label>
                <p className="mt-1">{employee.createdAt ? new Date(employee.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
              {employee.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewEmployee.lastUpdated')}</label>
                  <p className="mt-1">{new Date(employee.updatedAt).toLocaleString()}</p>
                </div>
              )}
              {employee.lastLoginAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('mediation.viewEmployee.lastLogin')}</label>
                  <p className="mt-1">{new Date(employee.lastLoginAt).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default ViewEmployee;




