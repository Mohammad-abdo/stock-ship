import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, User, Mail, Phone, DollarSign } from 'lucide-react';
import showToast from '@/lib/toast';

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    commissionRate: 1.0,
    isActive: true
  });

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setFetching(true);
      const response = await adminApi.getEmployee(id);
      const employee = response.data.data || response.data;
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        commissionRate: employee.commissionRate || 1.0,
        isActive: employee.isActive !== undefined ? employee.isActive : true
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      showToast.error('Failed to load employee', error.response?.data?.message || 'Employee not found');
      navigate('/stockship/admin/employees');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      showToast.error('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await adminApi.updateEmployee(id, formData);
      showToast.success('Employee Updated', 'Employee has been updated successfully');
      navigate('/stockship/admin/employees');
    } catch (error) {
      console.error('Error updating employee:', error);
      showToast.error('Failed to update employee', error.response?.data?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.employees.loading')}</p>
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
    >
      {/* Header */}
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
          <h1 className="text-3xl font-bold">{t('mediation.employees.editEmployee')}</h1>
          <p className="text-muted-foreground mt-2">{t('mediation.employees.editEmployeeSubtitle')}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('mediation.employees.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('mediation.employees.name')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('mediation.employees.namePlaceholder')}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('mediation.employees.email')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled
                    className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 cursor-not-allowed"
                    placeholder={t('mediation.employees.emailPlaceholder')}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t('mediation.employees.emailCannotChange')}</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('mediation.employees.phone')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('mediation.employees.phonePlaceholder')}
                  />
                </div>
              </div>

              {/* Commission Rate */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('mediation.employees.commissionRate')} (%)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    name="commissionRate"
                    value={formData.commissionRate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="1.0"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t('mediation.employees.commissionRateHint')}</p>
              </div>

              {/* Active Status */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">{t('mediation.employees.isActive')}</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1">{t('mediation.employees.isActiveHint')}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/stockship/admin/employees')}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                {t('mediation.common.cancel')}
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {loading ? t('mediation.common.updating') : t('mediation.common.update')}
              </motion.button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EditEmployee;




