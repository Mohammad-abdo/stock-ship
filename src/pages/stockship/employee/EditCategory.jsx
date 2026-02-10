import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import mediationApi from '@/lib/mediationApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, FolderTree, Languages, Image as ImageIcon, Search, Settings } from 'lucide-react';
import showToast from '@/lib/toast';

const EditCategory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    nameKey: '',
    nameAr: '',
    nameEn: '',
    descriptionKey: '',
    descriptionAr: '',
    descriptionEn: '',
    icon: '',
    imageUrl: '',
    parentId: '',
    level: 0,
    displayOrder: '',
    isActive: true,
    slug: '',
    metaTitleKey: '',
    metaTitleAr: '',
    metaTitleEn: '',
    metaDescriptionKey: '',
    metaDescriptionAr: '',
    metaDescriptionEn: '',
    metaKeywords: '',
    canonicalUrl: '',
    ogTitleKey: '',
    ogTitleAr: '',
    ogTitleEn: '',
    ogDescriptionKey: '',
    ogDescriptionAr: '',
    ogDescriptionEn: '',
    ogImage: '',
    twitterCardTitleKey: '',
    twitterCardTitleAr: '',
    twitterCardTitleEn: '',
    twitterCardDescriptionKey: '',
    twitterCardDescriptionAr: '',
    twitterCardDescriptionEn: '',
    twitterCardImage: '',
    structuredData: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchCategory();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await mediationApi.categories.getAll();
      const data = response.data.data || response.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showToast.error('Failed to load categories', 'Please refresh the page');
    }
  };

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const response = await mediationApi.categories.getById(id);
      const category = response.data.data || response.data;
      
      // Set form data with translations
      setFormData({
        nameKey: category.nameKey || '',
        nameAr: category.nameAr || '',
        nameEn: category.nameEn || '',
        descriptionKey: category.descriptionKey || '',
        descriptionAr: category.descriptionAr || '',
        descriptionEn: category.descriptionEn || '',
        icon: category.icon || '',
        imageUrl: category.imageUrl || '',
        parentId: category.parentId?.toString() || '',
        level: category.level || 0,
        displayOrder: category.displayOrder?.toString() || '',
        isActive: category.isActive !== undefined ? category.isActive : true,
        slug: category.slug || '',
        metaTitleKey: category.metaTitleKey || '',
        metaTitleAr: category.metaTitleAr || '',
        metaTitleEn: category.metaTitleEn || '',
        metaDescriptionKey: category.metaDescriptionKey || '',
        metaDescriptionAr: category.metaDescriptionAr || '',
        metaDescriptionEn: category.metaDescriptionEn || '',
        metaKeywords: category.metaKeywords || '',
        canonicalUrl: category.canonicalUrl || '',
        ogTitleKey: category.ogTitleKey || '',
        ogTitleAr: category.ogTitleAr || '',
        ogTitleEn: category.ogTitleEn || '',
        ogDescriptionKey: category.ogDescriptionKey || '',
        ogDescriptionAr: category.ogDescriptionAr || '',
        ogDescriptionEn: category.ogDescriptionEn || '',
        ogImage: category.ogImage || '',
        twitterCardTitleKey: category.twitterCardTitleKey || '',
        twitterCardTitleAr: category.twitterCardTitleAr || '',
        twitterCardTitleEn: category.twitterCardTitleEn || '',
        twitterCardDescriptionKey: category.twitterCardDescriptionKey || '',
        twitterCardDescriptionAr: category.twitterCardDescriptionAr || '',
        twitterCardDescriptionEn: category.twitterCardDescriptionEn || '',
        twitterCardImage: category.twitterCardImage || '',
        structuredData: category.structuredData || ''
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      showToast.error('Failed to load category', error.response?.data?.message || 'Category not found');
      navigate('/stockship/employee/categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.nameAr || !formData.nameEn) {
      showToast.error('Name is required', 'Please provide category name in both Arabic and English');
      setActiveTab('translations');
      return;
    }

    // Generate slug from nameEn if not provided
    if (!formData.slug && formData.nameEn) {
      formData.slug = formData.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    if (!formData.slug) {
      showToast.error('Slug is required', 'Please provide a slug for the category');
      setActiveTab('basic');
      return;
    }

    try {
      setSaving(true);
      const data = {
        ...formData,
        level: formData.parentId ? (categories.find(c => c.id === parseInt(formData.parentId))?.level || 0) + 1 : 0,
        displayOrder: formData.displayOrder ? parseInt(formData.displayOrder) : 0,
        parentId: formData.parentId ? parseInt(formData.parentId) : null
      };

      // Ensure translation fields are sent
      if (data.nameAr === undefined) data.nameAr = formData.nameAr || '';
      if (data.nameEn === undefined) data.nameEn = formData.nameEn || '';
      if (data.descriptionAr === undefined) data.descriptionAr = formData.descriptionAr || '';
      if (data.descriptionEn === undefined) data.descriptionEn = formData.descriptionEn || '';

      console.log('Updating category with data:', data);
      await mediationApi.categories.update(id, data);
      
      showToast.success('Category updated successfully', 'The category has been updated');
      navigate('/stockship/employee/categories');
    } catch (error) {
      console.error('Error updating category:', error);
      showToast.error('Failed to update category', error.response?.data?.message || 'Please try again');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', labelAr: 'المعلومات الأساسية', icon: FolderTree },
    { id: 'translations', label: 'Translations', labelAr: 'الترجمات', icon: Languages },
    { id: 'seo', label: 'SEO', labelAr: 'تحسين محركات البحث', icon: Search },
    { id: 'social', label: 'Social Media', labelAr: 'وسائل التواصل', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading category...</p>
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
          onClick={() => navigate('/stockship/employee/categories')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Edit Category</h1>
          <p className="text-muted-foreground mt-1">Update category information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tabs */}
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
                  <span>{t('language') === 'ar' ? tab.labelAr : tab.label}</span>
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Slug *</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="category-slug"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Parent Category</label>
                    <select
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Root Category</option>
                      {categories
                        .filter(cat => cat.id !== parseInt(id))
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nameKey || `Category ${cat.id}`}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Display Order</label>
                    <input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Icon</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="folder"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Image URL</label>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
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

            {/* Translations Tab */}
            {activeTab === 'translations' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category Name (Arabic) *
                  </label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="اسم الفئة"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category Name (English) *
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Category Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description (Arabic)
                  </label>
                  <textarea
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows="4"
                    placeholder="وصف الفئة بالعربية"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description (English)
                  </label>
                  <textarea
                    value={formData.descriptionEn}
                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows="4"
                    placeholder="Category description"
                  />
                </div>
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Meta Keywords</label>
                  <input
                    type="text"
                    value={formData.metaKeywords}
                    onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Canonical URL</label>
                  <input
                    type="text"
                    value={formData.canonicalUrl}
                    onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="/categories/category-slug"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Structured Data (JSON-LD)</label>
                  <textarea
                    value={formData.structuredData}
                    onChange={(e) => setFormData({ ...formData, structuredData: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    rows="6"
                    placeholder='{"@context": "https://schema.org", ...}'
                  />
                </div>
              </div>
            )}

            {/* Social Media Tab */}
            {activeTab === 'social' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">OG Title (Arabic)</label>
                    <input
                      type="text"
                      value={formData.ogTitleAr}
                      onChange={(e) => setFormData({ ...formData, ogTitleAr: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">OG Title (English)</label>
                    <input
                      type="text"
                      value={formData.ogTitleEn}
                      onChange={(e) => setFormData({ ...formData, ogTitleEn: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">OG Description (Arabic)</label>
                    <textarea
                      value={formData.ogDescriptionAr}
                      onChange={(e) => setFormData({ ...formData, ogDescriptionAr: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      rows="2"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">OG Description (English)</label>
                    <textarea
                      value={formData.ogDescriptionEn}
                      onChange={(e) => setFormData({ ...formData, ogDescriptionEn: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      rows="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">OG Image URL</label>
                    <input
                      type="text"
                      value={formData.ogImage}
                      onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://example.com/og-image.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Twitter Card Image URL</label>
                    <input
                      type="text"
                      value={formData.twitterCardImage}
                      onChange={(e) => setFormData({ ...formData, twitterCardImage: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://example.com/twitter-card.jpg"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/stockship/employee/categories')}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Updating...' : 'Update Category'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default EditCategory;
