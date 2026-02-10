import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { Search, Plus, Edit, Trash2, Eye, Image } from 'lucide-react';
import { motion } from 'framer-motion';
import showToast from '@/lib/toast';

const AdminSliders = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlider, setSelectedSlider] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchSliders();
  }, []);

  const fetchSliders = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getSliders({ activeOnly: false });
      const data = response.data.data || response.data;
      setSliders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sliders:', error);
      showToast.error(t('sliders.loadFailed'), t('sliders.loadFailedDesc'));
    } finally {
      setLoading(false);
    }
  };

  const fetchSliderDetails = async (id) => {
    try {
      const response = await adminApi.getSlider(id);
      setSelectedSlider(response.data.data || response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching slider details:', error);
      showToast.error(t('sliders.view.loadFailed'), t('sliders.view.loadFailedDesc'));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('sliders.deleteConfirm'))) return;
    try {
      await adminApi.deleteSlider(id);
      showToast.success(t('sliders.deletedSuccess'));
      fetchSliders();
    } catch (error) {
      console.error('Error deleting slider:', error);
      showToast.error(t('sliders.deleteFailed'));
    }
  };

  const filteredSliders = sliders.filter(slider => {
    const searchLower = searchTerm.toLowerCase();
    return (
      slider.titleAr?.toLowerCase().includes(searchLower) ||
      slider.titleEn?.toLowerCase().includes(searchLower) ||
      slider.descriptionAr?.toLowerCase().includes(searchLower) ||
      slider.descriptionEn?.toLowerCase().includes(searchLower)
    );
  });

  if (loading && sliders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('sliders.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('sliders.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('sliders.subtitle')}</p>
        </div>
        <button
          onClick={() => navigate('/stockship/admin/sliders/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-5 h-5" />
          {t('sliders.addSlider')}
        </button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('sliders.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sliders List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sliders.list')} ({filteredSliders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSliders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('sliders.noSliders')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">{t('sliders.image')}</th>
                    <th className="text-left p-4">{t('sliders.titleLabel')}</th>
                    <th className="text-left p-4">{t('sliders.description')}</th>
                    <th className="text-left p-4">{t('sliders.order')}</th>
                    <th className="text-left p-4">{t('sliders.status')}</th>
                    <th className="text-left p-4">{t('sliders.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSliders.map((slider) => (
                    <motion.tr
                      key={slider.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                          {slider.imageUrl ? (
                            <img
                              src={slider.imageUrl}
                              alt={slider.imageAlt || slider.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold">{slider.titleAr || slider.titleEn || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{slider.titleEn || slider.titleAr}</div>
                        {slider.linkUrl && (
                          <div className="text-sm text-blue-600 mt-1">{slider.linkUrl}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {slider.descriptionAr || slider.descriptionEn || 'No description'}
                        </div>
                      </td>
                      <td className="p-4">{slider.displayOrder || 0}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          slider.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {slider.isActive ? t('sliders.active') : t('sliders.inactive')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/stockship/admin/sliders/${slider.id}/view`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={t('sliders.viewDetails')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/stockship/admin/sliders/${slider.id}/edit`)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title={t('common.edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(slider.id)}
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

      {/* Details Modal */}
      {showDetailsModal && selectedSlider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{t('sliders.view.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">{t('sliders.image')}</label>
                <div className="mt-2">
                  {selectedSlider.imageUrl ? (
                          <img
                            src={selectedSlider.imageUrl}
                            alt={selectedSlider.imageAlt || selectedSlider.titleAr || selectedSlider.titleEn}
                            className="w-full h-64 object-cover rounded-lg"
                          />
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Image className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t('sliders.view.titleAr')}</label>
                <p className="mt-1" dir="rtl">{selectedSlider.titleAr || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t('sliders.view.titleEn')}</label>
                <p className="mt-1">{selectedSlider.titleEn || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t('sliders.view.descriptionAr')}</label>
                <p className="mt-1" dir="rtl">{selectedSlider.descriptionAr || t('sliders.view.noDescription')}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t('sliders.view.descriptionEn')}</label>
                <p className="mt-1">{selectedSlider.descriptionEn || t('sliders.view.noDescription')}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t('sliders.view.linkUrl')}</label>
                <p className="mt-1">{selectedSlider.linkUrl || t('sliders.view.noLink')}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t('sliders.view.linkTextAr')}</label>
                <p className="mt-1" dir="rtl">{selectedSlider.linkTextAr || t('sliders.view.noLinkText')}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t('sliders.view.linkTextEn')}</label>
                <p className="mt-1">{selectedSlider.linkTextEn || t('sliders.view.noLinkText')}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t('sliders.view.displayOrder')}</label>
                <p className="mt-1">{selectedSlider.displayOrder || 0}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">{t('sliders.view.status')}</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedSlider.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedSlider.isActive ? t('sliders.active') : t('sliders.inactive')}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                {t('common.close')}
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminSliders;

