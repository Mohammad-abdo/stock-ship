import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import StandardDataTable from '@/components/StandardDataTable';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { adminApi } from '@/lib/stockshipApi';
import showToast from '@/lib/toast';

const ViewReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [reportData, setReportData] = useState([]);
  const [reportInfo, setReportInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });

  useEffect(() => {
    fetchReportData();
  }, [id, filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Mock data based on report type
      const mockData = generateMockReportData(id);
      setReportData(mockData.data);
      setReportInfo(mockData.info);
    } catch (error) {
      console.error('Error fetching report data:', error);
      showToast.error(t('mediation.reports.loadFailed'), error.response?.data?.message || t('mediation.reports.tryAgain'));
    } finally {
      setLoading(false);
    }
  };

  const generateMockReportData = (reportId) => {
    const reportConfigs = {
      deals: {
        info: {
          name: t('mediation.reports.deals'),
          description: t('mediation.reports.dealsDesc'),
          totalRecords: 25,
          generatedAt: new Date().toISOString()
        },
        columns: [
          { key: 'dealNumber', label: t('mediation.deals.dealNumber') },
          { key: 'trader', label: t('mediation.deals.trader') },
          { key: 'client', label: t('mediation.deals.client') },
          { key: 'amount', label: t('mediation.deals.negotiatedAmount'), align: 'right' },
          { key: 'status', label: t('mediation.common.status') },
          { key: 'createdAt', label: t('mediation.deals.created') }
        ],
        data: Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          dealNumber: `DEAL-${String(i + 1).padStart(4, '0')}`,
          trader: `Trader ${i + 1}`,
          client: `Client ${i + 1}`,
          amount: (Math.random() * 100000).toFixed(2),
          status: ['NEGOTIATION', 'APPROVED', 'PAID', 'SETTLED'][Math.floor(Math.random() * 4)],
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }))
      },
      traders: {
        info: {
          name: t('mediation.reports.traders'),
          description: t('mediation.reports.tradersDesc'),
          totalRecords: 15,
          generatedAt: new Date().toISOString()
        },
        columns: [
          { key: 'code', label: t('mediation.traders.traderCode') },
          { key: 'companyName', label: t('mediation.traders.companyName') },
          { key: 'email', label: t('mediation.common.email') },
          { key: 'phone', label: t('mediation.common.phone') },
          { key: 'status', label: t('mediation.common.status') },
          { key: 'offers', label: t('mediation.traders.offers'), align: 'right' }
        ],
        data: Array.from({ length: 15 }, (_, i) => ({
          id: i + 1,
          code: `TRD-${String(i + 1).padStart(4, '0')}`,
          companyName: `Company ${i + 1}`,
          email: `trader${i + 1}@example.com`,
          phone: `+966${Math.floor(Math.random() * 1000000000)}`,
          status: Math.random() > 0.5 ? 'ACTIVE' : 'INACTIVE',
          offers: Math.floor(Math.random() * 50)
        }))
      },
      employees: {
        info: {
          name: t('mediation.reports.employees'),
          description: t('mediation.reports.employeesDesc'),
          totalRecords: 8,
          generatedAt: new Date().toISOString()
        },
        columns: [
          { key: 'code', label: t('mediation.employees.employeeCode') },
          { key: 'name', label: t('mediation.employees.name') },
          { key: 'email', label: t('mediation.common.email') },
          { key: 'commissionRate', label: t('mediation.employees.commissionRate'), align: 'right' },
          { key: 'traders', label: t('mediation.employees.traders'), align: 'right' },
          { key: 'status', label: t('mediation.common.status') }
        ],
        data: Array.from({ length: 8 }, (_, i) => ({
          id: i + 1,
          code: `EMP-${String(i + 1).padStart(4, '0')}`,
          name: `Employee ${i + 1}`,
          email: `employee${i + 1}@example.com`,
          commissionRate: (Math.random() * 5).toFixed(2),
          traders: Math.floor(Math.random() * 20),
          status: 'ACTIVE'
        }))
      },
      payments: {
        info: {
          name: t('mediation.reports.payments'),
          description: t('mediation.reports.paymentsDesc'),
          totalRecords: 42,
          generatedAt: new Date().toISOString()
        },
        columns: [
          { key: 'id', label: t('mediation.common.id') },
          { key: 'dealNumber', label: t('mediation.deals.dealNumber') },
          { key: 'amount', label: t('mediation.viewPayment.amount'), align: 'right' },
          { key: 'method', label: t('mediation.viewPayment.method') },
          { key: 'status', label: t('mediation.common.status') },
          { key: 'createdAt', label: t('mediation.viewPayment.createdAt') }
        ],
        data: Array.from({ length: 42 }, (_, i) => ({
          id: i + 1,
          dealNumber: `DEAL-${String(i + 1).padStart(4, '0')}`,
          amount: (Math.random() * 50000).toFixed(2),
          method: ['BANK_CARD', 'BANK_TRANSFER'][Math.floor(Math.random() * 2)],
          status: ['PENDING', 'COMPLETED', 'FAILED'][Math.floor(Math.random() * 3)],
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }))
      }
    };

    return reportConfigs[reportId] || {
      info: {
        name: t('mediation.reports.unknown'),
        description: '',
        totalRecords: 0,
        generatedAt: new Date().toISOString()
      },
      columns: [],
      data: []
    };
  };

  const handleDownload = async (format) => {
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

  const columns = reportInfo?.columns?.map(col => ({
    ...col,
    render: (value, row) => {
      if (col.key === 'status') {
        const statusColors = {
          ACTIVE: 'bg-green-100 text-green-800',
          INACTIVE: 'bg-gray-100 text-gray-800',
          NEGOTIATION: 'bg-yellow-100 text-yellow-800',
          APPROVED: 'bg-blue-100 text-blue-800',
          PAID: 'bg-green-100 text-green-800',
          SETTLED: 'bg-purple-100 text-purple-800',
          PENDING: 'bg-yellow-100 text-yellow-800',
          COMPLETED: 'bg-green-100 text-green-800',
          FAILED: 'bg-red-100 text-red-800'
        };
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {value}
          </span>
        );
      }
      if (col.key === 'amount' || col.key === 'commissionRate') {
        return (
          <span className="text-sm font-medium">
            {col.key === 'amount' ? `${Number(value).toLocaleString()} SAR` : `${value}%`}
          </span>
        );
      }
      if (col.key === 'createdAt') {
        return (
          <span className="text-sm text-gray-600">
            {new Date(value).toLocaleDateString()}
          </span>
        );
      }
      return <span className="text-sm">{value}</span>;
    }
  })) || [];

  if (loading && !reportInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.reports.loading')}</p>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/stockship/admin/reports')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{reportInfo?.name || t('mediation.reports.report')}</h1>
            <p className="text-muted-foreground mt-2">{reportInfo?.description || ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchReportData()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t('mediation.reports.refresh')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleDownload('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t('mediation.reports.downloadCSV')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleDownload('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t('mediation.reports.downloadPDF')}
          </motion.button>
        </div>
      </div>

      {/* Report Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">{t('mediation.reports.totalRecords')}</p>
                <p className="text-lg font-semibold">{reportInfo?.totalRecords || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">{t('mediation.reports.generatedAt')}</p>
                <p className="text-lg font-semibold">
                  {reportInfo?.generatedAt ? new Date(reportInfo.generatedAt).toLocaleString() : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">{t('mediation.reports.filters')}</p>
                <p className="text-lg font-semibold">
                  {Object.values(filters).filter(v => v).length} {t('mediation.reports.active')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Data Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {t('mediation.reports.reportData')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <StandardDataTable
            columns={columns}
            data={reportData}
            loading={loading}
            emptyMessage={t('mediation.reports.noData')}
            searchable={true}
            searchPlaceholder={t('mediation.reports.searchData')}
            compact={false}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ViewReport;




