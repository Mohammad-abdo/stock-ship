import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Search, 
  Filter,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/stockshipApi';
import showToast from '@/lib/toast';

const AdminTraderUpdateRequests = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchUpdateRequests();
  }, [statusFilter]);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const fetchUpdateRequests = async () => {
    try {
      setLoading(true);
      const response = await adminApi.listTraderUpdateRequests({
        status: statusFilter || undefined
      });
      const data = response.data?.data || response.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching update requests:', error);
      showToast.error(t('mediation.trader.updateRequest.loadListFailed'));
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(req => 
        req.trader?.name?.toLowerCase().includes(searchLower) ||
        req.trader?.companyName?.toLowerCase().includes(searchLower) ||
        req.trader?.email?.toLowerCase().includes(searchLower) ||
        req.reason?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredRequests(filtered);
  };


  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: t('mediation.trader.updateRequest.status.pending') },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: t('mediation.trader.updateRequest.status.approved') },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: t('mediation.trader.updateRequest.status.rejected') },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle, label: t('mediation.trader.updateRequest.status.cancelled') },
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle, label: status };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
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
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('mediation.admin.traderUpdateRequests.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('mediation.trader.updateRequest.reviewSubtitle')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
              <Input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${isRTL ? 'pr-10' : 'pl-10'}`}
              />
            </div>
            <div className="relative">
              <Filter className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full ${isRTL ? 'pr-10' : 'pl-10'} py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 bg-white`}
              >
                <option value="">{t('mediation.trader.updateRequest.allStatus')}</option>
                <option value="PENDING">{t('mediation.trader.updateRequest.status.pending')}</option>
                <option value="APPROVED">{t('mediation.trader.updateRequest.status.approved')}</option>
                <option value="REJECTED">{t('mediation.trader.updateRequest.status.rejected')}</option>
                <option value="CANCELLED">{t('mediation.trader.updateRequest.status.cancelled')}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {t('mediation.trader.updateRequest.noRequestsFound')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-1">
                    <div className={`flex items-center gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <h3 className="font-semibold text-gray-900">
                          {request.trader?.name || t('common.unknown')}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {request.trader?.companyName || ''} • {request.trader?.email || ''}
                        </p>
                        {request.submittedByEmployeeId && (
                          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2 inline-block">
                            {t('mediation.trader.updateRequest.awaitingAdmin')}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>{t('mediation.trader.updateRequest.reason')}:</strong>{' '}
                      {request.reason?.trim()
                        ? request.reason
                        : t('mediation.trader.updateRequest.notApplicable')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('common.submittedAt')}: {new Date(request.createdAt).toLocaleString()}
                    </p>
                    {Object.keys(request.requestedData || {}).length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-xs font-semibold mb-1">
                          {t('mediation.trader.updateRequest.requestedChanges')}:
                        </p>
                        <ul className="text-xs text-gray-700 space-y-1">
                          {Object.entries(request.requestedData).slice(0, 3).map(([key, value]) => (
                            <li key={key}>
                              <strong>{key}:</strong> {String(value).substring(0, 50)}
                              {String(value).length > 50 ? '...' : ''}
                            </li>
                          ))}
                          {Object.keys(request.requestedData).length > 3 && (
                            <li className="text-gray-500">
                              +{Object.keys(request.requestedData).length - 3} {t('common.more')}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/stockship/admin/trader-update-requests/${request.id}`)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      {t('common.view')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </motion.div>
  );
};

export default AdminTraderUpdateRequests;

