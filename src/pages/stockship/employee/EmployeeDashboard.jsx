import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { employeeApi } from "@/lib/mediationApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/StatCard";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp,
  ShoppingCart,
  Package,
  ArrowRight,
  Clock
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { getAuth } = useMultiAuth();
  const { t, language } = useLanguage();
  const { user } = getAuth('employee');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (user?.id && !fetchingRef.current) {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    if (fetchingRef.current) return;
    
    try {
      fetchingRef.current = true;
      const response = await employeeApi.getEmployeeDashboard(user.id);
      setDashboard(response.data.data || response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      if (error.response?.status !== 429) {
        // Only log non-rate-limit errors
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  // Generate mock chart data
  const generateDealsData = () => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }),
        deals: Math.floor(Math.random() * 10) + 2
      });
    }
    return data;
  };

  const dealsData = generateDealsData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.employee.loading') || 'Loading dashboard...'}</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">{t('mediation.employee.dashboard') || 'Employee Dashboard'}</h1>
        <p>{t('mediation.employee.noData') || 'No data available'}</p>
      </div>
    );
  }

  const statCards = [
    {
      icon: Users,
      label: t('mediation.employee.totalTraders') || 'Total Traders',
      value: dashboard.stats?.traderCount || 0,
      description: t('mediation.employee.tradersDescription') || 'Linked traders',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      onClick: () => navigate('/stockship/employee/traders')
    },
    {
      icon: ShoppingCart,
      label: t('mediation.employee.activeDeals') || 'Active Deals',
      value: dashboard.stats?.activeDealsCount || 0,
      description: t('mediation.employee.activeDealsDescription') || 'Currently active',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      onClick: () => navigate('/stockship/employee/deals')
    },
    {
      icon: FileText,
      label: t('mediation.employee.totalDeals') || 'Total Deals',
      value: dashboard.stats?.totalDealsCount || 0,
      description: t('mediation.employee.totalDealsDescription') || 'All time',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      onClick: () => navigate('/stockship/employee/deals')
    },
    {
      icon: DollarSign,
      label: t('mediation.employee.totalCommission') || 'Total Commission',
      value: `$${(Number(dashboard.stats?.totalCommission) || 0).toFixed(2)}`,
      description: t('mediation.employee.commissionDescription') || 'Earned commission',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      isCurrency: true
    }
  ];

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
          <h1 className="text-3xl font-bold text-gray-900">
            {t('mediation.employee.dashboard') || 'Employee Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('mediation.employee.welcome') || 'Welcome back'}, {dashboard.employee?.name || 'Employee'} 
            {dashboard.employee?.employeeCode && ` (${dashboard.employee.employeeCode})`}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card 
                className={`border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${card.onClick ? 'cursor-pointer' : ''}`}
                onClick={card.onClick}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                      <p className={`text-2xl font-bold text-gray-900 ${card.isCurrency ? '' : ''}`}>
                        {card.value}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{card.description}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${card.bgColor}`}>
                      <Icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deals Trend */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              {t('mediation.employee.dealsTrend') || 'Deals Trend (Last 7 Days)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dealsData}>
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
                <Line 
                  type="monotone" 
                  dataKey="deals" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name={t('mediation.employee.deals') || 'Deals'}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-gray-600" />
              {t('mediation.employee.quickActions') || 'Quick Actions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/stockship/employee/traders/create')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{t('mediation.employee.registerTrader') || 'Register New Trader'}</p>
                    <p className="text-sm text-gray-500">{t('mediation.employee.registerTraderDesc') || 'Add a new trader to your list'}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/stockship/employee/traders')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{t('mediation.employee.manageTraders') || 'Manage Traders'}</p>
                    <p className="text-sm text-gray-500">{t('mediation.employee.manageTradersDesc') || 'View and manage your traders'}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/stockship/employee/deals')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{t('mediation.employee.manageDeals') || 'Manage Deals'}</p>
                    <p className="text-sm text-gray-500">{t('mediation.employee.manageDealsDesc') || 'Monitor and manage deals'}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Deals */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              {t('mediation.employee.recentDeals') || 'Recent Deals'}
            </CardTitle>
            {dashboard.recentDeals && dashboard.recentDeals.length > 0 && (
              <button
                onClick={() => navigate('/stockship/employee/deals')}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                {t('mediation.employee.viewAll') || 'View All'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {dashboard.recentDeals && dashboard.recentDeals.length > 0 ? (
            <div className="space-y-4">
              {dashboard.recentDeals.slice(0, 5).map((deal, index) => (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => navigate(`/stockship/employee/deals/${deal.id}`)}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-gray-900">{deal.dealNumber}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        deal.status === 'NEGOTIATION' ? 'bg-yellow-100 text-yellow-800' :
                        deal.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                        deal.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        deal.status === 'SETTLED' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {deal.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">{t('mediation.deals.trader') || 'Trader'}</p>
                        <p className="font-medium text-gray-900">{deal.trader?.companyName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('mediation.deals.client') || 'Client'}</p>
                        <p className="font-medium text-gray-900">{deal.client?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('mediation.deals.negotiatedAmount') || 'Amount'}</p>
                        <p className="font-medium text-gray-900">
                          ${(Number(deal.negotiatedAmount) || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(deal.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">{t('mediation.employee.noRecentDeals') || 'No recent deals'}</p>
              <p className="text-sm text-gray-500 mt-2">
                {t('mediation.employee.noRecentDealsDesc') || 'Deals will appear here when your traders have active negotiations'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
