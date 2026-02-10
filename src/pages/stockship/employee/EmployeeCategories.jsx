import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import mediationApi from '@/lib/mediationApi';
import { Search, Plus, Edit, Trash2, Eye, FolderTree } from 'lucide-react';
import { motion } from 'framer-motion';
import showToast from '@/lib/toast';

const EmployeeCategories = () => {
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
      const response = await mediationApi.categories.getAll({ includeInactive: true });
      const data = response.data.data || response.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showToast.error('Failed to load categories', 'Please refresh the page');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryDetails = async (id) => {
    try {
      const response = await mediationApi.categories.getById(id);
      setSelectedCategory(response.data.data || response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching category details:', error);
      alert('Failed to fetch category details');
    }
  };


  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await mediationApi.categories.delete(id);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
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
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories Management</h1>
          <p className="text-muted-foreground mt-2">Manage product categories</p>
        </div>
        <button
          onClick={() => navigate('/stockship/employee/categories/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search categories..."
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
          <CardTitle>Categories List ({filteredCategories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No categories found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">ID</th>
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Parent</th>
                    <th className="text-left p-4">Level</th>
                    <th className="text-left p-4">Products</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
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
                        {category.parent?.nameKey || 'Root'}
                      </td>
                      <td className="p-4">{category.level || 0}</td>
                      <td className="p-4">{category._count?.products || 0}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          category.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/stockship/employee/categories/${category.id}/view`)}
                            className="p-2 hover:bg-gray-100 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/stockship/employee/categories/${category.id}/edit`)}
                            className="p-2 hover:bg-blue-100 rounded text-blue-600"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="p-2 hover:bg-red-100 rounded text-red-600"
                            title="Delete"
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
              <h2 className="text-2xl font-bold">Category Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><strong>ID:</strong> {selectedCategory.id}</div>
              <div><strong>Name Key:</strong> {selectedCategory.nameKey}</div>
              <div><strong>Slug:</strong> {selectedCategory.slug || 'N/A'}</div>
              <div><strong>Level:</strong> {selectedCategory.level || 0}</div>
              <div><strong>Parent:</strong> {selectedCategory.parent?.nameKey || 'Root'}</div>
              <div><strong>Display Order:</strong> {selectedCategory.displayOrder || 'N/A'}</div>
              <div><strong>Products Count:</strong> {selectedCategory._count?.products || 0}</div>
              <div><strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  selectedCategory.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedCategory.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {selectedCategory.descriptionKey && (
                <div className="col-span-2">
                  <strong>Description:</strong> {selectedCategory.descriptionKey}
                </div>
              )}
              {selectedCategory.children && selectedCategory.children.length > 0 && (
                <div className="col-span-2">
                  <strong>Sub-categories:</strong>
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
                  navigate(`/stockship/employee/categories/${selectedCategory.id}/edit`);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Edit Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeCategories;
