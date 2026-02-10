import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DollarSign, Users, Package, ShoppingCart, TrendingUp, Activity, Store, Wallet, CreditCard, Briefcase } from 'lucide-react';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    clients: 0,
    traders: 0,
    employees: 0,
    offers: 0,
    deals: 0,
    payments: 0,
    totalRevenue: 0,
    totalCommission: 0,
    walletBalance: 0,
  });
  const [salesData, setSalesData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchChartData();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await adminApi.getDashboardStats();
      const data = response.data.data || response.data;
      setStats({
        clients: data.clients || 0,
        traders: data.traders || 0,
        employees: data.employees || 0,
        offers: data.offers || 0,
        deals: data.deals || 0,
        payments: data.payments || 0,
        totalRevenue: data.totalRevenue || 0,
        totalCommission: data.totalCommission || 0,
        walletBalance: data.walletBalance || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    // Mock data for charts - replace with actual API calls when available
    const mockSalesData = [
      { name: 'Jan', revenue: 4000, deals: 24 },
      { name: 'Feb', revenue: 3000, deals: 13 },
      { name: 'Mar', revenue: 5000, deals: 28 },
      { name: 'Apr', revenue: 2780, deals: 18 },
      { name: 'May', revenue: 3890, deals: 23 },
      { name: 'Jun', revenue: 2390, deals: 34 },
    ];
    setSalesData(mockSalesData);
    setOrdersData(mockSalesData);

    // For mediation platform, show deal status distribution instead of categories
    const mockDealStatusData = [
      { name: 'Negotiation', value: 40 },
      { name: 'Approved', value: 30 },
      { name: 'Paid', value: 20 },
      { name: 'Settled', value: 10 },
    ];
    setCategoryData(mockDealStatusData);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const statCards = [
    { icon: Users, label: t('dashboard.totalClients'), value: stats.clients, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { icon: Store, label: t('dashboard.totalTraders'), value: stats.traders, color: 'text-green-600', bgColor: 'bg-green-100' },
    { icon: Briefcase, label: t('dashboard.totalEmployees'), value: stats.employees, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { icon: Package, label: t('dashboard.totalOffers'), value: stats.offers, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { icon: ShoppingCart, label: t('dashboard.totalDeals'), value: stats.deals, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { icon: DollarSign, label: t('dashboard.totalRevenue'), value: stats.totalRevenue, color: 'text-emerald-600', bgColor: 'bg-emerald-100', isCurrency: true },
    { icon: CreditCard, label: t('dashboard.totalPayments'), value: stats.payments, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
    { icon: TrendingUp, label: t('dashboard.totalCommission'), value: stats.totalCommission, color: 'text-pink-600', bgColor: 'bg-pink-100', isCurrency: true },
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
        <h1 className="text-3xl font-bold">{t('dashboard.admin.dashboard') || 'Admin Dashboard'}</h1>
        <p className="text-muted-foreground mt-2">{t('dashboard.admin.welcome')}</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                {t('dashboard.totalRevenue')} {t('dashboard.overview')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name={t('dashboard.totalRevenue') + ' (SAR)'} />
                  <Line type="monotone" dataKey="deals" stroke="#82ca9d" strokeWidth={2} name={t('dashboard.totalDeals')} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Deals Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {t('dashboard.totalDeals')} {t('dashboard.salesTrend')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ordersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="deals" fill="#8884d8" name={t('dashboard.totalDeals')} />
                  <Bar dataKey="revenue" fill="#82ca9d" name={t('dashboard.totalRevenue') + ' (SAR)'} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Deal Status Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Deal Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
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
                onClick={() => window.location.href = '/stockship/admin/employees'}
                className="p-4 rounded-lg border hover:bg-accent transition-colors text-left"
              >
                <div className="font-semibold">{t('mediation.employees.title')}</div>
                <div className="text-sm text-muted-foreground">{t('mediation.employees.subtitle')}</div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/stockship/admin/traders'}
                className="p-4 rounded-lg border hover:bg-accent transition-colors text-left"
              >
                <div className="font-semibold">{t('mediation.traders.title')}</div>
                <div className="text-sm text-muted-foreground">{t('mediation.traders.subtitle')}</div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/stockship/admin/reports'}
                className="p-4 rounded-lg border hover:bg-accent transition-colors text-left"
              >
                <div className="font-semibold">{t('sidebar.reports')}</div>
                <div className="text-sm text-muted-foreground">{t('dashboard.overview')}</div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/stockship/admin/support-tickets'}
                className="p-4 rounded-lg border hover:bg-accent transition-colors text-left"
              >
                <div className="font-semibold">{t('sidebar.support')}</div>
                <div className="text-sm text-muted-foreground">{t('admin.support')}</div>
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
