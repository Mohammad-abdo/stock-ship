import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Image as ImageIcon, FileText, Settings, Upload, X, Loader2 } from 'lucide-react';
import showToast from '@/lib/toast';
import { uploadImage } from '@/lib/imageUpload';

const EditSlider = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchSlider();
  }, [id]);

  const fetchSlider = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getSlider(id);
      const slider = response.data.data || response.data;
      
      setFormData({
        titleAr: slider.titleAr || '',
        titleEn: slider.titleEn || '',
        descriptionAr: slider.descriptionAr || '',
        descriptionEn: slider.descriptionEn || '',
        imageUrl: slider.imageUrl || '',
        imageAlt: slider.imageAlt || '',
        linkUrl: slider.linkUrl || '',
        linkTextAr: slider.linkTextAr || '',
        linkTextEn: slider.linkTextEn || '',
        displayOrder: slider.displayOrder || 0,
        isActive: slider.isActive !== undefined ? slider.isActive : true
      });

      // Set preview for existing image
      if (slider.imageUrl) {
        setImagePreview(slider.imageUrl);
      }
    } catch (error) {
      console.error('Error fetching slider:', error);
      showToast.error(t('sliders.edit.loadFailed'), error.response?.data?.message || t('sliders.edit.loadFailedDesc'));
      navigate('/stockship/admin/sliders');
    } finally {
      setLoading(false);
    }
  };

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

      console.log('Updating slider with data:', data);
      await adminApi.updateSlider(id, data);
      
      showToast.success(t('sliders.edit.updatedSuccess'), t('sliders.edit.updatedSuccessDesc'));
      navigate('/stockship/admin/sliders');
    } catch (error) {
      console.error('Error updating slider:', error);
      showToast.error(t('sliders.edit.updateFailed'), error.response?.data?.message || t('sliders.edit.updateFailedDesc'));
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'basic', label: t('sliders.create.basicInfo') || 'Basic Info', labelAr: 'المعلومات الأساسية', icon: FileText },
    { id: 'settings', label: t('sliders.create.additionalSettings') || 'Additional Settings', labelAr: 'الإعدادات الإضافية', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('sliders.edit.loading')}</p>
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
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/stockship/admin/sliders')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">{t('sliders.edit.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('sliders.edit.subtitle')}</p>
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
                    Slider Image *
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
                            <p className="text-sm text-gray-600">Uploading image...</p>
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
                                Upload Image
                              </button>
                              <p className="text-xs text-gray-500 mt-2">JPEG, PNG, WebP (Max 5MB)</p>
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
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                          title={t('sliders.edit.changeImage')}
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          title={t('sliders.edit.removeImage')}
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

                {/* Image Alt */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Image Alt Text
                  </label>
                  <input
                    type="text"
                    value={formData.imageAlt}
                    onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('sliders.create.imageAltPlaceholder') || 'Alternative text for image'}
                  />
                </div>

                {/* Title - Arabic */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title (Arabic) *
                  </label>
                  <input
                    type="text"
                    value={formData.titleAr}
                    onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="عنوان الشريحة"
                    required
                    dir="rtl"
                  />
                </div>

                {/* Title - English */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title (English) *
                  </label>
                  <input
                    type="text"
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('sliders.create.titleEnPlaceholder') || 'Slider Title'}
                    required
                  />
                </div>

                {/* Description - Arabic */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description (Arabic)
                  </label>
                  <textarea
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows="4"
                    placeholder="وصف الشريحة بالعربية"
                    dir="rtl"
                  />
                </div>

                {/* Description - English */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description (English)
                  </label>
                  <textarea
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows="4"
                    placeholder={t('sliders.create.descriptionEnPlaceholder') || 'Slider description'}
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
                    Link URL
                  </label>
                  <input
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://example.com/page"
                  />
                </div>

                {/* Link Text - Arabic */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Link Text (Arabic)
                  </label>
                  <input
                    type="text"
                    value={formData.linkTextAr}
                    onChange={(e) => setFormData({ ...formData, linkTextAr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="نص الرابط"
                    dir="rtl"
                  />
                </div>

                {/* Link Text - English */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Link Text (English)
                  </label>
                  <input
                    type="text"
                    value={formData.linkTextEn}
                    onChange={(e) => setFormData({ ...formData, linkTextEn: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('sliders.create.linkTextEnPlaceholder') || 'Link Text'}
                  />
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
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
                  <label htmlFor="isActive" className="text-sm font-medium">Active</label>
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
            {saving ? t('sliders.edit.updating') : t('sliders.edit.updateSlider')}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default EditSlider;
