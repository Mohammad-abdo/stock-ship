import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DollarSign, Package, ShoppingCart, Handshake, TrendingUp, Wallet, AlertTriangle, Activity } from 'lucide-react';
import { vendorApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const VendorDashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    pendingOrders: 0,
    activeNegotiations: 0,
    walletBalance: 0,
    totalEarnings: 0,
  });
  const [salesData, setSalesData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchChartData();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await vendorApi.getDashboardStats();
      const data = response.data.data || response.data;
      setStats({
        totalSales: data.totalSales || 0,
        totalProducts: data.totalProducts || 0,
        pendingOrders: data.pendingOrders || 0,
        activeNegotiations: data.activeNegotiations || 0,
        walletBalance: data.walletBalance || 0,
        totalEarnings: data.totalEarnings || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    // Mock data for charts - replace with actual API calls
    const mockSalesData = [
      { name: 'Mon', sales: 4000, orders: 24 },
      { name: 'Tue', sales: 3000, orders: 13 },
      { name: 'Wed', sales: 5000, orders: 28 },
      { name: 'Thu', sales: 2780, orders: 18 },
      { name: 'Fri', sales: 3890, orders: 23 },
      { name: 'Sat', sales: 2390, orders: 34 },
      { name: 'Sun', sales: 3490, orders: 29 },
    ];
    setSalesData(mockSalesData);

    const mockProductData = [
      { name: 'Product A', sales: 400, views: 1200 },
      { name: 'Product B', sales: 300, views: 980 },
      { name: 'Product C', sales: 200, views: 750 },
      { name: 'Product D', sales: 150, views: 600 },
    ];
    setProductData(mockProductData);
  };

  const statCards = [
    { icon: DollarSign, label: 'Total Sales', value: stats.totalSales, color: 'text-emerald-600', bgColor: 'bg-emerald-100', isCurrency: true },
    { icon: Package, label: 'Total Products', value: stats.totalProducts, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { icon: ShoppingCart, label: 'Pending Orders', value: stats.pendingOrders, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { icon: Handshake, label: 'Active Negotiations', value: stats.activeNegotiations, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { icon: Wallet, label: 'Wallet Balance', value: stats.walletBalance, color: 'text-cyan-600', bgColor: 'bg-cyan-100', isCurrency: true },
    { icon: TrendingUp, label: 'Total Earnings', value: stats.totalEarnings, color: 'text-green-600', bgColor: 'bg-green-100', isCurrency: true },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">{t('dashboard.vendor.dashboard') || 'Vendor Dashboard'}</h1>
        <p className="text-muted-foreground mt-2">Welcome to Stockship Vendor Dashboard</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                    className="text-2xl font-bold"
                  >
                    {stat.isCurrency 
                      ? `${stat.value.toLocaleString()} SAR`
                      : stat.value.toLocaleString()}
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.isCurrency ? 'Total amount' : 'Active count'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sales Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Weekly Sales & Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="sales" stackId="1" stroke="#8884d8" fill="#8884d8" name="Sales (SAR)" />
                  <Area type="monotone" dataKey="orders" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Orders" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Product Performance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Top Products Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#8884d8" name="Sales" />
                  <Bar dataKey="views" fill="#82ca9d" name="Views" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-lg border hover:bg-accent transition-colors text-left"
              >
                <div className="font-semibold">Add Product</div>
                <div className="text-sm text-muted-foreground">Create new listing</div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-lg border hover:bg-accent transition-colors text-left"
              >
                <div className="font-semibold">View Orders</div>
                <div className="text-sm text-muted-foreground">Manage orders</div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-lg border hover:bg-accent transition-colors text-left"
              >
                <div className="font-semibold">Manage Inventory</div>
                <div className="text-sm text-muted-foreground">Update stock</div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-lg border hover:bg-accent transition-colors text-left"
              >
                <div className="font-semibold">View Wallet</div>
                <div className="text-sm text-muted-foreground">Earnings & payouts</div>
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VendorDashboard;
