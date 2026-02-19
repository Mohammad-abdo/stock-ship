import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FolderTree,
  Package,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  User,
  ExternalLink,
} from 'lucide-react';
import showToast from '@/lib/toast';

const ViewCategory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [loading, setLoading] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [category, setCategory] = useState(null);
  const [offers, setOffers] = useState([]);
  const [expandedOffers, setExpandedOffers] = useState(new Set());

  useEffect(() => {
    fetchCategory();
  }, [id]);

  useEffect(() => {
    if (category?.id) {
      fetchOffers();
    }
  }, [category?.id]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getCategory(id);
      setCategory(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching category:', error);
      showToast.error(
        t('mediation.categories.loadCategoryFailed') || 'Failed to load category',
        error.response?.data?.message || t('mediation.categories.categoryNotFound') || 'Category not found'
      );
      navigate('/stockship/admin/categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchOffers = async () => {
    if (!category?.id) return;
    try {
      setLoadingOffers(true);
      const response = await adminApi.getCategoryOffers(category.id);
      const data = response.data?.data ?? response.data;
      setOffers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching category offers:', error);
      setOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  };

  const toggleOfferExpand = (offerId) => {
    setExpandedOffers((prev) => {
      const next = new Set(prev);
      if (next.has(offerId)) next.delete(offerId);
      else next.add(offerId);
      return next;
    });
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNumber = (n) => {
    if (n == null) return '—';
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US').format(n);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {t('mediation.categories.loadingDetails') || 'Loading category details...'}
          </p>
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
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/stockship/admin/categories')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </motion.button>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-3xl font-bold">
              {t('mediation.categories.categoryDetails') || 'Category Details'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('mediation.categories.viewCompleteInfo') || 'View complete category information'}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
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
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <FolderTree className="w-5 h-5" />
            {t('mediation.categories.basicInfo') || 'Basic Information'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">
                {t('mediation.categories.categoryId') || 'Category ID'}
              </label>
              <p className="text-lg font-semibold mt-1">#{category.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                {t('mediation.categories.nameKey') || 'Name Key'}
              </label>
              <p className="text-lg font-semibold mt-1">
                {category.nameKey ? t(category.nameKey) : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                {t('mediation.categories.slug') || 'Slug'}
              </label>
              <p className="text-lg font-semibold mt-1">{category.slug || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                {t('mediation.categories.parentCategory') || 'Parent Category'}
              </label>
              <p className="text-lg font-semibold mt-1">
                {category.parentId
                  ? `#${category.parentId}`
                  : t('mediation.categories.rootCategory') || 'Root Category'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                {t('mediation.categories.level') || 'Level'}
              </label>
              <p className="text-lg font-semibold mt-1">{category.level ?? 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                {t('mediation.categories.sortOrder') || 'Sort Order'}
              </label>
              <p className="text-lg font-semibold mt-1">{category.sortOrder ?? category.displayOrder ?? 0}</p>
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
            <p className="text-gray-700 whitespace-pre-wrap">
              {category.descriptionKey ? t(category.descriptionKey) : category.descriptionKey}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Status & Timestamps row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('mediation.categories.statusVisibility') || 'Status & Visibility'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {t('mediation.categories.isActive') || 'Is Active'}
                </label>
                <p className="text-lg font-semibold mt-1">
                  {category.isActive
                    ? t('mediation.categories.yes') || 'Yes'
                    : t('mediation.categories.no') || 'No'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {t('mediation.categories.isFeatured') || 'Is Featured'}
                </label>
                <p className="text-lg font-semibold mt-1">
                  {category.isFeatured
                    ? t('mediation.categories.yes') || 'Yes'
                    : t('mediation.categories.no') || 'No'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Calendar className="w-5 h-5" />
              {t('mediation.categories.timestamps') || 'Timestamps'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {t('mediation.categories.createdAt') || 'Created At'}
                </label>
                <p className="text-sm mt-1">{formatDate(category.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {t('mediation.categories.updatedAt') || 'Updated At'}
                </label>
                <p className="text-sm mt-1">{formatDate(category.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Related offers with products */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <FileText className="w-5 h-5" />
            {t('mediation.categories.relatedOffers') || 'Related offers'}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('mediation.categories.relatedOffersDesc') || 'Offers in this category with all their products'}
          </p>
        </CardHeader>
        <CardContent>
          {loadingOffers ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
            </div>
          ) : offers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {t('mediation.categories.noOffersInCategory') || 'No offers in this category'}
            </p>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => {
                const isExpanded = expandedOffers.has(offer.id);
                const items = offer.items || [];
                return (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border rounded-xl bg-gray-50/50 dark:bg-gray-900/30 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleOfferExpand(offer.id)}
                      className={`w-full flex flex-wrap items-center justify-between gap-4 p-4 text-left hover:bg-gray-100/80 dark:hover:bg-gray-800/50 transition-colors ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                    >
                      <div className={`flex flex-wrap items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {t('mediation.categories.offerNumber') || 'Offer'}: {offer.title || offer.id.slice(0, 8)}
                        </span>
                        {offer.trader && (
                          <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <User className="w-4 h-4" />
                            {offer.trader.companyName || offer.trader.traderCode || '—'}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            offer.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {offer.status || '—'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {items.length} {t('mediation.categories.products') || 'Products'}
                          {offer._count?.deals != null && ` · ${formatNumber(offer._count.deals)} ${t('mediation.categories.dealsCount') || 'Deals'}`}
                        </span>
                      </div>
                      <span className="p-1 rounded">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
                        <div className="p-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                            {t('mediation.categories.productsInOffer') || 'Products in this offer'}
                          </p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                  <th className={`py-2 font-medium text-gray-600 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    #
                                  </th>
                                  <th className={`py-2 font-medium text-gray-600 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('mediation.categories.productName') || 'Product name'}
                                  </th>
                                  <th className={`py-2 font-medium text-gray-600 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('mediation.categories.quantity') || 'Quantity'}
                                  </th>
                                  <th className={`py-2 font-medium text-gray-600 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('mediation.categories.unit') || 'Unit'}
                                  </th>
                                  <th className={`py-2 font-medium text-gray-600 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t('mediation.categories.unitPrice') || 'Unit price'}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item, idx) => (
                                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                                    <td className="py-2 text-gray-500">{idx + 1}</td>
                                    <td className={`py-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                                      {item.productName || '—'}
                                    </td>
                                    <td className="py-2">{formatNumber(item.quantity)}</td>
                                    <td className="py-2">{item.unit || '—'}</td>
                                    <td className="py-2">
                                      {item.unitPrice != null ? formatNumber(item.unitPrice) : '—'}
                                      {item.currency ? ` ${item.currency}` : ''}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className={`mt-4 flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/stockship/admin/offers/${offer.id}/view`);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                            >
                              <ExternalLink className="w-4 h-4" />
                              {t('mediation.categories.viewOffer') || 'View offer'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subcategories */}
      {category.subcategories && category.subcategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <FolderTree className="w-5 h-5" />
              {t('mediation.categories.subCategories') || 'Subcategories'} ({category.subcategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {category.subcategories.map((sub) => (
                <div key={sub.id} className="p-3 border rounded-lg">
                  <p className="font-semibold">{sub.nameKey ? t(sub.nameKey) : sub.nameKey}</p>
                  <p className="text-sm text-gray-500">ID: #{sub.id}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products count (if from API) */}
      {category._count?.products != null && (
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Package className="w-5 h-5" />
              {t('mediation.categories.products') || 'Products'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatNumber(category._count.products)} {t('mediation.categories.products') || 'Products'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('mediation.categories.totalProducts') || 'Total products in this category'}
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default ViewCategory;
