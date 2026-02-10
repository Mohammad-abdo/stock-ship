import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Video, Eye, Calendar, ExternalLink, Settings, FileText, Layout, Heart, MousePointer, MessageCircle, TrendingUp } from 'lucide-react';
import showToast from '@/lib/toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url.startsWith('/') ? `${API_BASE}${url}` : `${API_BASE}/${url}`;
};

const AdminVideoAdDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [videoAd, setVideoAd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideoAd();
  }, [id]);

  const fetchVideoAd = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getVideoAd(id, { incrementView: 'false' });
      const data = response.data.data || response.data;
      setVideoAd(data);
    } catch (error) {
      console.error('Error fetching video ad details:', error);
      showToast.error(t('common.loadError'));
      navigate('/stockship/admin/video-ads');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">{t('common.loading')}</div>;
  }

  if (!videoAd) {
    return <div className="p-6 text-center text-red-500">{t('common.notFound')}</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/stockship/admin/video-ads')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">{t('videoAds.viewDetails')}</h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' ? videoAd.titleAr : videoAd.titleEn}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/stockship/admin/video-ads/${videoAd.id}/edit`)}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            {t('common.edit')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                {t('videoAds.video')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner">
                <video
                  src={getMediaUrl(videoAd.videoUrl)}
                  poster={getMediaUrl(videoAd.thumbnailUrl)}
                  controls
                  className="w-full h-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t('videoAds.create.basicInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {t('videoAds.create.titleAr')}
                  </h4>
                  <p className="text-lg font-medium" dir="rtl">{videoAd.titleAr}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {t('videoAds.create.titleEn')}
                  </h4>
                  <p className="text-lg font-medium">{videoAd.titleEn}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {t('videoAds.create.descriptionAr')}
                  </h4>
                  <p className="text-gray-700" dir="rtl">{videoAd.descriptionAr || t('common.none')}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {t('videoAds.create.descriptionEn')}
                  </h4>
                  <p className="text-gray-700">{videoAd.descriptionEn || t('common.none')}</p>
                </div>
              </div>

              <div className="space-y-6 pt-4 border-t">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {t('videoAds.create.contentAr')}
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-xl text-gray-700 whitespace-pre-line leading-relaxed" dir="rtl">
                    {videoAd.contentAr || t('common.none')}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {t('videoAds.create.contentEn')}
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-xl text-gray-700 whitespace-pre-line leading-relaxed">
                    {videoAd.contentEn || t('common.none')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                {t('common.statistics')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Eye className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{t('common.views') || 'Views'}</span>
                </div>
                <span className="text-xl font-bold text-blue-700">{videoAd.views || 0}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg text-red-600">
                    <Heart className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{t('videoAds.likes') || 'Likes'}</span>
                </div>
                <span className="text-xl font-bold text-red-700">{videoAd.likes ?? 0}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <MousePointer className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{t('videoAds.linkClicks') || 'Link Clicks'}</span>
                </div>
                <span className="text-xl font-bold text-amber-700">{videoAd.linkClicks ?? 0}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-teal-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 rounded-lg text-teal-600">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{t('videoAds.comments') || 'Comments'}</span>
                </div>
                <span className="text-xl font-bold text-teal-700">{videoAd.commentsCount ?? 0}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{t('videoAds.reachLevel') || 'Reach Level'}</span>
                </div>
                <span className="text-xl font-bold text-indigo-700">
                  {(() => {
                    const v = videoAd.views || 0;
                    const l = videoAd.likes ?? 0;
                    const c = videoAd.commentsCount ?? 0;
                    const score = v + l * 2 + c * 3;
                    if (score >= 1000) return 'High';
                    if (score >= 100) return 'Medium';
                    return 'Low';
                  })()}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <Layout className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{t('videoAds.order')}</span>
                </div>
                <span className="text-xl font-bold text-purple-700">{videoAd.displayOrder || 0}</span>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span className="text-gray-500">{t('common.status')}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    videoAd.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {videoAd.isActive ? t('videoAds.active') : t('videoAds.inactive')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{t('common.createdAt')}</span>
                  <span className="font-medium">{new Date(videoAd.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Link Info */}
          {videoAd.linkUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-primary" />
                  {t('videoAds.create.linkUrl')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={videoAd.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-gray-50 rounded-lg text-blue-600 hover:text-blue-800 break-all text-sm underline"
                >
                  {videoAd.linkUrl}
                </a>
              </CardContent>
            </Card>
          )}

          {/* Thumbnail */}
          {videoAd.thumbnailUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  {t('videoAds.create.thumbnail')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-lg overflow-hidden border">
                  <img src={getMediaUrl(videoAd.thumbnailUrl)} className="w-full h-full object-cover" alt="Thumbnail" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminVideoAdDetails;
