import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, Image as ImageIcon, Calendar, ExternalLink } from 'lucide-react';
import showToast from '@/lib/toast';

const ViewSlider = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [slider, setSlider] = useState(null);

  useEffect(() => {
    fetchSlider();
  }, [id]);

  const fetchSlider = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getSlider(id);
      setSlider(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching slider:', error);
      showToast.error(t('sliders.view.loadFailed'), error.response?.data?.message || t('sliders.view.loadFailedDesc'));
      navigate('/stockship/admin/sliders');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('sliders.view.deleteConfirm'))) return;
    try {
      await adminApi.deleteSlider(id);
      showToast.success(t('sliders.view.deletedSuccess'));
      navigate('/stockship/admin/sliders');
    } catch (error) {
      console.error('Error deleting slider:', error);
      showToast.error(t('sliders.view.deleteFailed'), error.response?.data?.message || t('sliders.view.deleteFailedDesc'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('sliders.view.loading')}</p>
        </div>
      </div>
    );
  }

  if (!slider) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/stockship/admin/sliders')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold">{t('sliders.view.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('sliders.view.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/stockship/admin/sliders/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Edit className="w-4 h-4" />
            {t('common.edit')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" />
            {t('common.delete')}
          </motion.button>
        </div>
      </div>

      {/* Image Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            {t('sliders.image')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <img
              src={slider.imageUrl}
              alt={slider.imageAlt || slider.titleAr || slider.titleEn}
              className="w-full h-96 object-cover rounded-lg border"
            />
          </div>
          {slider.imageAlt && (
            <p className="text-sm text-gray-500 mt-2">{t('sliders.view.altText')}: {slider.imageAlt}</p>
          )}
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
            <CardTitle>{t('sliders.view.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">{t('sliders.view.sliderId')}</label>
              <p className="text-lg font-semibold mt-1">#{slider.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('sliders.view.displayOrder')}</label>
              <p className="text-lg font-semibold mt-1">{slider.displayOrder || 0}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-500">{t('sliders.view.titleAr')}</label>
              <p className="text-lg font-semibold mt-1" dir="rtl">{slider.titleAr || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-500">{t('sliders.view.titleEn')}</label>
              <p className="text-lg font-semibold mt-1">{slider.titleEn || 'N/A'}</p>
            </div>
            {slider.descriptionAr && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500">{t('sliders.view.descriptionAr')}</label>
                <p className="text-gray-700 mt-1 whitespace-pre-wrap" dir="rtl">{slider.descriptionAr}</p>
              </div>
            )}
            {slider.descriptionEn && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500">{t('sliders.view.descriptionEn')}</label>
                <p className="text-gray-700 mt-1 whitespace-pre-wrap">{slider.descriptionEn}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Link Information */}
      {(slider.linkUrl || slider.linkTextAr || slider.linkTextEn) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              {t('sliders.view.linkInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {slider.linkUrl && (
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('sliders.view.linkUrl')}</label>
                  <div className="mt-1">
                    <a
                      href={slider.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-2"
                    >
                      {slider.linkUrl}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
              {slider.linkTextAr && (
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('sliders.view.linkTextAr')}</label>
                  <p className="text-lg font-semibold mt-1" dir="rtl">{slider.linkTextAr}</p>
                </div>
              )}
              {slider.linkTextEn && (
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('sliders.view.linkTextEn')}</label>
                  <p className="text-lg font-semibold mt-1">{slider.linkTextEn}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status & Timestamps */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('sliders.view.status')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('sliders.view.isActive')}</label>
                <p className="text-lg font-semibold mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    slider.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {slider.isActive ? t('sliders.active') : t('sliders.inactive')}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {t('sliders.view.timestamps')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('sliders.view.createdAt')}</label>
                <p className="text-sm mt-1">
                  {slider.createdAt ? new Date(slider.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('sliders.view.updatedAt')}</label>
                <p className="text-sm mt-1">
                  {slider.updatedAt ? new Date(slider.updatedAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default ViewSlider;

