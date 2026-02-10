import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Image as ImageIcon, FileText, Settings, Upload, X, Loader2 } from 'lucide-react';
import showToast from '@/lib/toast';
import { uploadImage } from '@/lib/imageUpload';

const CreateSlider = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    imageUrl: '',
    imageAlt: '',
    linkUrl: '',
    linkTextAr: '',
    linkTextEn: '',
    displayOrder: 0,
    isActive: true
  });

  const handleImageUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast.error(t('sliders.create.invalidFileType'), t('sliders.create.invalidFileTypeDesc'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast.error(t('sliders.create.fileTooLarge'), t('sliders.create.fileTooLargeDesc'));
      return;
    }

    try {
      setUploading(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      setSelectedFile(file);
      
      // Upload image
      const imageUrl = await uploadImage(file, 'slider', language);
      
      if (imageUrl) {
        setFormData({ ...formData, imageUrl, imageAlt: file.name.replace(/\.[^/.]+$/, '') });
      } else {
        setSelectedFile(null);
        setImagePreview(null);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast.error(t('sliders.create.uploadFailed'), t('sliders.create.uploadFailedDesc'));
      setSelectedFile(null);
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setFormData({ ...formData, imageUrl: '', imageAlt: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.titleAr || !formData.titleEn) {
      showToast.error(t('sliders.create.titleRequired'), t('sliders.create.titleRequiredDesc'));
      setActiveTab('basic');
      return;
    }

    if (!formData.imageUrl) {
      showToast.error(t('sliders.create.imageRequired'), t('sliders.create.imageRequiredDesc'));
      setActiveTab('basic');
      return;
    }

    try {
      setSaving(true);
      const data = {
        ...formData,
        displayOrder: formData.displayOrder ? parseInt(formData.displayOrder) : 0
      };

      console.log('Creating slider with data:', data);
      await adminApi.createSlider(data);
      
      showToast.success(t('sliders.create.createdSuccess'), t('sliders.create.createdSuccessDesc'));
      navigate('/stockship/admin/sliders');
    } catch (error) {
      console.error('Error creating slider:', error);
      showToast.error(t('sliders.create.createFailed'), error.response?.data?.message || t('sliders.create.createFailedDesc'));
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'basic', label: t('sliders.create.basicInfo') || 'Basic Info', labelAr: 'المعلومات الأساسية', icon: FileText },
    { id: 'settings', label: t('sliders.create.additionalSettings') || 'Additional Settings', labelAr: 'الإعدادات الإضافية', icon: Settings }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/stockship/admin/sliders')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">{t('sliders.create.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('sliders.create.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex gap-2 border-b">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{language === 'ar' ? tab.labelAr : tab.label}</span>
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('sliders.create.sliderImage')} *
                  </label>
                  {!imagePreview && !formData.imageUrl ? (
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
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <p className="text-sm text-gray-600">{t('sliders.create.uploading')}</p>
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
                                {t('sliders.create.uploadImage')}
                              </button>
                              <p className="text-xs text-gray-500 mt-2">{t('sliders.create.fileFormat')}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview || formData.imageUrl}
                        alt={t('sliders.create.sliderImage') || 'Preview'}
                        className="w-full h-64 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Image Alt */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('sliders.create.imageAltText')}
                  </label>
                  <input
                    type="text"
                    value={formData.imageAlt}
                    onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('sliders.create.imageAltPlaceholder')}
                  />
                </div>

                {/* Title - Arabic */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('sliders.create.titleAr')} *
                  </label>
                  <input
                    type="text"
                    value={formData.titleAr}
                    onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('sliders.create.titleArPlaceholder')}
                    required
                    dir="rtl"
                  />
                </div>

                {/* Title - English */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('sliders.create.titleEn')} *
                  </label>
                  <input
                    type="text"
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('sliders.create.titleEnPlaceholder')}
                    required
                  />
                </div>

                {/* Description - Arabic */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('sliders.create.descriptionAr')}
                  </label>
                  <textarea
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows="4"
                    placeholder={t('sliders.create.descriptionArPlaceholder')}
                    dir="rtl"
                  />
                </div>

                {/* Description - English */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('sliders.create.descriptionEn')}
                  </label>
                  <textarea
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows="4"
                    placeholder={t('sliders.create.descriptionEnPlaceholder')}
                  />
                </div>
              </div>
            )}

            {/* Additional Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                {/* Link URL */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('sliders.create.linkUrl')}
                  </label>
                  <input
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('sliders.create.linkUrlPlaceholder')}
                  />
                </div>

                {/* Link Text - Arabic */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('sliders.create.linkTextAr')}
                  </label>
                  <input
                    type="text"
                    value={formData.linkTextAr}
                    onChange={(e) => setFormData({ ...formData, linkTextAr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('sliders.create.linkTextArPlaceholder')}
                    dir="rtl"
                  />
                </div>

                {/* Link Text - English */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('sliders.create.linkTextEn')}
                  </label>
                  <input
                    type="text"
                    value={formData.linkTextEn}
                    onChange={(e) => setFormData({ ...formData, linkTextEn: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('sliders.create.linkTextEnPlaceholder')}
                  />
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('sliders.create.displayOrder')}
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('sliders.create.displayOrderPlaceholder')}
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('sliders.create.displayOrderHint')}</p>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">{t('sliders.create.active')}</label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/stockship/admin/sliders')}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('sliders.create.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? t('sliders.create.creating') : t('sliders.create.createSlider')}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateSlider;

