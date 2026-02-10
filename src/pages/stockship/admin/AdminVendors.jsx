import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, Eye, CheckCircle, XCircle, Ban, Check, Store, Mail, Phone, MapPin, Package, ShoppingCart } from 'lucide-react';
import showToast from '@/lib/toast';

const AdminVendors = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchVendors();
  }, [pagination.page, statusFilter]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await adminApi.getVendors(params);
      const data = response.data?.data || response.data || [];
      setVendors(Array.isArray(data) ? data : []);
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      showToast.error('Failed to fetch vendors', error.response?.data?.message || 'Please try again');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    navigate(`/stockship/admin/vendors/${id}/delete`);
  };

  const handleApprove = async (id) => {
    try {
      await adminApi.approveVendor(id);
      showToast.success('Vendor approved', 'The vendor has been approved successfully');
      fetchVendors();
    } catch (error) {
      console.error('Error approving vendor:', error);
      showToast.error('Failed to approve vendor', error.response?.data?.message || 'Please try again');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Please provide rejection reason:');
    if (!reason) return;
    try {
      await adminApi.rejectVendor(id, reason);
      showToast.success('Vendor rejected', 'The vendor has been rejected');
      fetchVendors();
    } catch (error) {
      console.error('Error rejecting vendor:', error);
      showToast.error('Failed to reject vendor', error.response?.data?.message || 'Please try again');
    }
  };

  const handleSuspend = async (id) => {
    const reason = window.prompt('Please provide suspension reason:');
    if (!reason) return;
    try {
      await adminApi.suspendVendor(id, reason);
      showToast.success('Vendor suspended', 'The vendor has been suspended');
      fetchVendors();
    } catch (error) {
      console.error('Error suspending vendor:', error);
      showToast.error('Failed to suspend vendor', error.response?.data?.message || 'Please try again');
    }
  };

  const handleActivate = async (id) => {
    try {
      await adminApi.activateVendor(id);
      showToast.success('Vendor activated', 'The vendor has been activated');
      fetchVendors();
    } catch (error) {
      console.error('Error activating vendor:', error);
      showToast.error('Failed to activate vendor', error.response?.data?.message || 'Please try again');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      SUSPENDED: 'bg-orange-100 text-orange-800',
      PENDING: 'bg-yellow-100 text-yellow-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  const filteredVendors = vendors.filter((vendor) =>
    (vendor.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vendor.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vendor.businessName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && vendors.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vendors...</p>
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
          <h1 className="text-3xl font-bold">Vendors Management</h1>
          <p className="text-muted-foreground mt-2">Manage all platform vendors</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/stockship/admin/vendors/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/stockship/admin/vendors/create')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-5 h-5" />
          Add Vendor
        </motion.button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search vendors..."
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
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
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

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendors List ({pagination.total || filteredVendors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredVendors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No vendors found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">ID</th>
                    <th className="text-left p-4">Company Name</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Phone</th>
                    <th className="text-left p-4">Location</th>
                    <th className="text-left p-4">Products</th>
                    <th className="text-left p-4">Orders</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((vendor, index) => (
                    <motion.tr
                      key={vendor.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-4">{vendor.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-semibold">{vendor.companyName || vendor.businessName || 'N/A'}</div>
                            {vendor.isVerified && (
                              <span className="text-xs text-blue-600">Verified</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{vendor.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{vendor.phone || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{vendor.city && vendor.country ? `${vendor.city}, ${vendor.country}` : vendor.city || vendor.country || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span>{vendor._count?.products || 0}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <ShoppingCart className="w-4 h-4 text-gray-400" />
                          <span>{vendor._count?.orders || 0}</span>
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(vendor.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/stockship/admin/vendors/${vendor.id}/view`)}
                            className="p-2 hover:bg-gray-100 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/stockship/admin/vendors/${vendor.id}/edit`)}
                            className="p-2 hover:bg-blue-100 rounded text-blue-600"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {vendor.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(vendor.id)}
                                className="p-2 hover:bg-green-100 rounded text-green-600"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(vendor.id)}
                                className="p-2 hover:bg-red-100 rounded text-red-600"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {vendor.status === 'APPROVED' && vendor.isActive && (
                            <button
                              onClick={() => handleSuspend(vendor.id)}
                              className="p-2 hover:bg-orange-100 rounded text-orange-600"
                              title="Suspend"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          {!vendor.isActive && vendor.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleActivate(vendor.id)}
                              className="p-2 hover:bg-green-100 rounded text-green-600"
                              title="Activate"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(vendor.id)}
                            className="p-2 hover:bg-red-100 rounded text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
    </motion.div>
  );
};

export default AdminVendors;
