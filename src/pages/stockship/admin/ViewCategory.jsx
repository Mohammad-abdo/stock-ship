import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, FolderTree, Package, Calendar } from 'lucide-react';
import showToast from '@/lib/toast';

const ViewCategory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);

  useEffect(() => {
    fetchCategory();
  }, [id]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getCategory(id);
      setCategory(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching category:', error);
      showToast.error(t('mediation.categories.loadCategoryFailed') || 'Failed to load category', error.response?.data?.message || t('mediation.categories.categoryNotFound') || 'Category not found');
      navigate('/stockship/admin/categories');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.categories.loadingDetails') || 'Loading category details...'}</p>
        </div>
      </div>
    );
  }

  if (!category) {
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
            onClick={() => navigate('/stockship/admin/categories')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold">{t('mediation.categories.categoryDetails') || 'Category Details'}</h1>
            <p className="text-muted-foreground mt-2">{t('mediation.categories.viewCompleteInfo') || 'View complete category information'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/stockship/admin/categories/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Edit className="w-4 h-4" />
            {t('mediation.common.edit') || 'Edit'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/stockship/admin/categories/${id}/delete`)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" />
            {t('mediation.common.delete') || 'Delete'}
          </motion.button>
        </div>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="w-5 h-5" />
            {t('mediation.categories.basicInfo') || 'Basic Information'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">{t('mediation.categories.categoryId') || 'Category ID'}</label>
              <p className="text-lg font-semibold mt-1">#{category.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('mediation.categories.nameKey') || 'Name Key'}</label>
              <p className="text-lg font-semibold mt-1">{category.nameKey || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('mediation.categories.slug') || 'Slug'}</label>
              <p className="text-lg font-semibold mt-1">{category.slug || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('mediation.categories.parentCategory') || 'Parent Category'}</label>
              <p className="text-lg font-semibold mt-1">
                {category.parentId ? `#${category.parentId}` : (t('mediation.categories.rootCategory') || 'Root Category')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('mediation.categories.level') || 'Level'}</label>
              <p className="text-lg font-semibold mt-1">{category.level || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">{t('mediation.categories.sortOrder') || 'Sort Order'}</label>
              <p className="text-lg font-semibold mt-1">{category.sortOrder || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {category.descriptionKey && (
        <Card>
          <CardHeader>
            <CardTitle>{t('mediation.common.description') || 'Description'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{category.descriptionKey}</p>
          </CardContent>
        </Card>
      )}

      {/* Additional Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('mediation.categories.statusVisibility') || 'Status & Visibility'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('mediation.categories.isActive') || 'Is Active'}</label>
                <p className="text-lg font-semibold mt-1">
                  {category.isActive ? (t('mediation.categories.yes') || 'Yes') : (t('mediation.categories.no') || 'No')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('mediation.categories.isFeatured') || 'Is Featured'}</label>
                <p className="text-lg font-semibold mt-1">
                  {category.isFeatured ? (t('mediation.categories.yes') || 'Yes') : (t('mediation.categories.no') || 'No')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {t('mediation.categories.timestamps') || 'Timestamps'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('mediation.categories.createdAt') || 'Created At'}</label>
                <p className="text-sm mt-1">
                  {category.createdAt ? new Date(category.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('mediation.categories.updatedAt') || 'Updated At'}</label>
                <p className="text-sm mt-1">
                  {category.updatedAt ? new Date(category.updatedAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subcategories */}
      {category.subcategories && category.subcategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="w-5 h-5" />
              {t('mediation.categories.subCategories') || 'Subcategories'} ({category.subcategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {category.subcategories.map((sub) => (
                <div key={sub.id} className="p-3 border rounded-lg">
                  <p className="font-semibold">{sub.nameKey}</p>
                  <p className="text-sm text-gray-500">ID: #{sub.id}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Count */}
      {category._count && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {t('mediation.categories.products') || 'Products'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{category._count.products || 0} {t('mediation.categories.products') || 'Products'}</p>
            <p className="text-sm text-gray-500 mt-1">{t('mediation.categories.totalProducts') || 'Total products in this category'}</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default ViewCategory;


