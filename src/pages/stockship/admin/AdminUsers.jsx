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
      alert('Failed to fetch user details');
    }
  };

  const handleCreate = () => {
    navigate('/stockship/admin/users/create');
  };

  const handleEdit = (user) => {
    navigate(`/stockship/admin/users/${user.id}/edit`);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminApi.deleteUser(id);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleStatusUpdate = async (id, isActive) => {
    try {
      await adminApi.updateUserStatus(id, { status: isActive ? 'active' : 'inactive' });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
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
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground mt-2">Manage all platform users</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-5 h-5" />
          Add User
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
                placeholder="Search users..."
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
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users List ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">ID</th>
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Phone</th>
                    <th className="text-left p-4">Location</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Joined</th>
                    <th className="text-left p-4">Actions</th>
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
                          {user.isActive ? 'Active' : 'Inactive'}
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
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/stockship/admin/users/${user.id}/edit`)}
                            className="p-2 hover:bg-blue-100 rounded text-blue-600"
                            title="Edit"
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
                            title={user.isActive ? 'Deactivate' : 'Activate'}
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


      {/* Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">User Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><strong>ID:</strong> {selectedUser.id}</div>
              <div><strong>Email:</strong> {selectedUser.email}</div>
              <div><strong>Name:</strong> {selectedUser.name || 'N/A'}</div>
              <div><strong>Phone:</strong> {
                selectedUser.countryCode && selectedUser.phone 
                  ? `${selectedUser.countryCode} ${selectedUser.phone}` 
                  : selectedUser.phone || 'N/A'
              }</div>
              <div><strong>Country:</strong> {selectedUser.country || 'N/A'}</div>
              <div><strong>City:</strong> {selectedUser.city || 'N/A'}</div>
              <div><strong>Language:</strong> {selectedUser.language || 'N/A'}</div>
              <div><strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  selectedUser.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedUser.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div><strong>Email Verified:</strong> {selectedUser.isEmailVerified ? 'Yes' : 'No'}</div>
              <div><strong>Joined:</strong> {formatDate(selectedUser.createdAt)}</div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEdit(selectedUser);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Edit User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
