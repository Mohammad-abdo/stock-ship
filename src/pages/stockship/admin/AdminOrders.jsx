import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { Search, Eye, Package, Filter, Download } from 'lucide-react';

const AdminOrders = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, statusFilter, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await adminApi.getOrders(params);
      const data = response.data.data || response.data;
      setOrders(Array.isArray(data) ? data : []);
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (id) => {
    try {
      const response = await adminApi.getOrder(id);
      setSelectedOrder(response.data.data || response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Failed to fetch order details');
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    if (!confirm(`Are you sure you want to update order status to ${newStatus}?`)) return;
    try {
      await adminApi.updateOrderStatus(id, { status: newStatus });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-blue-100 text-blue-800',
      IN_PREPARATION: 'bg-purple-100 text-purple-800',
      IN_SHIPPING: 'bg-indigo-100 text-indigo-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace(/_/g, ' ') || 'Unknown'}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground mt-2">Manage all platform orders</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders..."
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
              <option value="ACCEPTED">Accepted</option>
              <option value="IN_PREPARATION">In Preparation</option>
              <option value="IN_SHIPPING">In Shipping</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
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

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders List ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Order #</th>
                    <th className="text-left p-4">Customer</th>
                    <th className="text-left p-4">Vendor</th>
                    <th className="text-left p-4">Items</th>
                    <th className="text-left p-4">Total</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-semibold">{order.orderNumber || `#${order.id}`}</div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{order.user?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{order.user?.email || ''}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{order.vendor?.companyName || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{order.vendor?.email || ''}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span>{order.items?.length || 0} items</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold">{order.totalAmount ? `${order.totalAmount} SAR` : 'N/A'}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(order.status)}
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="ACCEPTED">Accepted</option>
                            <option value="IN_PREPARATION">In Preparation</option>
                            <option value="IN_SHIPPING">In Shipping</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="REFUNDED">Refunded</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{formatDate(order.orderDate || order.createdAt)}</div>
                      </td>
                      <td className="p-4">
                          <button
                            onClick={() => navigate(`/stockship/admin/orders/${order.id}/view`)}
                            className="p-2 hover:bg-gray-100 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Order Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div><strong>Order Number:</strong> {selectedOrder.orderNumber || `#${selectedOrder.id}`}</div>
                <div><strong>Status:</strong> {getStatusBadge(selectedOrder.status)}</div>
                <div><strong>Order Date:</strong> {formatDate(selectedOrder.orderDate)}</div>
                <div><strong>Total Amount:</strong> {selectedOrder.totalAmount} SAR</div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-bold mb-2">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                  <div><strong>Name:</strong> {selectedOrder.user?.name || 'N/A'}</div>
                  <div><strong>Email:</strong> {selectedOrder.user?.email || 'N/A'}</div>
                  <div><strong>Phone:</strong> {selectedOrder.user?.phone || 'N/A'}</div>
                </div>
              </div>

              {/* Vendor Info */}
              <div>
                <h3 className="font-bold mb-2">Vendor Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                  <div><strong>Company:</strong> {selectedOrder.vendor?.companyName || 'N/A'}</div>
                  <div><strong>Email:</strong> {selectedOrder.vendor?.email || 'N/A'}</div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-bold mb-2">Order Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3">Product</th>
                        <th className="text-left p-3">SKU</th>
                        <th className="text-left p-3">Quantity</th>
                        <th className="text-left p-3">Price</th>
                        <th className="text-left p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-3">{item.product?.nameKey || 'N/A'}</td>
                          <td className="p-3">{item.product?.sku || 'N/A'}</td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3">{item.price} SAR</td>
                          <td className="p-3">{(item.price * item.quantity).toFixed(2)} SAR</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="font-bold mb-2">Order Summary</h3>
                <div className="bg-gray-50 p-4 rounded space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{selectedOrder.subtotal} SAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{selectedOrder.tax || 0} SAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charge:</span>
                    <span>{selectedOrder.deliveryCharge || 0} SAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>{selectedOrder.discountAmount || 0} SAR</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{selectedOrder.totalAmount} SAR</span>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              <div>
                <h3 className="font-bold mb-2">Shipping Information</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <div><strong>Address:</strong> {selectedOrder.shippingAddress || 'N/A'}</div>
                  <div><strong>City:</strong> {selectedOrder.shippingCity || 'N/A'}</div>
                  <div><strong>Country:</strong> {selectedOrder.shippingCountry || 'N/A'}</div>
                  <div><strong>Method:</strong> {selectedOrder.shippingMethod || 'N/A'}</div>
                  {selectedOrder.trackingNumber && (
                    <div><strong>Tracking Number:</strong> {selectedOrder.trackingNumber}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <select
                value={selectedOrder.status}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  handleStatusUpdate(selectedOrder.id, newStatus);
                  setSelectedOrder({ ...selectedOrder, status: newStatus });
                }}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="IN_PREPARATION">In Preparation</option>
                <option value="IN_SHIPPING">In Shipping</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
