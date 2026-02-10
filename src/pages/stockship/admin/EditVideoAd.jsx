import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Video, Image as ImageIcon, FileText, Settings, Upload, X, Loader2 } from 'lucide-react';
import showToast from '@/lib/toast';
import { uploadImage, uploadVideo } from '@/lib/imageUpload';

const EditVideoAd = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  
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

  useEffect(() => {
    fetchVideoAd();
  }, [id]);

  const fetchVideoAd = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getVideoAd(id);
      const data = response.data.data || response.data;
      setFormData({
        titleAr: data.titleAr || '',
        titleEn: data.titleEn || '',
        descriptionAr: data.descriptionAr || '',
        descriptionEn: data.descriptionEn || '',
        contentAr: data.contentAr || '',
        contentEn: data.contentEn || '',
        videoUrl: data.videoUrl || '',
        thumbnailUrl: data.thumbnailUrl || '',
        linkUrl: data.linkUrl || '',
        displayOrder: data.displayOrder || 0,
        isActive: data.isActive
      });
    } catch (error) {
      console.error('Error fetching video ad:', error);
      showToast.error(t('common.loadError'));
      navigate('/stockship/admin/video-ads');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingVideo(true);
      const url = await uploadVideo(file, language);
      if (url) setFormData({ ...formData, videoUrl: url });
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleThumbnailUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingThumbnail(true);
      const url = await uploadImage(file, 'video-thumbnail', language);
      if (url) setFormData({ ...formData, thumbnailUrl: url });
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await adminApi.updateVideoAd(id, formData);
      showToast.success(t('videoAds.edit.updatedSuccess'));
      navigate('/stockship/admin/video-ads');
    } catch (error) {
      console.error('Error updating video ad:', error);
      showToast.error(t('common.errorOccurred'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">{t('common.loading')}</div>;
  }

  const tabs = [
    { id: 'basic', label: t('videoAds.create.basicInfo'), icon: FileText },
    { id: 'video', label: t('videoAds.create.videoInfo'), icon: Video },
    { id: 'settings', label: t('common.settings'), icon: Settings }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/stockship/admin/video-ads')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold">{t('videoAds.edit.title')}</h1>
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
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-gray-600'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </span>
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
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                    <video key={formData.videoUrl} src={formData.videoUrl} controls className="w-full h-full" />
                  </div>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => handleVideoUpload(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo}
                    className="w-full py-2 border-2 border-dashed rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    {uploadingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {t('videoAds.create.uploadVideo')}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('videoAds.create.thumbnail')}</label>
                  {formData.thumbnailUrl && (
                    <div className="relative w-40 aspect-video rounded-lg overflow-hidden border mb-2">
                      <img src={formData.thumbnailUrl} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleThumbnailUpload(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={uploadingThumbnail}
                    className="text-primary text-sm font-medium"
                  >
                    {uploadingThumbnail ? t('common.uploading') : t('videoAds.create.uploadThumbnail')}
                  </button>
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
          <button type="submit" disabled={saving} className="px-6 py-2 bg-primary text-white rounded-lg flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('videoAds.edit.updateVideoAd')}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default EditVideoAd;
