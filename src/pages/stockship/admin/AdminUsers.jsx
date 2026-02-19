import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { Search, Plus, Edit, Trash2, Eye, UserCheck, UserX } from 'lucide-react';

const AdminUsers = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, statusFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await adminApi.getUsers(params);
      const data = response.data.data || response.data;
      setUsers(Array.isArray(data) ? data : []);
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (id) => {
    try {
      const response = await adminApi.getUser(id);
      setSelectedUser(response.data.data || response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert(t('admin.users.fetchDetailsFailed'));
    }
  };

  const handleCreate = () => {
    navigate('/stockship/admin/users/create');
  };

  const handleEdit = (user) => {
    navigate(`/stockship/admin/users/${user.id}/edit`);
  };

  const handleDelete = async (id) => {
    if (!confirm(t('admin.users.deleteConfirm'))) return;
    try {
      await adminApi.deleteUser(id);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(t('admin.users.deleteFailed'));
    }
  };

  const handleStatusUpdate = async (id, isActive) => {
    try {
      await adminApi.updateUserStatus(id, { status: isActive ? 'active' : 'inactive' });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert(t('admin.users.statusUpdateFailed'));
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('admin.users.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.users.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('admin.users.subtitle')}</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-5 h-5" />
          {t('admin.users.addUser')}
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('admin.users.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('admin.users.allStatus')}</option>
              <option value="active">{t('mediation.common.active')}</option>
              <option value="inactive">{t('mediation.common.inactive')}</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              {t('admin.users.clearFilters')}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.users.usersList')} ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('admin.users.noUsersFound')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">{t('common.id')}</th>
                    <th className="text-left p-4">{t('common.name')}</th>
                    <th className="text-left p-4">{t('common.email')}</th>
                    <th className="text-left p-4">{t('common.phone')}</th>
                    <th className="text-left p-4">{t('common.location')}</th>
                    <th className="text-left p-4">{t('common.status')}</th>
                    <th className="text-left p-4">{t('admin.users.joined')}</th>
                    <th className="text-left p-4">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{user.id}</td>
                      <td className="p-4">
                        <div className="font-semibold">{user.name || 'N/A'}</div>
                      </td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">
                        {user.countryCode && user.phone ? `${user.countryCode} ${user.phone}` : user.phone || 'N/A'}
                      </td>
                      <td className="p-4">
                        {user.city && user.country ? `${user.city}, ${user.country}` : user.country || 'N/A'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.isActive ? t('mediation.common.active') : t('mediation.common.inactive')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{formatDate(user.createdAt)}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/stockship/admin/users/${user.id}/view`)}
                            className="p-2 hover:bg-gray-100 rounded"
                            title={t('admin.users.viewDetails')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/stockship/admin/users/${user.id}/edit`)}
                            className="p-2 hover:bg-blue-100 rounded text-blue-600"
                            title={t('common.edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(user.id, !user.isActive)}
                            className={`p-2 rounded ${
                              user.isActive 
                                ? 'hover:bg-red-100 text-red-600' 
                                : 'hover:bg-green-100 text-green-600'
                            }`}
                            title={user.isActive ? (t('mediation.employees.deactivate') || 'Deactivate') : (t('mediation.employees.activate') || 'Activate')}
                          >
                            {user.isActive ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 hover:bg-red-100 rounded text-red-600"
                            title={t('common.delete')}
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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                {t('admin.users.pageOf').replace('{{page}}', pagination.page).replace('{{pages}}', pagination.pages)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t('admin.users.previous')}
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t('admin.users.next')}
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{t('admin.users.userDetails')}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><strong>{t('common.id')}:</strong> {selectedUser.id}</div>
              <div><strong>{t('common.email')}:</strong> {selectedUser.email}</div>
              <div><strong>{t('common.name')}:</strong> {selectedUser.name || 'N/A'}</div>
              <div><strong>{t('common.phone')}:</strong> {
                selectedUser.countryCode && selectedUser.phone 
                  ? `${selectedUser.countryCode} ${selectedUser.phone}` 
                  : selectedUser.phone || 'N/A'
              }</div>
              <div><strong>{t('common.country')}:</strong> {selectedUser.country || 'N/A'}</div>
              <div><strong>{t('common.city')}:</strong> {selectedUser.city || 'N/A'}</div>
              <div><strong>{t('common.language')}:</strong> {selectedUser.language || 'N/A'}</div>
              <div><strong>{t('common.status')}:</strong> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  selectedUser.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedUser.isActive ? t('mediation.common.active') : t('mediation.common.inactive')}
                </span>
              </div>
              <div><strong>{t('admin.users.emailVerified')}:</strong> {selectedUser.isEmailVerified ? t('common.yes') : t('common.no')}</div>
              <div><strong>{t('admin.users.joined')}:</strong> {formatDate(selectedUser.createdAt)}</div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEdit(selectedUser);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                {t('admin.users.editUser')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
