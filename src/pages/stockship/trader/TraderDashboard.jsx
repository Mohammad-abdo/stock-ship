import { useState, useEffect } from "react";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { traderApi, offerApi, dealApi } from "@/lib/mediationApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/StatCard";
import { motion } from "framer-motion";
import { 
  Package, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  PieChart,
  ShoppingCart,
  Users,
  Activity,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function TraderDashboard() {
  const { getAuth } = useMultiAuth();
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { user } = getAuth('trader');
  const [stats, setStats] = useState({
    offers: { total: 0, active: 0, pending: 0, rejected: 0 },
    deals: { total: 0, active: 0, completed: 0 },
    recentOffers: [],
    recentDeals: [],
    statistics: {
      offersByStatus: [],
      dealsByStatus: [],
      totalPayments: 0,
      paymentCount: 0,
      totalTransactions: 0,
      totalTraderAmount: 0
    },
    employee: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    try {
      // Get full trader details with statistics
      const traderRes = await traderApi.getTraderById(user.id);
      const trader = traderRes.data.data || traderRes.data;
      
      const offers = trader.offers || [];
      const deals = trader.deals || [];
      const statistics = trader.statistics || {};
      
      // Also fetch deals filtered by traderId if needed
      let allDeals = deals;
      if (deals.length === 0) {
        try {
          const dealsRes = await dealApi.getDeals({ traderId: user.id, limit: 100 });
          allDeals = dealsRes.data.data || dealsRes.data || [];
        } catch (err) {
          console.warn('Could not fetch deals:', err);
        }
      }

      setStats({
        offers: {
          total: trader._count?.offers || offers.length,
          active: offers.filter(o => o.status === 'ACTIVE').length,
          pending: offers.filter(o => o.status === 'PENDING_VALIDATION').length,
          rejected: offers.filter(o => o.status === 'REJECTED').length
        },
        deals: {
          total: trader._count?.deals || allDeals.length,
          active: allDeals.filter(d => ['NEGOTIATION', 'APPROVED', 'PAID'].includes(d.status)).length,
          completed: allDeals.filter(d => d.status === 'SETTLED').length
        },
        recentOffers: offers.slice(0, 5),
        recentDeals: allDeals.slice(0, 5),
        statistics,
        employee: trader.employee
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0.00';
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      PENDING_VALIDATION: 'bg-yellow-100 text-yellow-800',
      REJECTED: 'bg-red-100 text-red-800',
      DRAFT: 'bg-gray-100 text-gray-800',
      NEGOTIATION: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      PAID: 'bg-purple-100 text-purple-800',
      SETTLED: 'bg-indigo-100 text-indigo-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {language === 'ar' ? 'لوحة تحكم التاجر' : 'Trader Dashboard'}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-muted-foreground">
              {language === 'ar' ? 'مرحباً بعودتك' : 'Welcome back'}, <span className="font-semibold text-gray-900">{user?.name}</span>
            </p>
            {user?.traderCode && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono">
                {user.traderCode}
              </span>
            )}
          </div>
          {stats.employee && (
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'ar' ? 'الموظف المسؤول' : 'Assigned Employee'}: <span className="font-medium">{stats.employee.name} ({stats.employee.employeeCode})</span>
            </p>
          )}
        </div>
        <Link
          to="/stockship/trader/offers/create"
          className={`flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <Plus className="w-5 h-5" />
          <span>{language === 'ar' ? 'إنشاء إعلان' : 'Create Offer'}</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {language === 'ar' ? 'إجمالي الإعلانات' : 'Total Offers'}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">{stats.offers.total}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {stats.offers.active} {language === 'ar' ? 'نشط' : 'active'}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {language === 'ar' ? 'إجمالي الصفقات' : 'Total Deals'}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">{stats.deals.total}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-blue-600 flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {stats.deals.active} {language === 'ar' ? 'نشط' : 'active'}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <ShoppingCart className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {language === 'ar' ? 'إجمالي المدفوعات' : 'Total Payments'}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(stats.statistics.totalPayments)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {stats.statistics.paymentCount} {language === 'ar' ? 'دفعة' : 'payments'}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {language === 'ar' ? 'صافي الأرباح' : 'Net Earnings'}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(stats.statistics.totalTraderAmount)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {stats.statistics.transactionCount} {language === 'ar' ? 'معاملة' : 'transactions'}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts and Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offers by Status Chart */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <BarChart3 className="w-5 h-5 text-gray-600" />
              {language === 'ar' ? 'الإعلانات حسب الحالة' : 'Offers by Status'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {stats.statistics.offersByStatus && stats.statistics.offersByStatus.length > 0 ? (
              <div className="space-y-4">
                {stats.statistics.offersByStatus.map((item, index) => {
                  const total = stats.statistics.offersByStatus.reduce((sum, i) => sum + (i._count?.status || 0), 0);
                  const percentage = total > 0 ? ((item._count?.status || 0) / total) * 100 : 0;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{item.status}</span>
                        <span className="text-sm font-bold text-gray-900">{item._count?.status || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className={`h-2.5 rounded-full ${
                            item.status === 'ACTIVE' ? 'bg-green-500' :
                            item.status === 'PENDING_VALIDATION' ? 'bg-yellow-500' :
                            item.status === 'REJECTED' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">{language === 'ar' ? 'لا توجد بيانات' : 'No data available'}</p>
            )}
          </CardContent>
        </Card>

        {/* Deals by Status Chart */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <PieChart className="w-5 h-5 text-gray-600" />
              {language === 'ar' ? 'الصفقات حسب الحالة' : 'Deals by Status'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {stats.statistics.dealsByStatus && stats.statistics.dealsByStatus.length > 0 ? (
              <div className="space-y-4">
                {stats.statistics.dealsByStatus.map((item, index) => {
                  const total = stats.statistics.dealsByStatus.reduce((sum, i) => sum + (i._count?.status || 0), 0);
                  const percentage = total > 0 ? ((item._count?.status || 0) / total) * 100 : 0;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{item.status}</span>
                        <span className="text-sm font-bold text-gray-900">{item._count?.status || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className={`h-2.5 rounded-full ${
                            item.status === 'SETTLED' ? 'bg-indigo-500' :
                            item.status === 'PAID' ? 'bg-purple-500' :
                            item.status === 'APPROVED' ? 'bg-green-500' :
                            item.status === 'NEGOTIATION' ? 'bg-blue-500' :
                            'bg-gray-500'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">{language === 'ar' ? 'لا توجد بيانات' : 'No data available'}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Offers */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Package className="w-5 h-5 text-gray-600" />
                {language === 'ar' ? 'الإعلانات الأخيرة' : 'Recent Offers'}
              </CardTitle>
              <Link
                to="/stockship/trader/offers"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {language === 'ar' ? 'عرض الكل' : 'View All'}
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {stats.recentOffers.length > 0 ? (
              <div className="space-y-3">
                {stats.recentOffers.map((offer) => (
                  <motion.div
                    key={offer.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => navigate(`/stockship/trader/offers/${offer.id}`)}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">{offer.title || 'N/A'}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(offer.status)}`}>
                          {offer.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {offer._count?.items || 0} {language === 'ar' ? 'عنصر' : 'items'}
                        </span>
                        {offer.totalCBM && (
                          <span className="text-xs text-gray-500">
                            {parseFloat(offer.totalCBM).toFixed(2)} CBM
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`text-right ${isRTL ? 'text-left' : ''}`}>
                      <p className="text-xs text-gray-500">
                        {new Date(offer.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد إعلانات' : 'No offers yet'}</p>
                <Link
                  to="/stockship/trader/offers/create"
                  className="text-sm text-gray-600 hover:text-gray-900 mt-2 inline-block"
                >
                  {language === 'ar' ? 'إنشاء أول إعلان' : 'Create your first offer'}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Deals */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                {language === 'ar' ? 'الصفقات الأخيرة' : 'Recent Deals'}
              </CardTitle>
              <Link
                to="/stockship/trader/deals"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {language === 'ar' ? 'عرض الكل' : 'View All'}
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {stats.recentDeals.length > 0 ? (
              <div className="space-y-3">
                {stats.recentDeals.map((deal) => (
                  <motion.div
                    key={deal.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => navigate(`/stockship/trader/deals/${deal.id}`)}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1 font-mono">{deal.dealNumber}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(deal.status)}`}>
                          {deal.status}
                        </span>
                        {deal.client && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {deal.client.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`text-right ${isRTL ? 'text-left' : ''}`}>
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(deal.negotiatedAmount || 0)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(deal.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد صفقات' : 'No deals yet'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

