import React, { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Store,
  Briefcase,
  ShoppingCart,
  DollarSign,
  Package,
  CreditCard,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { adminApi } from '@/lib/stockshipApi';
import showToast from '@/lib/toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

const AdminAnalytics = () => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState('30'); // days

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDashboardStats();
      const data = response.data?.data || response.data;
      setStats(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showToast.error(
        t('mediation.analytics.loadFailed') || 'Failed to load analytics',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, fetchAnalytics]);

  // Generate mock trend data for charts
  const generateTrendData = (days = 30) => {
    const data = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }),
        deals: Math.floor(Math.random() * 20) + 5,
        revenue: Math.floor(Math.random() * 50000) + 10000,
        clients: Math.floor(Math.random() * 10) + 2,
        traders: Math.floor(Math.random() * 5) + 1
      });
    }
    return data;
  };

  const trendData = generateTrendData(parseInt(timeRange));

  // Deal status distribution
  const dealStatusData = [
    { name: t('mediation.deals.negotiation') || 'Negotiation', value: 25, color: COLORS[0] },
    { name: t('mediation.deals.approved') || 'Approved', value: 40, color: COLORS[1] },
    { name: t('mediation.deals.paid') || 'Paid', value: 20, color: COLORS[2] },
    { name: t('mediation.deals.settled') || 'Settled', value: 15, color: COLORS[3] }
  ];

  // Revenue by category
  const revenueData = [
    { name: t('mediation.reports.deals') || 'Deals', revenue: stats?.totalRevenue || 0, commission: (stats?.totalRevenue || 0) * 0.025 },
    { name: t('mediation.reports.payments') || 'Payments', revenue: (stats?.totalPayments || 0) * 1.1, commission: (stats?.totalPayments || 0) * 0.02 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.analytics.loading') || 'Loading analytics...'}</p>
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
          <h1 className="text-3xl font-bold text-gray-900">{t('mediation.analytics.title') || 'Analytics Dashboard'}</h1>
          <p className="text-muted-foreground mt-2">{t('mediation.analytics.subtitle') || 'Platform insights and performance metrics'}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
          >
            <option value="7">{t('mediation.analytics.last7Days') || 'Last 7 Days'}</option>
            <option value="30">{t('mediation.analytics.last30Days') || 'Last 30 Days'}</option>
            <option value="90">{t('mediation.analytics.last90Days') || 'Last 90 Days'}</option>
            <option value="365">{t('mediation.analytics.lastYear') || 'Last Year'}</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.totalDeals')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalDeals || 0}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500">+12.5%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.totalRevenue')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {Number(stats?.totalRevenue || 0).toLocaleString()} SAR
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500">+8.2%</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.totalClients')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalClients || 0}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500">+5.3%</span>
                </div>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.totalTraders')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalTraders || 0}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500">+3.1%</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Store className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              {t('mediation.analytics.revenueTrend') || 'Revenue Trend'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`${Number(value).toLocaleString()} SAR`, 'Revenue']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name={t('dashboard.totalRevenue') || 'Revenue'}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Deals Trend */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {t('mediation.analytics.dealsTrend') || 'Deals Trend'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="deals" 
                  fill="#10b981" 
                  radius={[8, 8, 0, 0]}
                  name={t('dashboard.totalDeals') || 'Deals'}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Status Distribution */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-gray-600" />
              {t('mediation.analytics.dealStatus') || 'Deal Status Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={dealStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dealStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              {t('mediation.analytics.revenueBreakdown') || 'Revenue Breakdown'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  width={100}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => `${Number(value).toLocaleString()} SAR`}
                />
                <Legend />
                <Bar 
                  dataKey="revenue" 
                  fill="#3b82f6" 
                  radius={[0, 8, 8, 0]}
                  name={t('dashboard.totalRevenue') || 'Revenue'}
                />
                <Bar 
                  dataKey="commission" 
                  fill="#10b981" 
                  radius={[0, 8, 8, 0]}
                  name={t('dashboard.totalCommission') || 'Commission'}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{t('dashboard.totalEmployees')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-gray-900">{stats?.totalEmployees || 0}</p>
              <Briefcase className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{t('dashboard.totalOffers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-gray-900">{stats?.totalOffers || 0}</p>
              <Package className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{t('dashboard.totalPayments')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-gray-900">{stats?.totalPayments || 0}</p>
              <CreditCard className="w-8 h-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default AdminAnalytics;
