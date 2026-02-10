import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, ShoppingCart, User, Store, Package, DollarSign, Calendar, MapPin, Truck } from 'lucide-react';
import showToast from '@/lib/toast';

const ViewOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getOrder(id);
      setOrder(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      showToast.error('Failed to load order', error.response?.data?.message || 'Order not found');
      navigate('/stockship/admin/orders');
    } finally {
      setLoading(false);
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
      AWAITING_RESPONSE: 'bg-orange-100 text-orange-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace(/_/g, ' ') || 'Unknown'}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/stockship/admin/orders')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold">Order Details</h1>
            <p className="text-muted-foreground mt-2">View complete order information</p>
          </div>
        </div>
        {getStatusBadge(order.status)}
      </div>

      {/* Order Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Order Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Order Number</label>
              <p className="text-lg font-semibold mt-1">{order.orderNumber || `#${order.id}`}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Total Amount
              </label>
              <p className="text-lg font-semibold mt-1">{order.totalAmount ? `${order.totalAmount} SAR` : 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">{getStatusBadge(order.status)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Order Date
              </label>
              <p className="text-sm mt-1">{formatDate(order.orderDate || order.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer & Vendor Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-lg font-semibold mt-1">{order.user?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg mt-1">{order.user?.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-lg mt-1">{order.user?.phone || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Vendor Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Company Name</label>
                <p className="text-lg font-semibold mt-1">{order.vendor?.companyName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg mt-1">{order.vendor?.email || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      {order.items && order.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items ({order.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
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
                  {order.items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{item.product?.nameKey || 'N/A'}</td>
                      <td className="p-3">{item.product?.sku || 'N/A'}</td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3">{item.price} SAR</td>
                      <td className="p-3 font-semibold">{(item.price * item.quantity).toFixed(2)} SAR</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="4" className="p-3 text-right font-semibold">Total:</td>
                    <td className="p-3 font-bold text-lg">{order.totalAmount} SAR</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipping Information */}
      {order.shippingAddress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Shipping Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-lg font-semibold mt-1">{order.shippingAddress}</p>
              </div>
              {order.shippingCity && (
                <div>
                  <label className="text-sm font-medium text-gray-500">City</label>
                  <p className="text-lg font-semibold mt-1">{order.shippingCity}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default ViewOrder;


