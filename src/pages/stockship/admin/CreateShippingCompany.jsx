import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Package, MapPin, User, Phone, Mail, FileText, Upload, X, Image as ImageIcon } from 'lucide-react';
import showToast from '@/lib/toast';
import { uploadImage } from '@/lib/imageUpload';

const CreateShippingCompany = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    avatar: '',
    address: '',
    contactName: '',
    phone: '',
    email: '',
    notes: '',
    status: 'ACTIVE'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast.error(t('shippingCompanies.create.fileTooLarge'), t('shippingCompanies.create.fileTooLargeDesc'));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload image
    try {
      setUploading(true);
      const imageUrl = await uploadImage(file, 'image', language);
      if (imageUrl) {
        setFormData(prev => ({ ...prev, avatar: imageUrl }));
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showToast.error(t('shippingCompanies.create.uploadFailed'), t('shippingCompanies.create.uploadFailedDesc'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setFormData(prev => ({ ...prev, avatar: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nameAr || !formData.nameEn) {
      showToast.error(t('shippingCompanies.create.validationError'), t('shippingCompanies.create.validationErrorDesc'));
      return;
    }

    try {
      setLoading(true);
      await adminApi.createShippingCompany(formData);
      showToast.success(t('shippingCompanies.create.createdSuccess'), t('shippingCompanies.create.createdSuccessDesc'));
      navigate('/stockship/admin/shipping-companies');
    } catch (error) {
      console.error('Error creating shipping company:', error);
      showToast.error(t('shippingCompanies.create.createFailed'), error.response?.data?.message || t('shippingCompanies.create.createFailedDesc'));
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
          onClick={() => navigate('/stockship/admin/shipping-companies')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1 className="text-3xl font-bold">{t('shippingCompanies.create.title')}</h1>
          <p className="text-gray-600 mt-2">{t('shippingCompanies.create.subtitle')}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('shippingCompanies.create.companyInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('shippingCompanies.create.companyLogo')}
              </label>
              {!avatarPreview && !formData.avatar ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors bg-gray-50">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  <div className="flex flex-col items-center gap-4">
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        <p className="text-sm text-gray-600">{t('shippingCompanies.create.uploading')}</p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                        <div>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                                {t('shippingCompanies.create.uploadAvatar')}
                          </button>
                          <p className="text-xs text-gray-500 mt-2">{t('shippingCompanies.create.fileFormat')}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative inline-block">
                  <img
                    src={avatarPreview || formData.avatar}
                    alt={t('shippingCompanies.create.companyLogo') || 'Avatar Preview'}
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                      title={t('shippingCompanies.create.changeAvatar')}
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      title={t('shippingCompanies.create.removeAvatar')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name Arabic */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('shippingCompanies.create.nameAr')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="nameAr"
                    value={formData.nameAr}
                    onChange={handleChange}
                    required
                    dir="rtl"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={t('shippingCompanies.create.nameArPlaceholder')}
                  />
                </div>
              </div>

              {/* Company Name English */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('shippingCompanies.create.nameEn')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="nameEn"
                    value={formData.nameEn}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={t('shippingCompanies.create.nameEnPlaceholder')}
                  />
                </div>
              </div>

              {/* Contact Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('shippingCompanies.create.contactName')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={t('shippingCompanies.create.contactNamePlaceholder')}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('shippingCompanies.create.phone')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={t('shippingCompanies.create.phonePlaceholder')}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('shippingCompanies.create.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={t('shippingCompanies.create.emailPlaceholder')}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('shippingCompanies.create.status')}
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="ACTIVE">{t('shippingCompanies.active')}</option>
                  <option value="INACTIVE">{t('shippingCompanies.inactive')}</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('shippingCompanies.create.address')}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={t('shippingCompanies.create.addressPlaceholder')}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('shippingCompanies.create.notes')}
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={t('shippingCompanies.create.notesPlaceholder')}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('shippingCompanies.create.notesHint')}</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/stockship/admin/shipping-companies')}
                className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('shippingCompanies.create.cancel')}
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {loading ? t('shippingCompanies.create.creating') : t('shippingCompanies.create.createCompany')}
              </motion.button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CreateShippingCompany;

