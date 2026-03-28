import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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

  const location = useLocation();

  useEffect(() => {
    // If we have state from the caller and filters haven't changed, use it
    if (location.state?.generatedData && !Object.values(filters).some(v => v)) {
      setReportData(location.state.generatedData.results);
      setReportInfo(location.state.generatedData.info);
      setLoading(false);
    } else {
      fetchReportData();
    }
  }, [id, filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await adminApi.generateReport(id, filters);
      const generatedData = response.data?.data;
      if (generatedData) {
        setReportData(generatedData.results);
        setReportInfo(generatedData.info);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      showToast.error(t('mediation.reports.loadFailed'), error.response?.data?.message || t('mediation.reports.tryAgain'));
    } finally {
      setLoading(false);
    }
  };

  const getReportColumns = (reportId) => {
    const reportConfigs = {
      deals: {
        columns: [
          { key: 'dealNumber', label: t('mediation.deals.dealNumber') || 'رقم الصفقة' },
          { key: 'trader', label: t('mediation.deals.trader') || 'التاجر' },
          { key: 'client', label: t('mediation.deals.client') || 'العميل' },
          { key: 'amount', label: t('mediation.deals.negotiatedAmount') || 'المبلغ', align: 'right' },
          { key: 'status', label: t('mediation.common.status') || 'الحالة' },
          { key: 'createdAt', label: t('mediation.deals.created') || 'التاريخ' }
        ]
      },
      negotiations: {
        columns: [
          { key: 'dealNumber', label: 'رقم الصفقة' },
          { key: 'senderType', label: 'المرسل' },
          { key: 'messageType', label: 'نوع الرسالة' },
          { key: 'proposedPrice', label: 'السعر المقترح', align: 'right' },
          { key: 'proposedQuantity', label: 'الكمية المقترحة', align: 'right' },
          { key: 'status', label: 'حالة الصفقة' },
          { key: 'createdAt', label: 'تاريخ الرسالة' }
        ]
      },
      commission: {
        columns: [
          { key: 'dealNumber', label: 'رقم الصفقة' },
          { key: 'totalAmount', label: 'المبلغ الإجمالي', align: 'right' },
          { key: 'platformCommission', label: 'عمولة المنصة', align: 'right' },
          { key: 'employeeCommission', label: 'عمولة الموظف', align: 'right' },
          { key: 'employeeName', label: 'اسم الموظف' },
          { key: 'status', label: 'الحالة' },
          { key: 'createdAt', label: 'التاريخ' }
        ]
      },
      users: {
        columns: [
          { key: 'name', label: 'الاسم/الشركة' },
          { key: 'email', label: 'البريد الإلكتروني' },
          { key: 'phone', label: 'رقم الهاتف' },
          { key: 'userType', label: 'نوع المستخدم' },
          { key: 'status', label: 'الحالة' },
          { key: 'createdAt', label: 'تاريخ التسجيل' }
        ]
      }
    };

    return reportConfigs[reportId]?.columns || [];
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

  const columns = getReportColumns(id).map(col => ({
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
      if (col.key === 'amount' || col.key === 'commissionRate' || col.key === 'proposedPrice' || col.key === 'totalAmount' || col.key === 'platformCommission' || col.key === 'employeeCommission') {
        return (
          <span className="text-sm font-medium">
            {col.key.toLowerCase().includes('rate') ? `${value}%` : `${Number(value || 0).toLocaleString()} SAR`}
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




