import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import StandardDataTable from '@/components/StandardDataTable';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Key, 
  Users, 
  CheckSquare, 
  XSquare,
  X,
  Loader2,
  Eye,
  Save
} from 'lucide-react';
import { adminApi } from '@/lib/stockshipApi';
import showToast from '@/lib/toast';

const AdminRolesPermissions = () => {
  const { t } = useLanguage();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roles');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingPermission, setEditingPermission] = useState(null);
  const [saving, setSaving] = useState(false);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [permissionFormData, setPermissionFormData] = useState({
    name: '',
    description: '',
    resource: '',
    action: ''
  });

  // Default roles for mediation platform
  const defaultRoles = [
    {
      id: 1,
      name: 'ADMIN',
      description: 'Full system access and control',
      permissions: ['all'],
      users: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: 'EMPLOYEE',
      description: 'Mediator/Guarantor role with trader management',
      permissions: ['manage_traders', 'view_deals', 'approve_deals'],
      users: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      name: 'TRADER',
      description: 'Supplier role with offer management',
      permissions: ['create_offers', 'view_own_deals', 'manage_offers'],
      users: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      name: 'CLIENT',
      description: 'Buyer role with deal negotiation',
      permissions: ['view_offers', 'request_negotiation', 'view_own_deals'],
      users: 0,
      createdAt: new Date().toISOString()
    }
  ];

  // Default permissions for mediation platform
  const defaultPermissions = [
    { id: 1, name: 'all', resource: 'system', action: 'manage', description: 'Full system access' },
    { id: 2, name: 'manage_traders', resource: 'traders', action: 'manage', description: 'Manage traders' },
    { id: 3, name: 'view_deals', resource: 'deals', action: 'read', description: 'View all deals' },
    { id: 4, name: 'approve_deals', resource: 'deals', action: 'update', description: 'Approve deals' },
    { id: 5, name: 'create_offers', resource: 'offers', action: 'create', description: 'Create offers' },
    { id: 6, name: 'view_own_deals', resource: 'deals', action: 'read', description: 'View own deals' },
    { id: 7, name: 'manage_offers', resource: 'offers', action: 'manage', description: 'Manage offers' },
    { id: 8, name: 'view_offers', resource: 'offers', action: 'read', description: 'View offers' },
    { id: 9, name: 'request_negotiation', resource: 'deals', action: 'create', description: 'Request deal negotiation' },
    { id: 10, name: 'manage_employees', resource: 'employees', action: 'manage', description: 'Manage employees' },
    { id: 11, name: 'view_payments', resource: 'payments', action: 'read', description: 'View payments' },
    { id: 12, name: 'manage_payments', resource: 'payments', action: 'manage', description: 'Manage payments' }
  ];

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API endpoint when available
      // const response = await adminApi.getRoles();
      // setRoles(response.data.data || response.data || []);
      
      // Use default roles for now
      setRoles(defaultRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      showToast.error(
        t('mediation.roles.loadFailed') || 'Failed to fetch roles',
        error.response?.data?.message || t('mediation.roles.tryAgain') || 'Please try again'
      );
      setRoles(defaultRoles);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      // TODO: Replace with actual API endpoint when available
      // const response = await adminApi.getPermissions();
      // setPermissions(response.data.data || response.data || []);
      
      // Use default permissions for now
      setPermissions(defaultPermissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      showToast.error(
        t('mediation.permissions.loadFailed') || 'Failed to fetch permissions',
        error.response?.data?.message || t('mediation.permissions.tryAgain') || 'Please try again'
      );
      setPermissions(defaultPermissions);
    }
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setRoleFormData({
      name: '',
      description: '',
      permissions: []
    });
    setShowRoleModal(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name || '',
      description: role.description || '',
      permissions: role.permissions || []
    });
    setShowRoleModal(true);
  };

  const handleCreatePermission = () => {
    setEditingPermission(null);
    setPermissionFormData({
      name: '',
      description: '',
      resource: '',
      action: ''
    });
    setShowPermissionModal(true);
  };

  const handleEditPermission = (permission) => {
    setEditingPermission(permission);
    setPermissionFormData({
      name: permission.name || '',
      description: permission.description || '',
      resource: permission.resource || '',
      action: permission.action || ''
    });
    setShowPermissionModal(true);
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // TODO: Replace with actual API endpoint
      // if (editingRole) {
      //   await adminApi.updateRole(editingRole.id, roleFormData);
      //   showToast.success(t('mediation.roles.updated'), t('mediation.roles.updateSuccess'));
      // } else {
      //   await adminApi.createRole(roleFormData);
      //   showToast.success(t('mediation.roles.created'), t('mediation.roles.createSuccess'));
      // }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingRole) {
        setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, ...roleFormData } : r));
        showToast.success(
          t('mediation.roles.updated') || 'Role updated',
          t('mediation.roles.updateSuccess') || 'The role has been updated successfully'
        );
      } else {
        const newRole = {
          id: roles.length + 1,
          ...roleFormData,
          users: 0,
          createdAt: new Date().toISOString()
        };
        setRoles(prev => [...prev, newRole]);
        showToast.success(
          t('mediation.roles.created') || 'Role created',
          t('mediation.roles.createSuccess') || 'The role has been created successfully'
        );
      }
      
      setShowRoleModal(false);
      setEditingRole(null);
    } catch (error) {
      console.error('Error saving role:', error);
      showToast.error(
        t('mediation.roles.saveFailed') || 'Failed to save role',
        error.response?.data?.message || t('mediation.roles.tryAgain') || 'Please try again'
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      // TODO: Replace with actual API endpoint
      // if (editingPermission) {
      //   await adminApi.updatePermission(editingPermission.id, permissionFormData);
      //   showToast.success(t('mediation.permissions.updated'), t('mediation.permissions.updateSuccess'));
      // } else {
      //   await adminApi.createPermission(permissionFormData);
      //   showToast.success(t('mediation.permissions.created'), t('mediation.permissions.createSuccess'));
      // }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingPermission) {
        setPermissions(prev => prev.map(p => p.id === editingPermission.id ? { ...p, ...permissionFormData } : p));
        showToast.success(
          t('mediation.permissions.updated') || 'Permission updated',
          t('mediation.permissions.updateSuccess') || 'The permission has been updated successfully'
        );
      } else {
        const newPermission = {
          id: permissions.length + 1,
          ...permissionFormData
        };
        setPermissions(prev => [...prev, newPermission]);
        showToast.success(
          t('mediation.permissions.created') || 'Permission created',
          t('mediation.permissions.createSuccess') || 'The permission has been created successfully'
        );
      }
      
      setShowPermissionModal(false);
      setEditingPermission(null);
    } catch (error) {
      console.error('Error saving permission:', error);
      showToast.error(
        t('mediation.permissions.saveFailed') || 'Failed to save permission',
        error.response?.data?.message || t('mediation.permissions.tryAgain') || 'Please try again'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm(t('mediation.roles.deleteConfirm') || 'Are you sure you want to delete this role?')) return;
    try {
      // TODO: Replace with actual API endpoint
      // await adminApi.deleteRole(id);
      
      setRoles(prev => prev.filter(r => r.id !== id));
      showToast.success(
        t('mediation.roles.deleted') || 'Role deleted',
        t('mediation.roles.deleteSuccess') || 'The role has been deleted'
      );
    } catch (error) {
      console.error('Error deleting role:', error);
      showToast.error(
        t('mediation.roles.deleteFailed') || 'Failed to delete role',
        error.response?.data?.message || t('mediation.roles.tryAgain') || 'Please try again'
      );
    }
  };

  const handleDeletePermission = async (id) => {
    if (!window.confirm(t('mediation.permissions.deleteConfirm') || 'Are you sure you want to delete this permission?')) return;
    try {
      // TODO: Replace with actual API endpoint
      // await adminApi.deletePermission(id);
      
      setPermissions(prev => prev.filter(p => p.id !== id));
      showToast.success(
        t('mediation.permissions.deleted') || 'Permission deleted',
        t('mediation.permissions.deleteSuccess') || 'The permission has been deleted'
      );
    } catch (error) {
      console.error('Error deleting permission:', error);
      showToast.error(
        t('mediation.permissions.deleteFailed') || 'Failed to delete permission',
        error.response?.data?.message || t('mediation.permissions.tryAgain') || 'Please try again'
      );
    }
  };

  const togglePermission = (permissionId) => {
    setRoleFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const filteredRoles = roles.filter(role =>
    role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPermissions = permissions.filter(permission =>
    permission.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.action?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Roles table columns
  const roleColumns = [
    {
      key: 'name',
      label: t('mediation.roles.name') || 'Name',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-900">{value}</span>
        </div>
      )
    },
    {
      key: 'description',
      label: t('mediation.roles.description') || 'Description',
      render: (value) => <span className="text-sm text-gray-600">{value || '—'}</span>
    },
    {
      key: 'permissions',
      label: t('mediation.roles.permissions') || 'Permissions',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {Array.isArray(value) ? value.length : (value === 'all' ? 'All' : 0)} {t('mediation.roles.permissions') || 'permissions'}
        </span>
      )
    },
    {
      key: 'users',
      label: t('mediation.roles.users') || 'Users',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value || 0} {t('mediation.roles.users') || 'users'}
        </span>
      )
    }
  ];

  // Permissions table columns
  const permissionColumns = [
    {
      key: 'name',
      label: t('mediation.permissions.name') || 'Name',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-900">{value}</span>
        </div>
      )
    },
    {
      key: 'resource',
      label: t('mediation.permissions.resource') || 'Resource',
      render: (value) => (
        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
          {value || '—'}
        </span>
      )
    },
    {
      key: 'action',
      label: t('mediation.permissions.action') || 'Action',
      render: (value) => (
        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 capitalize">
          {value || '—'}
        </span>
      )
    },
    {
      key: 'description',
      label: t('mediation.permissions.description') || 'Description',
      render: (value) => <span className="text-sm text-gray-600">{value || '—'}</span>
    }
  ];

  const roleRowActions = (row) => (
    <div className="flex items-center gap-1 justify-end">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEditRole(row);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('mediation.common.edit') || 'Edit'}
      >
        <Edit className="w-4 h-4 text-gray-600" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteRole(row.id);
        }}
        className="p-1.5 hover:bg-red-100 rounded transition-colors"
        title={t('mediation.common.delete') || 'Delete'}
      >
        <Trash2 className="w-4 h-4 text-red-600" />
      </button>
    </div>
  );

  const permissionRowActions = (row) => (
    <div className="flex items-center gap-1 justify-end">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEditPermission(row);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('mediation.common.edit') || 'Edit'}
      >
        <Edit className="w-4 h-4 text-gray-600" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeletePermission(row.id);
        }}
        className="p-1.5 hover:bg-red-100 rounded transition-colors"
        title={t('mediation.common.delete') || 'Delete'}
      >
        <Trash2 className="w-4 h-4 text-red-600" />
      </button>
    </div>
  );

  if (loading && roles.length === 0 && permissions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.roles.loading') || 'Loading roles and permissions...'}</p>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('mediation.roles.title') || 'Roles & Permissions'}</h1>
          <p className="text-muted-foreground mt-2">{t('mediation.roles.subtitle') || 'Manage user roles and permissions'}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={activeTab === 'roles' ? handleCreateRole : handleCreatePermission}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'roles' 
            ? (t('mediation.roles.addRole') || 'Add Role')
            : (t('mediation.permissions.addPermission') || 'Add Permission')
          }
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'roles'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {t('mediation.roles.roles') || 'Roles'} ({roles.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'permissions'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            {t('mediation.permissions.permissions') || 'Permissions'} ({permissions.length})
          </div>
        </button>
      </div>

      {/* Search */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={activeTab === 'roles' 
                ? (t('mediation.roles.searchPlaceholder') || 'Search roles...')
                : (t('mediation.permissions.searchPlaceholder') || 'Search permissions...')
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Roles Table */}
      {activeTab === 'roles' && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {t('mediation.roles.rolesList') || 'Roles List'} ({filteredRoles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <StandardDataTable
              columns={roleColumns}
              data={filteredRoles}
              loading={loading}
              emptyMessage={t('mediation.roles.noRoles') || 'No roles found'}
              searchable={false}
              rowActions={roleRowActions}
              compact={false}
            />
          </CardContent>
        </Card>
      )}

      {/* Permissions Table */}
      {activeTab === 'permissions' && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {t('mediation.permissions.permissionsList') || 'Permissions List'} ({filteredPermissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <StandardDataTable
              columns={permissionColumns}
              data={filteredPermissions}
              loading={loading}
              emptyMessage={t('mediation.permissions.noPermissions') || 'No permissions found'}
              searchable={false}
              rowActions={permissionRowActions}
              compact={false}
            />
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Role Modal */}
      <AnimatePresence>
        {showRoleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !saving && setShowRoleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingRole 
                    ? (t('mediation.roles.editRole') || 'Edit Role')
                    : (t('mediation.roles.createRole') || 'Create Role')
                  }
                </h2>
                <button
                  onClick={() => !saving && setShowRoleModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={saving}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleRoleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('mediation.roles.name')} *
                  </label>
                  <input
                    type="text"
                    value={roleFormData.name}
                    onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                    required
                    disabled={saving}
                    placeholder={t('mediation.roles.namePlaceholder') || 'Enter role name'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('mediation.roles.description')}
                  </label>
                  <textarea
                    value={roleFormData.description}
                    onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                    rows="3"
                    disabled={saving}
                    placeholder={t('mediation.roles.descriptionPlaceholder') || 'Enter role description'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('mediation.roles.permissions')}
                  </label>
                  <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
                    {permissions.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        {t('mediation.roles.noPermissionsAvailable') || 'No permissions available'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {permissions.map(permission => (
                          <label
                            key={permission.id}
                            className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={roleFormData.permissions.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              disabled={saving}
                              className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-300"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">{permission.name}</span>
                              <p className="text-xs text-gray-500">{permission.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowRoleModal(false)}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('mediation.roles.saving') || 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingRole 
                          ? (t('mediation.roles.update') || 'Update')
                          : (t('mediation.roles.create') || 'Create')
                        }
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Permission Modal */}
      <AnimatePresence>
        {showPermissionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !saving && setShowPermissionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPermission 
                    ? (t('mediation.permissions.editPermission') || 'Edit Permission')
                    : (t('mediation.permissions.createPermission') || 'Create Permission')
                  }
                </h2>
                <button
                  onClick={() => !saving && setShowPermissionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={saving}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handlePermissionSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('mediation.permissions.name')} *
                    </label>
                    <input
                      type="text"
                      value={permissionFormData.name}
                      onChange={(e) => setPermissionFormData({ ...permissionFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                      required
                      disabled={saving}
                      placeholder={t('mediation.permissions.namePlaceholder') || 'e.g., manage_traders'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('mediation.permissions.resource')} *
                    </label>
                    <input
                      type="text"
                      value={permissionFormData.resource}
                      onChange={(e) => setPermissionFormData({ ...permissionFormData, resource: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                      required
                      disabled={saving}
                      placeholder={t('mediation.permissions.resourcePlaceholder') || 'e.g., traders, deals'}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('mediation.permissions.action')} *
                  </label>
                  <select
                    value={permissionFormData.action}
                    onChange={(e) => setPermissionFormData({ ...permissionFormData, action: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                    required
                    disabled={saving}
                  >
                    <option value="">{t('mediation.permissions.selectAction') || 'Select Action'}</option>
                    <option value="create">{t('mediation.permissions.create') || 'Create'}</option>
                    <option value="read">{t('mediation.permissions.read') || 'Read'}</option>
                    <option value="update">{t('mediation.permissions.update') || 'Update'}</option>
                    <option value="delete">{t('mediation.permissions.delete') || 'Delete'}</option>
                    <option value="manage">{t('mediation.permissions.manage') || 'Manage'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('mediation.permissions.description')}
                  </label>
                  <textarea
                    value={permissionFormData.description}
                    onChange={(e) => setPermissionFormData({ ...permissionFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                    rows="3"
                    disabled={saving}
                    placeholder={t('mediation.permissions.descriptionPlaceholder') || 'Enter permission description'}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowPermissionModal(false)}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('mediation.permissions.saving') || 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingPermission 
                          ? (t('mediation.permissions.update') || 'Update')
                          : (t('mediation.permissions.create') || 'Create')
                        }
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminRolesPermissions;
