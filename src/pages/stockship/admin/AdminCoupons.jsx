import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { Search, Plus, Edit, Trash2, Eye, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminCoupons = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchCoupons();
  }, [pagination.page, statusFilter, searchTerm]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await adminApi.getCoupons(params);
      const data = response.data.data || response.data;
      setCoupons(Array.isArray(data) ? data : []);
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCouponDetails = async (id) => {
    try {
      const response = await adminApi.getCoupon(id);
      setSelectedCoupon(response.data.data || response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching coupon details:', error);
      alert('Failed to fetch coupon details');
    }
  };

  const handleCreate = () => {
    navigate('/stockship/admin/coupons/create');
  };

  const handleEdit = (coupon) => {
    navigate(`/stockship/admin/coupons/${coupon.id}/edit`);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await adminApi.deleteCoupon(id);
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Failed to delete coupon');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      EXPIRED: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  if (loading && coupons.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Coupons Management</h1>
          <p className="text-muted-foreground mt-2">Manage all platform coupons</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Coupon
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
                placeholder="Search coupons..."
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
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="EXPIRED">Expired</option>
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

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Coupons List ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No coupons found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Code</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Discount</th>
                    <th className="text-left p-4">Usage</th>
                    <th className="text-left p-4">Valid Period</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-semibold">{coupon.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{coupon.couponType?.replace(/_/g, ' ') || 'N/A'}</td>
                      <td className="p-4">
                        {coupon.couponType === 'PERCENTAGE' 
                          ? `${coupon.discountValue}%`
                          : `${coupon.discountValue} SAR`}
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {coupon.usedCount || 0} / {coupon.usageLimit || '∞'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {new Date(coupon.validFrom).toLocaleDateString()} - {new Date(coupon.validUntil).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(coupon.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => fetchCouponDetails(coupon.id)}
                            className="p-2 hover:bg-gray-100 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(coupon)}
                            className="p-2 hover:bg-blue-100 rounded text-blue-600"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id)}
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
      {showDetailsModal && selectedCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Coupon Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><strong>Code:</strong> {selectedCoupon.code}</div>
              <div><strong>Type:</strong> {selectedCoupon.couponType?.replace(/_/g, ' ')}</div>
              <div><strong>Discount:</strong> {
                selectedCoupon.couponType === 'PERCENTAGE' 
                  ? `${selectedCoupon.discountValue}%`
                  : `${selectedCoupon.discountValue} SAR`
              }</div>
              <div><strong>Status:</strong> {getStatusBadge(selectedCoupon.status)}</div>
              <div><strong>Used:</strong> {selectedCoupon.usedCount || 0} / {selectedCoupon.usageLimit || '∞'}</div>
              <div><strong>Valid:</strong> {new Date(selectedCoupon.validFrom).toLocaleDateString()} - {new Date(selectedCoupon.validUntil).toLocaleDateString()}</div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEdit(selectedCoupon);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Edit Coupon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
