import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { traderApi, uploadApi } from '@/lib/mediationApi';
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
  CreditCard,
  FileText,
  Upload,
  X
} from 'lucide-react';
import showToast from '@/lib/toast';
import { countries, getFlagUrl, citiesByCountry, getDialCodeForCountryName } from '@/data/countries';
import { CountrySearchSelect } from '@/components/CountrySearchSelect';

export default function CreateTrader() {
  const navigate = useNavigate();
  const { getAuth } = useMultiAuth();
  const { t, isRTL } = useLanguage();
  const { user } = getAuth('employee');
  const [loading, setLoading] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [documents, setDocuments] = useState([]); // [{ name, url }]
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
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

  const handleDocumentUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    try {
      setUploadingDocs(true);
      const res = await uploadApi.uploadDocuments(Array.from(files));
      const list = (res.data?.data?.files || []).map((f) => ({ name: f.originalname, url: f.url }));
      setDocuments((prev) => [...prev, ...list]);
    } catch (err) {
      console.error('Document upload failed:', err);
      showToast.error(
        t('mediation.traders.documentsUploadFailed') || 'Upload failed',
        err.response?.data?.message || t('common.tryAgain')
      );
    } finally {
      setUploadingDocs(false);
      e.target.value = '';
    }
  };

  const removeDocument = (index) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'country') {
        next.city = '';
        const dial = getDialCodeForCountryName(value);
        if (dial) next.countryCode = dial;
      }
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

  const requiredMsg = t('mediation.traders.fieldRequired') || 'This field is required';
  const validate = () => {
    const err = {};
    if (!(formData.companyName || '').trim()) err.companyName = requiredMsg;
    if (!(formData.name || '').trim()) err.name = requiredMsg;
    if (!(formData.email || '').trim()) err.email = requiredMsg;
    if (!(formData.password || '').trim()) err.password = requiredMsg;
    else if (formData.password.length < 6) err.password = t('mediation.employees.passwordMinLength') || 'Password must be at least 6 characters';
    return err;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast.error(
        t('mediation.traders.validationError') || 'Validation Error',
        t('mediation.traders.pleaseFixErrors') || 'Please fix the highlighted fields below'
      );
      return;
    }
    setFieldErrors({});

    try {
      setLoading(true);
      await traderApi.createTrader(user.id, { ...formData, documents: documents.length ? documents : undefined });
      showToast.success(
        t('mediation.employee.traderCreated') || 'Trader Created',
        t('mediation.employee.traderCreatedSuccess') || 'Trader has been registered successfully'
      );
      navigate('/stockship/employee/traders');
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
          onClick={() => navigate('/stockship/employee/traders')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className="text-3xl font-bold">{t('mediation.traders.createTrader') || 'Create Trader'}</h1>
          <p className="text-muted-foreground mt-2">{t('mediation.traders.createTraderSubtitleEmployee') || 'Add a new trader'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {Object.keys(fieldErrors).length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {t('mediation.traders.pleaseFixErrors') || 'Please fix the highlighted fields below to complete the addition'}
          </div>
        )}

        {/* 1. Basic Info (same as admin, without employee field) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              {t('mediation.traders.basicInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>{t('mediation.traders.companyName')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className={`${iconInputClass} ${fieldErrors.companyName ? 'border-red-500 bg-red-50/50' : ''}`} placeholder={t('mediation.traders.companyNamePlaceholder')} />
                </div>
                {fieldErrors.companyName && <p className="mt-1 text-xs text-red-600">{fieldErrors.companyName}</p>}
              </div>
              <div>
                <label className={labelClass}>{t('mediation.traders.contactPerson')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className={`${iconInputClass} ${fieldErrors.name ? 'border-red-500 bg-red-50/50' : ''}`} placeholder={t('mediation.traders.contactPersonPlaceholder')} />
                </div>
                {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className={labelClass}>{t('mediation.common.email')} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className={`${iconInputClass} ${fieldErrors.email ? 'border-red-500 bg-red-50/50' : ''}`} placeholder={t('mediation.common.emailPlaceholder')} />
                </div>
                {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className={labelClass}>{t('common.password')} <span className="text-red-500">*</span></label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} minLength={6} className={`${inputClass} ${fieldErrors.password ? 'border-red-500 bg-red-50/50' : ''}`} placeholder={t('mediation.employees.passwordPlaceholder')} />
                {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
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
                <CountrySearchSelect
                  value={formData.country}
                  onChange={handleChange}
                  placeholder={t('mediation.traders.countryPlaceholder')}
                  searchPlaceholder={t('mediation.traders.searchCountryPlaceholder')}
                  isRTL={isRTL}
                  hasError={!!fieldErrors.country}
                />
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

        {/* 4. Trader Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-muted-foreground" />
              {t('mediation.traders.traderDocuments') || 'مستندات التاجر'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
                <label className={labelClass}>{t('mediation.traders.uploadTraderDocuments') || 'رفع ملفات التاجر (صور أو PDF)'}</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={handleDocumentUpload}
                  disabled={uploadingDocs}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {uploadingDocs && (
                  <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('mediation.common.uploading') || 'Uploading...'}
                  </p>
                )}
                {documents.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {documents.map((doc, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 py-1 px-2 rounded bg-gray-50">
                        <span className="text-sm truncate">{doc.name}</span>
                        <button type="button" onClick={() => removeDocument(i)} className="p-1 text-red-600 hover:bg-red-50 rounded" aria-label="Remove">
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/stockship/employee/traders')}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            {t('common.cancel') || 'Cancel'}
          </motion.button>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
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
}
