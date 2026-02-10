import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, User, Mail, Phone, DollarSign } from 'lucide-react';
import showToast from '@/lib/toast';

const CreateEmployee = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    commissionRate: 1.0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      showToast.error('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await adminApi.createEmployee(formData);
      showToast.success('Employee Created', 'Employee has been created successfully');
      navigate('/stockship/admin/employees');
    } catch (error) {
      console.error('Error creating employee:', error);
      showToast.error('Failed to create employee', error.response?.data?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold">{t('mediation.employees.createEmployee')}</h1>
          <p className="text-muted-foreground mt-2">{t('mediation.employees.createEmployeeSubtitle')}</p>
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
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('mediation.employees.emailPlaceholder')}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('mediation.employees.password')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t('mediation.employees.passwordPlaceholder')}
                />
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
                {loading ? t('mediation.common.creating') : t('mediation.common.create')}
              </motion.button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CreateEmployee;




