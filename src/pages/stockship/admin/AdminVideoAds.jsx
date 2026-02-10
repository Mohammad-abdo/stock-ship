import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { Search, Plus, Edit, Trash2, Eye, Video, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import showToast from '@/lib/toast';

const AdminVideoAds = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [videoAds, setVideoAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAd, setSelectedAd] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchVideoAds();
  }, []);

  const fetchVideoAds = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getVideoAds({ activeOnly: false });
      const data = response.data.data || response.data;
      setVideoAds(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching video ads:', error);
      showToast.error(t('videoAds.loadFailed') || 'Failed to load video ads');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('videoAds.deleteConfirm') || 'Are you sure you want to delete this video ad?')) return;
    try {
      await adminApi.deleteVideoAd(id);
      showToast.success(t('videoAds.deletedSuccess') || 'Video ad deleted successfully');
      fetchVideoAds();
    } catch (error) {
      console.error('Error deleting video ad:', error);
      showToast.error(t('common.deleteError') || 'Failed to delete');
    }
  };

  const filteredAds = videoAds.filter(ad => {
    const searchLower = searchTerm.toLowerCase();
    return (
      ad.titleAr?.toLowerCase().includes(searchLower) ||
      ad.titleEn?.toLowerCase().includes(searchLower) ||
      ad.descriptionAr?.toLowerCase().includes(searchLower) ||
      ad.descriptionEn?.toLowerCase().includes(searchLower)
    );
  });

  if (loading && videoAds.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('videoAds.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('videoAds.subtitle')}</p>
        </div>
        <button
          onClick={() => navigate('/stockship/admin/video-ads/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-5 h-5" />
          {t('videoAds.addVideoAd')}
        </button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('videoAds.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Video Ads List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('videoAds.list')} ({filteredAds.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAds.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('videoAds.noVideoAds')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">{t('videoAds.video')}</th>
                    <th className="text-left p-4">{t('videoAds.titleLabel')}</th>
                    <th className="text-left p-4">{t('videoAds.description')}</th>
                    <th className="text-left p-4">{t('common.views') || 'Views'}</th>
                    <th className="text-left p-4">{t('videoAds.order')}</th>
                    <th className="text-left p-4">{t('videoAds.status')}</th>
                    <th className="text-left p-4">{t('videoAds.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAds.map((ad) => (
                    <motion.tr
                      key={ad.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <div className="w-32 aspect-video rounded-lg overflow-hidden bg-gray-100 relative group">
                          {ad.thumbnailUrl ? (
                            <img
                              src={ad.thumbnailUrl}
                              alt={ad.titleAr || ad.titleEn}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold">{ad.titleAr || ad.titleEn || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{ad.titleEn || ad.titleAr}</div>
                        {ad.linkUrl && (
                          <div className="text-sm text-blue-600 mt-1 truncate max-w-xs">{ad.linkUrl}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {ad.descriptionAr || ad.descriptionEn || 'No description'}
                        </div>
                      </td>
                      <td className="p-4">{ad.views || 0}</td>
                      <td className="p-4">{ad.displayOrder || 0}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ad.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {ad.isActive ? t('videoAds.active') : t('videoAds.inactive')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/stockship/admin/video-ads/${ad.id}/view`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={t('videoAds.viewDetails')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/stockship/admin/video-ads/${ad.id}/edit`)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title={t('common.edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ad.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminVideoAds;
