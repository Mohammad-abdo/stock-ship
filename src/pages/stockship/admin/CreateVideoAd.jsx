import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Video, Image as ImageIcon, FileText, Settings, Upload, X, Loader2 } from 'lucide-react';
import showToast from '@/lib/toast';
import { uploadImage, uploadVideo } from '@/lib/imageUpload';

const CreateVideoAd = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [formData, setFormData] = useState({
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    contentAr: '',
    contentEn: '',
    videoUrl: '',
    thumbnailUrl: '',
    linkUrl: '',
    displayOrder: 0,
    isActive: true
  });

  const handleVideoUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      showToast.error(t('common.invalidFile') || 'Invalid file type');
      return;
    }

    try {
      setUploadingVideo(true);
      const url = await uploadVideo(file, language);
      if (url) {
        setFormData({ ...formData, videoUrl: url });
        setVideoPreview(url);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleThumbnailUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast.error(t('common.invalidFile') || 'Invalid file type');
      return;
    }

    try {
      setUploadingThumbnail(true);
      const url = await uploadImage(file, 'video-thumbnail', language);
      if (url) {
        setFormData({ ...formData, thumbnailUrl: url });
        setThumbnailPreview(url);
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titleAr || !formData.titleEn) {
      showToast.error(t('videoAds.create.titleRequired'));
      setActiveTab('basic');
      return;
    }

    if (!formData.videoUrl) {
      showToast.error(t('videoAds.create.videoRequired'));
      setActiveTab('basic');
      return;
    }

    try {
      setSaving(true);
      await adminApi.createVideoAd(formData);
      showToast.success(t('videoAds.create.createdSuccess'));
      navigate('/stockship/admin/video-ads');
    } catch (error) {
      console.error('Error creating video ad:', error);
      showToast.error(t('common.errorOccurred'));
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'basic', label: t('videoAds.create.basicInfo') || 'Basic Info', icon: FileText },
    { id: 'video', label: t('videoAds.create.videoInfo') || 'Video Info', icon: Video },
    { id: 'settings', label: t('common.settings') || 'Settings', icon: Settings }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/stockship/admin/video-ads')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">{t('videoAds.create.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('videoAds.create.subtitle')}</p>
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
                    activeTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-gray-600 hover:text-primary'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('videoAds.create.titleAr')} *</label>
                    <input
                      type="text"
                      value={formData.titleAr}
                      onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      dir="rtl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('videoAds.create.titleEn')} *</label>
                    <input
                      type="text"
                      value={formData.titleEn}
                      onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('videoAds.create.descriptionAr')}</label>
                  <textarea
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('videoAds.create.descriptionEn')}</label>
                  <textarea
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('videoAds.create.contentAr')}</label>
                  <textarea
                    value={formData.contentAr}
                    onChange={(e) => setFormData({ ...formData, contentAr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="6"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('videoAds.create.contentEn')}</label>
                  <textarea
                    value={formData.contentEn}
                    onChange={(e) => setFormData({ ...formData, contentEn: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="6"
                  />
                </div>
              </div>
            )}

            {activeTab === 'video' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('videoAds.create.videoUrl')} *</label>
                  {!formData.videoUrl ? (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center bg-gray-50">
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleVideoUpload(e.target.files?.[0])}
                      />
                      {uploadingVideo ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <p>{t('videoAds.create.uploading')}</p>
                        </div>
                      ) : (
                        <button type="button" onClick={() => videoInputRef.current?.click()} className="flex flex-col items-center gap-2 mx-auto">
                          <Upload className="w-10 h-10 text-gray-400" />
                          <span className="text-primary font-medium">{t('videoAds.create.uploadVideo')}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <video src={formData.videoUrl} controls className="w-full h-full" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, videoUrl: '' })}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('videoAds.create.thumbnail')}</label>
                  {!formData.thumbnailUrl ? (
                    <div className="border-2 border-dashed rounded-lg p-4 text-center bg-gray-50">
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleThumbnailUpload(e.target.files?.[0])}
                      />
                      {uploadingThumbnail ? (
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      ) : (
                        <button type="button" onClick={() => thumbnailInputRef.current?.click()} className="text-primary text-sm font-medium">
                          {t('videoAds.create.uploadThumbnail')}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="relative w-40 aspect-video rounded-lg overflow-hidden border">
                      <img src={formData.thumbnailUrl} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, thumbnailUrl: '' })}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('videoAds.create.linkUrl')}</label>
                  <input
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('videoAds.create.displayOrder')}</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">{t('videoAds.create.active')}</label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/stockship/admin/video-ads')} className="px-6 py-2 border rounded-lg">
            {t('videoAds.create.cancel')}
          </button>
          <button type="submit" disabled={saving || uploadingVideo} className="px-6 py-2 bg-primary text-white rounded-lg flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('videoAds.create.createVideoAd')}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateVideoAd;
