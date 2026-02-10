import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  Store, 
  Briefcase, 
  ShoppingCart, 
  CreditCard, 
  DollarSign,
  Eye,
  Package,
  Search,
  Filter,
  Clock,
  Plus,
  X,
  Loader2
} from 'lucide-react';
import { adminApi } from '@/lib/stockshipApi';
import showToast from '@/lib/toast';

const AdminReports = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    format: 'csv'
  });

  // Use useMemo to prevent infinite re-renders
  const reportTypes = useMemo(() => [
    {
      id: 'deals',
      name: t('mediation.reports.deals'),
      description: t('mediation.reports.dealsDesc'),
      icon: ShoppingCart,
      category: 'transactions',
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
      lastGenerated: null,
      recordCount: 0,
      filters: ['status', 'dateRange']
    },
    {
      id: 'traders',
      name: t('mediation.reports.traders'),
      description: t('mediation.reports.tradersDesc'),
      icon: Store,
      category: 'entities',
      color: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-100',
      lastGenerated: null,
      recordCount: 0,
      filters: ['status', 'dateRange']
    },
    {
      id: 'employees',
      name: t('mediation.reports.employees'),
      description: t('mediation.reports.employeesDesc'),
      icon: Briefcase,
      category: 'entities',
      color: 'bg-purple-50 text-purple-600',
      iconBg: 'bg-purple-100',
      lastGenerated: null,
      recordCount: 0,
      filters: ['status', 'dateRange']
    },
    {
      id: 'clients',
      name: t('mediation.reports.clients'),
      description: t('mediation.reports.clientsDesc'),
      icon: Users,
      category: 'entities',
      color: 'bg-indigo-50 text-indigo-600',
      iconBg: 'bg-indigo-100',
      lastGenerated: null,
      recordCount: 0,
      filters: ['status', 'dateRange']
    },
    {
      id: 'offers',
      name: t('mediation.reports.offers'),
      description: t('mediation.reports.offersDesc'),
      icon: Package,
      category: 'entities',
      color: 'bg-orange-50 text-orange-600',
      iconBg: 'bg-orange-100',
      lastGenerated: null,
      recordCount: 0,
      filters: ['status', 'dateRange']
    },
    {
      id: 'payments',
      name: t('mediation.reports.payments'),
      description: t('mediation.reports.paymentsDesc'),
      icon: CreditCard,
      category: 'transactions',
      color: 'bg-cyan-50 text-cyan-600',
      iconBg: 'bg-cyan-100',
      lastGenerated: null,
      recordCount: 0,
      filters: ['status', 'method', 'dateRange']
    },
    {
      id: 'revenue',
      name: t('mediation.reports.revenue'),
      description: t('mediation.reports.revenueDesc'),
      icon: DollarSign,
      category: 'financial',
      color: 'bg-emerald-50 text-emerald-600',
      iconBg: 'bg-emerald-100',
      lastGenerated: null,
      recordCount: 0,
      filters: ['dateRange']
    },
    {
      id: 'commission',
      name: t('mediation.reports.commission'),
      description: t('mediation.reports.commissionDesc'),
      icon: TrendingUp,
      category: 'financial',
      color: 'bg-pink-50 text-pink-600',
      iconBg: 'bg-pink-100',
      lastGenerated: null,
      recordCount: 0,
      filters: ['dateRange', 'employee']
    }
  ], [t]);

  useEffect(() => {
    setReports(reportTypes);
  }, [reportTypes]);

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || report.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: t('mediation.reports.allCategories') || 'All Categories' },
    { value: 'entities', label: t('mediation.reports.entities') || 'Entities' },
    { value: 'transactions', label: t('mediation.reports.transactions') || 'Transactions' },
    { value: 'financial', label: t('mediation.reports.financial') || 'Financial' }
  ];

  const handleGenerateReport = (report, e) => {
    e.stopPropagation();
    setSelectedReport(report);
    setReportFilters({
      startDate: '',
      endDate: '',
      status: '',
      method: '',
      format: 'csv'
    });
    setShowGenerateModal(true);
  };

  const handleGenerate = async () => {
    if (!selectedReport) return;

    try {
      setGenerating(true);
      showToast.info(t('mediation.reports.generating'), t('mediation.reports.pleaseWait'));

      // TODO: Call backend API to generate report
      // const response = await adminApi.generateReport(selectedReport.id, reportFilters);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update report with new generation time
      setReports(prev => prev.map(r => 
        r.id === selectedReport.id 
          ? { ...r, lastGenerated: new Date().toISOString() }
          : r
      ));

      showToast.success(
        t('mediation.reports.generated'), 
        t('mediation.reports.reportGeneratedSuccess') || 'Report generated successfully'
      );
      
      setShowGenerateModal(false);
      
      // Navigate to view the generated report
      navigate(`/stockship/admin/reports/${selectedReport.id}/view`, {
        state: { filters: reportFilters }
      });
    } catch (error) {
      console.error('Error generating report:', error);
      showToast.error(
        t('mediation.reports.generationFailed'), 
        error.response?.data?.message || t('mediation.reports.tryAgain')
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (reportId, format, e) => {
    e.stopPropagation();
    try {
      showToast.info(t('mediation.reports.generating'), t('mediation.reports.pleaseWait'));
      // TODO: Implement actual download
      setTimeout(() => {
        showToast.success(t('mediation.reports.downloadStarted'), t('mediation.reports.downloadInProgress'));
      }, 1000);
    } catch (error) {
      console.error('Error downloading report:', error);
      showToast.error(t('mediation.reports.downloadFailed'), error.response?.data?.message || t('mediation.reports.tryAgain'));
    }
  };

  const getStatusOptions = (reportId) => {
    const statusMap = {
      deals: ['NEGOTIATION', 'APPROVED', 'PAID', 'SETTLED', 'CANCELLED'],
      traders: ['ACTIVE', 'INACTIVE', 'VERIFIED', 'UNVERIFIED'],
      employees: ['ACTIVE', 'INACTIVE'],
      clients: ['ACTIVE', 'INACTIVE'],
      offers: ['DRAFT', 'PENDING', 'VALIDATED', 'REJECTED', 'EXPIRED'],
      payments: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED']
    };
    return statusMap[reportId] || [];
  };

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
          <h1 className="text-3xl font-bold text-gray-900">{t('mediation.reports.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('mediation.reports.subtitle')}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            // Show generate modal for first report or create new
            if (reports.length > 0) {
              handleGenerateReport(reports[0], { stopPropagation: () => {} });
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('mediation.reports.generateReport') || 'Generate Report'}
        </motion.button>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('mediation.reports.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white appearance-none min-w-[180px]"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400 mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('mediation.reports.loading') || 'Loading reports...'}</p>
          </div>
        </div>
      ) : filteredReports.length === 0 ? (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">{t('mediation.reports.noReports')}</p>
            <p className="text-sm text-gray-500 mt-2">{t('mediation.reports.noReportsDesc') || 'Try adjusting your search or filters'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredReports.map((report, index) => {
            const Icon = report.icon;
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card 
                  className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                  onClick={() => navigate(`/stockship/admin/reports/${report.id}/view`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${report.iconBg} group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className={`w-6 h-6 ${report.color.split(' ')[1]}`} />
                      </div>
                      <div className="flex items-center gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateReport(report, e);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title={t('mediation.reports.generateReport') || 'Generate Report'}
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/stockship/admin/reports/${report.id}/view`);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title={t('mediation.reports.viewReport')}
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleDownload(report.id, 'csv', e)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title={t('mediation.reports.downloadCSV')}
                        >
                          <Download className="w-4 h-4 text-gray-600" />
                        </motion.button>
                      </div>
                    </div>
                    <CardTitle className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                      {report.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {report.description}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize`}>
                          {report.category}
                        </span>
                      </div>
                      {report.lastGenerated && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(report.lastGenerated).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    {report.recordCount > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {report.recordCount} {t('mediation.reports.records')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('mediation.reports.totalReports') || 'Total Reports'}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{reports.length}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('mediation.reports.availableReports')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{filteredReports.length}</p>
              </div>
              <Download className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('mediation.reports.categories') || 'Categories'}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{categories.length - 1}</p>
              </div>
              <Filter className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Report Modal */}
      <AnimatePresence>
        {showGenerateModal && selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !generating && setShowGenerateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {t('mediation.reports.generateReport') || 'Generate Report'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedReport.name}</p>
                </div>
                <button
                  onClick={() => !generating && setShowGenerateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={generating}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Date Range */}
                {selectedReport.filters?.includes('dateRange') && (
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">
                      {t('mediation.reports.dateRange') || 'Date Range'}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          {t('mediation.reports.startDate') || 'Start Date'}
                        </label>
                        <input
                          type="date"
                          value={reportFilters.startDate}
                          onChange={(e) => setReportFilters(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                          disabled={generating}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          {t('mediation.reports.endDate') || 'End Date'}
                        </label>
                        <input
                          type="date"
                          value={reportFilters.endDate}
                          onChange={(e) => setReportFilters(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                          disabled={generating}
                          min={reportFilters.startDate}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Filter */}
                {selectedReport.filters?.includes('status') && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      {t('mediation.common.status')}
                    </label>
                    <select
                      value={reportFilters.status}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                      disabled={generating}
                    >
                      <option value="">{t('mediation.reports.allStatus') || 'All Status'}</option>
                      {getStatusOptions(selectedReport.id).map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Payment Method Filter */}
                {selectedReport.filters?.includes('method') && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      {t('mediation.payments.paymentMethod')}
                    </label>
                    <select
                      value={reportFilters.method}
                      onChange={(e) => setReportFilters(prev => ({ ...prev, method: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                      disabled={generating}
                    >
                      <option value="">{t('mediation.reports.allMethods') || 'All Methods'}</option>
                      <option value="BANK_CARD">Bank Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="WALLET">Wallet</option>
                    </select>
                  </div>
                )}

                {/* Format Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    {t('mediation.reports.exportFormat') || 'Export Format'}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['csv', 'excel', 'pdf'].map((format) => (
                      <button
                        key={format}
                        onClick={() => setReportFilters(prev => ({ ...prev, format }))}
                        disabled={generating}
                        className={`px-4 py-2 border rounded-lg transition-colors ${
                          reportFilters.format === format
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  disabled={generating}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('mediation.reports.generating') || 'Generating...'}
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      {t('mediation.reports.generate') || 'Generate'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminReports;
