import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { Search, Plus, Edit, Trash2, Eye, FolderTree } from 'lucide-react';
import { motion } from 'framer-motion';
import showToast from '@/lib/toast';

const AdminCategories = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getCategories({ includeInactive: true });
      const data = response.data.data || response.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showToast.error(t('mediation.categories.loadFailed') || 'Failed to load categories', t('mediation.categories.refreshPage') || 'Please refresh the page');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryDetails = async (id) => {
    try {
      const response = await adminApi.getCategory(id);
      setSelectedCategory(response.data.data || response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching category details:', error);
      alert(t('mediation.categories.loadDetailsFailed') || 'Failed to fetch category details');
    }
  };


  const handleDelete = async (id) => {
    if (!confirm(t('mediation.categories.deleteConfirm') || 'Are you sure you want to delete this category?')) return;
    try {
      await adminApi.deleteCategory(id);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(t('mediation.categories.deleteFailed') || 'Failed to delete category');
    }
  };

  const filteredCategories = categories.filter(cat => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cat.nameKey?.toLowerCase().includes(searchLower) ||
      cat.descriptionKey?.toLowerCase().includes(searchLower) ||
      cat.slug?.toLowerCase().includes(searchLower)
    );
  });

  const rootCategories = filteredCategories.filter(cat => !cat.parentId);
  const getCategoryTree = (parentId = null, level = 0) => {
    return filteredCategories
      .filter(cat => cat.parentId === parentId)
      .map(cat => ({
        ...cat,
        level,
        children: getCategoryTree(cat.id, level + 1)
      }));
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.categories.loading') || 'Loading categories...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('mediation.categories.title') || 'Categories Management'}</h1>
          <p className="text-muted-foreground mt-2">{t('mediation.categories.subtitle') || 'Manage product categories'}</p>
        </div>
        <button
          onClick={() => navigate('/stockship/admin/categories/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-5 h-5" />
          {t('mediation.categories.addCategory') || 'Add Category'}
        </button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('mediation.categories.searchPlaceholder') || 'Search categories...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('mediation.categories.categoriesList') || 'Categories List'} ({filteredCategories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('mediation.categories.noCategories') || 'No categories found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">{t('mediation.common.id') || 'ID'}</th>
                    <th className="text-left p-4">{t('mediation.common.name') || 'Name'}</th>
                    <th className="text-left p-4">{t('mediation.categories.parent') || 'Parent'}</th>
                    <th className="text-left p-4">{t('mediation.categories.level') || 'Level'}</th>
                    <th className="text-left p-4">{t('mediation.categories.products') || 'Products'}</th>
                    <th className="text-left p-4">{t('mediation.common.status') || 'Status'}</th>
                    <th className="text-left p-4">{t('mediation.common.actions') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{category.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FolderTree className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-semibold">{category.nameKey || 'N/A'}</div>
                            {category.slug && (
                              <div className="text-sm text-gray-500">/{category.slug}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {category.parent?.nameKey || t('mediation.categories.root') || 'Root'}
                      </td>
                      <td className="p-4">{category.level || 0}</td>
                      <td className="p-4">{category._count?.products || 0}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          category.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {category.isActive ? (t('mediation.common.active') || 'Active') : (t('mediation.common.inactive') || 'Inactive')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/stockship/admin/categories/${category.id}/view`)}
                            className="p-2 hover:bg-gray-100 rounded"
                            title={t('mediation.categories.viewDetails') || 'View Details'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/stockship/admin/categories/${category.id}/edit`)}
                            className="p-2 hover:bg-blue-100 rounded text-blue-600"
                            title={t('mediation.common.edit') || 'Edit'}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="p-2 hover:bg-red-100 rounded text-red-600"
                            title={t('mediation.common.delete') || 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {showDetailsModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{t('mediation.categories.categoryDetails') || 'Category Details'}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><strong>{t('mediation.common.id') || 'ID'}:</strong> {selectedCategory.id}</div>
              <div><strong>{t('mediation.categories.nameKey') || 'Name Key'}:</strong> {selectedCategory.nameKey}</div>
              <div><strong>{t('mediation.categories.slug') || 'Slug'}:</strong> {selectedCategory.slug || 'N/A'}</div>
              <div><strong>{t('mediation.categories.level') || 'Level'}:</strong> {selectedCategory.level || 0}</div>
              <div><strong>{t('mediation.categories.parent') || 'Parent'}:</strong> {selectedCategory.parent?.nameKey || (t('mediation.categories.root') || 'Root')}</div>
              <div><strong>{t('mediation.categories.displayOrder') || 'Display Order'}:</strong> {selectedCategory.displayOrder || 'N/A'}</div>
              <div><strong>{t('mediation.categories.productsCount') || 'Products Count'}:</strong> {selectedCategory._count?.products || 0}</div>
              <div><strong>{t('mediation.common.status') || 'Status'}:</strong> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  selectedCategory.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedCategory.isActive ? (t('mediation.common.active') || 'Active') : (t('mediation.common.inactive') || 'Inactive')}
                </span>
              </div>
              {selectedCategory.descriptionKey && (
                <div className="col-span-2">
                  <strong>{t('mediation.common.description') || 'Description'}:</strong> {selectedCategory.descriptionKey}
                </div>
              )}
              {selectedCategory.children && selectedCategory.children.length > 0 && (
                <div className="col-span-2">
                  <strong>{t('mediation.categories.subCategories') || 'Sub-categories'}:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {selectedCategory.children.map(child => (
                      <li key={child.id}>{child.nameKey}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  navigate(`/stockship/admin/categories/${selectedCategory.id}/edit`);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                {t('mediation.categories.editCategory') || 'Edit Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
