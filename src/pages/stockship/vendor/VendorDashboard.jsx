import React, { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DollarSign, Package, ShoppingCart, Handshake, TrendingUp, Wallet, Activity } from 'lucide-react';
import { vendorApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const VendorDashboard = () => {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    pendingOrders: 0,
    activeNegotiations: 0,
    walletBalance: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';

  const { salesData, productData } = useMemo(() => {
    const base = new Date(2024, 5, 2);
    const mockSalesData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return {
        name: d.toLocaleDateString(locale, { weekday: 'short' }),
        sales: [4000, 3000, 5000, 2780, 3890, 2390, 3490][i],
        orders: [24, 13, 28, 18, 23, 34, 29][i],
      };
    });
    const mockProductData = [
      { name: t('dashboard.vendor.demoProductA'), sales: 400, views: 1200 },
      { name: t('dashboard.vendor.demoProductB'), sales: 300, views: 980 },
      { name: t('dashboard.vendor.demoProductC'), sales: 200, views: 750 },
      { name: t('dashboard.vendor.demoProductD'), sales: 150, views: 600 },
    ];
    return { salesData: mockSalesData, productData: mockProductData };
  }, [t, locale]);

  useEffect(() => {
    fetchDashboardStats();
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

  const statCards = useMemo(
    () => [
      { icon: DollarSign, label: t('dashboard.vendor.totalSales'), value: stats.totalSales, color: 'text-emerald-600', bgColor: 'bg-emerald-100', isCurrency: true },
      { icon: Package, label: t('dashboard.vendor.totalProducts'), value: stats.totalProducts, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { icon: ShoppingCart, label: t('dashboard.vendor.pendingOrders'), value: stats.pendingOrders, color: 'text-orange-600', bgColor: 'bg-orange-100' },
      { icon: Handshake, label: t('dashboard.vendor.activeNegotiations'), value: stats.activeNegotiations, color: 'text-purple-600', bgColor: 'bg-purple-100' },
      { icon: Wallet, label: t('dashboard.vendor.walletBalance'), value: stats.walletBalance, color: 'text-cyan-600', bgColor: 'bg-cyan-100', isCurrency: true },
      { icon: TrendingUp, label: t('dashboard.vendor.totalEarnings'), value: stats.totalEarnings, color: 'text-green-600', bgColor: 'bg-green-100', isCurrency: true },
    ],
    [t, stats]
  );

  const sar = t('dashboard.currencySAR');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('dashboard.vendor.loading')}</p>
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
        <h1 className="text-3xl font-bold">{t('dashboard.vendor.dashboard')}</h1>
        <p className="text-muted-foreground mt-2">{t('dashboard.vendor.welcome')}</p>
      </motion.div>

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
                      ? `${stat.value.toLocaleString(locale)} ${sar}`
                      : stat.value.toLocaleString(locale)}
                  </motion.div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.isCurrency ? t('dashboard.statAmount') : t('dashboard.statCount')}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {t('dashboard.vendor.weeklySalesOrders')}
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
                  <Area type="monotone" dataKey="sales" stackId="1" stroke="#8884d8" fill="#8884d8" name={t('dashboard.vendor.chartSales')} />
                  <Area type="monotone" dataKey="orders" stackId="2" stroke="#82ca9d" fill="#82ca9d" name={t('dashboard.vendor.chartOrders')} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t('dashboard.vendor.topProducts')}
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
                  <Bar dataKey="sales" fill="#8884d8" name={t('dashboard.vendor.chartSalesBar')} />
                  <Bar dataKey="views" fill="#82ca9d" name={t('dashboard.vendor.chartViews')} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {t('dashboard.quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-lg border hover:bg-accent transition-colors text-left"
              >
                <div className="font-semibold">{t('dashboard.vendor.addProduct')}</div>
                <div className="text-sm text-muted-foreground">{t('dashboard.vendor.addProductDesc')}</div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-lg border hover:bg-accent transition-colors text-left"
              >
                <div className="font-semibold">{t('dashboard.vendor.viewOrders')}</div>
                <div className="text-sm text-muted-foreground">{t('dashboard.vendor.viewOrdersDesc')}</div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-lg border hover:bg-accent transition-colors text-left"
              >
                <div className="font-semibold">{t('dashboard.vendor.manageInventory')}</div>
                <div className="text-sm text-muted-foreground">{t('dashboard.vendor.manageInventoryDesc')}</div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 rounded-lg border hover:bg-accent transition-colors text-left"
              >
                <div className="font-semibold">{t('dashboard.vendor.viewWallet')}</div>
                <div className="text-sm text-muted-foreground">{t('dashboard.vendor.viewWalletDesc')}</div>
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VendorDashboard;
