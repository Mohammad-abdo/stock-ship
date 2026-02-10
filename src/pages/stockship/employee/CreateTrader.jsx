import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { traderApi } from '@/lib/mediationApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, Building2, User, Mail, Phone, MapPin } from 'lucide-react';
import showToast from '@/lib/toast';

export default function CreateTrader() {
  const navigate = useNavigate();
  const { getAuth } = useMultiAuth();
  const { t } = useLanguage();
  const { user } = getAuth('employee');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    companyName: '',
    phone: '',
    countryCode: '',
    country: '',
    city: ''
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
    
    if (!formData.email || !formData.password || !formData.name || !formData.companyName) {
      showToast.error(
        t('mediation.employee.validationError') || 'Validation Error',
        t('mediation.employee.requiredFields') || 'Please fill in all required fields'
      );
      return;
    }

    try {
      setLoading(true);
      await traderApi.createTrader(user.id, formData);
      showToast.success(
        t('mediation.employee.traderCreated') || 'Trader Created',
        t('mediation.employee.traderCreatedSuccess') || 'Trader has been registered successfully'
      );
      navigate('/stockship/employee/traders');
    } catch (error) {
      console.error('Error creating trader:', error);
      showToast.error(
        t('mediation.employee.createFailed') || 'Failed to create trader',
        error.response?.data?.message || 'Please try again'
      );
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
          onClick={() => navigate('/stockship/employee/traders')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('mediation.employee.registerTrader') || 'Register New Trader'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('mediation.employee.registerTraderDesc') || 'Add a new trader to your list'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-600" />
              {t('mediation.traders.basicInfo') || 'Basic Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.traders.companyName') || 'Company Name'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.traders.companyNamePlaceholder') || 'Enter company name'}
                  />
                </div>
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.traders.contactPerson') || 'Contact Person'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.traders.contactPersonPlaceholder') || 'Enter contact person name'}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.common.email') || 'Email'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.common.emailPlaceholder') || 'Enter email address'}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.password') || 'Password'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                  placeholder={t('common.passwordPlaceholder') || 'Enter password (min 6 characters)'}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.common.phone') || 'Phone'}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.common.phonePlaceholder') || 'Enter phone number'}
                  />
                </div>
              </div>

              {/* Country Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.traders.countryCode') || 'Country Code'}
                </label>
                <input
                  type="text"
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                  placeholder={t('mediation.traders.countryCodePlaceholder') || 'e.g., +1, +966'}
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.traders.country') || 'Country'}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.traders.countryPlaceholder') || 'Enter country'}
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.traders.city') || 'City'}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.traders.cityPlaceholder') || 'Enter city'}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => navigate('/stockship/employee/traders')}
            className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('common.cancel') || 'Cancel'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('mediation.employee.creating') || 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('mediation.employee.createTrader') || 'Create Trader'}
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}




