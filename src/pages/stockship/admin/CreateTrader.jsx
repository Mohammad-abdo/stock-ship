import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminApi } from '@/lib/stockshipApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Loader2,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  CreditCard,
  FileText
} from 'lucide-react';
import showToast from '@/lib/toast';
import { countries, getFlagUrl, citiesByCountry } from '@/data/countries';

const CreateTrader = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [formData, setFormData] = useState({
    employeeId: '',
    email: '',
    password: '',
    name: '',
    companyName: '',
    phone: '',
    countryCode: '',
    country: '',
    city: '',
    companyAddress: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankName: '',
    bankAddress: '',
    bankCode: '',
    swiftCode: ''
  });

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const res = await adminApi.getEmployees({ limit: 200, page: 1 });
        const data = res.data?.data ?? res.data ?? [];
        setEmployees(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading employees:', err);
        showToast.error(
          t('mediation.traders.loadEmployeesFailed') || 'Failed to load employees',
          err.response?.data?.message || t('common.tryAgain')
        );
      } finally {
        setLoadingEmployees(false);
      }
    };
    loadEmployees();
  }, [t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'country') next.city = '';
      return next;
    });
  };

  const selectedCountryCode = (() => {
    const v = (formData.country || '').trim();
    if (!v) return '';
    const byEn = countries.find((c) => c.nameEn === v);
    if (byEn) return byEn.code;
    const byAr = countries.find((c) => c.nameAr === v);
    return byAr ? byAr.code : '';
  })();
  const availableCities = citiesByCountry[selectedCountryCode] || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name || !formData.companyName) {
      showToast.error(
        t('mediation.employee.validationError') || 'Validation Error',
        t('mediation.employee.requiredFields') || 'Please fill in all required fields'
      );
      return;
    }
    if (!formData.employeeId) {
      showToast.error(
        t('mediation.traders.validationError') || 'Validation Error',
        t('mediation.traders.selectEmployeeRequired') || 'Please select an employee to assign this trader to'
      );
      return;
    }

    try {
      setLoading(true);
      await adminApi.createTrader(formData);
      showToast.success(
        t('mediation.employee.traderCreated') || 'Trader Created',
        t('mediation.employee.traderCreatedSuccess') || 'Trader has been registered successfully'
      );
      navigate('/stockship/admin/traders');
    } catch (error) {
      console.error('Error creating trader:', error);
      showToast.error(
        t('mediation.employee.createFailed') || 'Failed to create trader',
        error.response?.data?.message || t('common.tryAgain')
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary';
  const labelClass = 'block text-sm font-medium mb-2';
  const iconInputClass = 'w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/stockship/admin/traders')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className="text-3xl font-bold">{t('mediation.traders.createTrader') || 'Create Trader'}</h1>
          <p className="text-muted-foreground mt-2">{t('mediation.traders.createTraderSubtitle') || 'Add a new trader and assign to an employee'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Employee & Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              {t('mediation.traders.basicInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>
                  {t('mediation.traders.employee')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    required
                    disabled={loadingEmployees}
                    className={`${iconInputClass} disabled:bg-gray-100`}
                  >
                    <option value="">{t('mediation.traders.selectEmployee')}</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode || emp.email})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('mediation.traders.assignEmployeeHint')}
                </p>
              </div>

              <div>
                <label className={labelClass}>{t('mediation.traders.companyName')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required className={iconInputClass} placeholder={t('mediation.traders.companyNamePlaceholder')} />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('mediation.traders.contactPerson')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className={iconInputClass} placeholder={t('mediation.traders.contactPersonPlaceholder')} />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('mediation.common.email')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className={iconInputClass} placeholder={t('mediation.common.emailPlaceholder')} />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('common.password')} <span className="text-red-500">*</span></label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} className={inputClass} placeholder={t('mediation.employees.passwordPlaceholder')} />
              </div>
              <div>
                <label className={labelClass}>{t('mediation.common.phone')}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={iconInputClass} placeholder={t('mediation.traders.phonePlaceholder')} />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('mediation.traders.countryCode')}</label>
                <input type="text" name="countryCode" value={formData.countryCode} onChange={handleChange} className={inputClass} placeholder="+966" />
              </div>
              <div>
                <label className={labelClass}>{t('mediation.traders.country')}</label>
                <div className="relative flex items-center">
                  <MapPin className={`absolute top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10 ${isRTL ? 'right-3' : 'left-3'}`} />
                  {selectedCountryCode && (
                    <img
                      src={getFlagUrl(selectedCountryCode)}
                      alt=""
                      className={`absolute top-1/2 -translate-y-1/2 w-6 h-4 object-cover rounded-sm pointer-events-none z-10 border border-gray-200 ${isRTL ? 'right-10' : 'left-10'}`}
                      loading="lazy"
                    />
                  )}
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={selectedCountryCode ? `w-full py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${isRTL ? 'pr-16 pl-4' : 'pl-16 pr-4'}` : iconInputClass}
                  >
                    <option value="">{t('mediation.traders.countryPlaceholder')}</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.nameEn}>
                        {isRTL ? (c.nameAr || c.nameEn) : c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('mediation.traders.city')}</label>
                {availableCities.length > 0 ? (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={iconInputClass}
                    >
                      <option value="">{t('mediation.traders.cityPlaceholder')}</option>
                      {availableCities.map((city) => (
                        <option key={city.value} value={city.value}>
                          {isRTL ? city.label.ar : city.label.en}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input type="text" name="city" value={formData.city} onChange={handleChange} className={iconInputClass} placeholder={t('mediation.traders.cityPlaceholder')} />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Company Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              {t('mediation.trader.updateRequest.companyAddress') || 'Company Address'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className={labelClass}>{t('mediation.trader.updateRequest.companyAddressPlaceholder') || 'Company address'}</label>
              <textarea
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleChange}
                rows={3}
                className={`${inputClass} resize-y min-h-[80px]`}
                placeholder={t('mediation.trader.updateRequest.companyAddressPlaceholder') || 'Enter company address'}
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. Bank Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              {t('mediation.trader.updateRequest.bankInfo') || 'Bank Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>{t('mediation.trader.updateRequest.bankAccountName') || 'Bank Account Name'}</label>
                <input type="text" name="bankAccountName" value={formData.bankAccountName} onChange={handleChange} className={inputClass} placeholder={t('mediation.trader.updateRequest.bankAccountNamePlaceholder') || 'Account name'} />
              </div>
              <div>
                <label className={labelClass}>{t('mediation.trader.updateRequest.bankAccountNumber') || 'Bank Account Number'}</label>
                <input type="text" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} className={inputClass} placeholder={t('mediation.trader.updateRequest.bankAccountNumberPlaceholder') || 'Account number'} />
              </div>
              <div>
                <label className={labelClass}>{t('mediation.trader.updateRequest.bankName') || 'Bank Name'}</label>
                <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className={inputClass} placeholder={t('mediation.trader.updateRequest.bankNamePlaceholder') || 'Bank name'} />
              </div>
              <div>
                <label className={labelClass}>{t('mediation.trader.updateRequest.bankCode') || 'Bank Code'}</label>
                <input type="text" name="bankCode" value={formData.bankCode} onChange={handleChange} className={inputClass} placeholder={t('mediation.trader.updateRequest.bankCodePlaceholder') || 'Bank code'} />
              </div>
              <div>
                <label className={labelClass}>{t('mediation.trader.updateRequest.swiftCode') || 'SWIFT Code'}</label>
                <input type="text" name="swiftCode" value={formData.swiftCode} onChange={handleChange} className={inputClass} placeholder={t('mediation.trader.updateRequest.swiftCodePlaceholder') || 'SWIFT'} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{t('mediation.trader.updateRequest.bankAddress') || 'Bank Address'}</label>
                <textarea
                  name="bankAddress"
                  value={formData.bankAddress}
                  onChange={handleChange}
                  rows={2}
                  className={`${inputClass} resize-y`}
                  placeholder={t('mediation.trader.updateRequest.bankAddressPlaceholder') || 'Bank address'}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/stockship/admin/traders')}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            {t('common.cancel') || 'Cancel'}
          </motion.button>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading || loadingEmployees}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('mediation.common.creating') || 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('mediation.common.create') || 'Create'}
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateTrader;
