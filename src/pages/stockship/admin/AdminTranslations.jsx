import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, Globe, Key, FileText, Filter } from 'lucide-react';
import showToast from '@/lib/toast';

const AdminTranslations = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [translations, setTranslations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [namespaceFilter, setNamespaceFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    key: '',
    namespace: '',
    entityType: '',
    entityId: '',
    fieldName: '',
    isSystem: false
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchTranslations();
  }, [pagination.page, namespaceFilter, entityTypeFilter]);

  const fetchTranslations = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(namespaceFilter && { namespace: namespaceFilter }),
        ...(entityTypeFilter && { entityType: entityTypeFilter }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await adminApi.getAllTranslationKeys(params);
      const data = response.data?.data || response.data || [];
      setTranslations(Array.isArray(data) ? data : []);
      if (response.data?.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      } else if (response.data?.total) {
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0,
          pages: Math.ceil((response.data.total || 0) / pagination.limit)
        }));
      }
    } catch (error) {
      console.error('Error fetching translations:', error);
      showToast.error('Failed to fetch translations', error.response?.data?.message || 'Please try again');
      setTranslations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      key: '',
      namespace: '',
      entityType: '',
      entityId: '',
      fieldName: '',
      isSystem: false
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        entityId: formData.entityId ? parseInt(formData.entityId) : null
      };
      await adminApi.createTranslation({ key: data.key, namespace: data.namespace, entityType: data.entityType, entityId: data.entityId, fieldName: data.fieldName, isSystem: data.isSystem });
      showToast.success('Translation created', 'The translation key has been created');
      setShowModal(false);
      fetchTranslations();
    } catch (error) {
      console.error('Error creating translation:', error);
      showToast.error('Failed to create translation', error.response?.data?.message || 'Please try again');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this translation?')) return;
    try {
      await adminApi.deleteTranslation(translation.key);
      showToast.success('Translation deleted', 'The translation has been deleted');
      fetchTranslations();
    } catch (error) {
      console.error('Error deleting translation:', error);
      showToast.error('Failed to delete translation', error.response?.data?.message || 'Please try again');
    }
  };

  const namespaces = [...new Set(translations.map(t => t.namespace).filter(Boolean))];
  const entityTypes = [...new Set(translations.map(t => t.entityType).filter(Boolean))];

  const filteredTranslations = translations.filter(translation =>
    translation.key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    translation.namespace?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && translations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading translations...</p>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Translations Management</h1>
          <p className="text-muted-foreground mt-2">Manage platform translations and multilingual content</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-5 h-5" />
          Add Translation Key
        </motion.button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search translations..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={namespaceFilter}
              onChange={(e) => {
                setNamespaceFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Namespaces</option>
              {namespaces.map(ns => (
                <option key={ns} value={ns}>{ns}</option>
              ))}
            </select>
            <select
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Entity Types</option>
              {entityTypes.map(et => (
                <option key={et} value={et}>{et}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setNamespaceFilter('');
                setEntityTypeFilter('');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Translations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Translations List ({pagination.total || filteredTranslations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTranslations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No translations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">ID</th>
                    <th className="text-left p-4">Key</th>
                    <th className="text-left p-4">Namespace</th>
                    <th className="text-left p-4">Entity Type</th>
                    <th className="text-left p-4">Entity ID</th>
                    <th className="text-left p-4">Field Name</th>
                    <th className="text-left p-4">System</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTranslations.map((translation, index) => (
                    <motion.tr
                      key={translation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-4">{translation.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-gray-400" />
                          <span className="font-mono text-sm">{translation.key || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span>{translation.namespace || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">{translation.entityType || 'N/A'}</td>
                      <td className="p-4">{translation.entityId || 'N/A'}</td>
                      <td className="p-4">{translation.fieldName || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          translation.isSystem 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {translation.isSystem ? 'System' : 'User'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/stockship/admin/translations/${translation.id}/edit`)}
                            className="p-2 hover:bg-blue-100 rounded text-blue-600"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {!translation.isSystem && (
                            <button
                              onClick={() => handleDelete(translation.id)}
                              className="p-2 hover:bg-red-100 rounded text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create Translation Key</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Key *</label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                    placeholder="e.g., product.name.123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Namespace *</label>
                  <input
                    type="text"
                    value={formData.namespace}
                    onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                    placeholder="e.g., product, category"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Entity Type</label>
                  <input
                    type="text"
                    value={formData.entityType}
                    onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Product, Category"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Entity ID</label>
                  <input
                    type="number"
                    value={formData.entityId}
                    onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Entity ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Field Name</label>
                  <input
                    type="text"
                    value={formData.fieldName}
                    onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., name, description"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isSystem"
                    checked={formData.isSystem}
                    onChange={(e) => setFormData({ ...formData, isSystem: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isSystem" className="text-sm">System Translation</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminTranslations;
