import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Activity, 
  User, 
  FileText, 
  Globe, 
  MapPin, 
  Calendar, 
  Clock,
  Code,
  Database,
  Info,
  Shield,
  Eye
} from 'lucide-react';
import showToast from '@/lib/toast';

const ViewActivityLog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState(null);

  useEffect(() => {
    fetchLog();
  }, [id]);

  const fetchLog = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getActivityLog(id);
      setLog(response.data?.data || response.data);
    } catch (error) {
      console.error('Error fetching activity log:', error);
      showToast.error(
        t('admin.activityLogs.loadDetailsFailed') || 'Failed to load log details',
        error.response?.data?.message || 'Log not found'
      );
      navigate('/stockship/admin/activity-logs');
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (log) => {
    const user = log.admin || log.employee || log.trader || log.client || {};
    return user.name || user.email || t('common.unknown') || 'Unknown';
  };

  const getUserEmail = (log) => {
    const user = log.admin || log.employee || log.trader || log.client || {};
    return user.email || '';
  };

  const getUserCode = (log) => {
    const user = log.admin || log.employee || log.trader || log.client || {};
    return user.employeeCode || user.traderCode || '';
  };

  const formatDate = (date) => {
    if (!date) return t('common.notAvailable') || 'N/A';
    return new Date(date).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionBadge = (action) => {
    const actionColors = {
      'CREATE': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'DELETE': 'bg-red-100 text-red-800',
      'VIEW': 'bg-gray-100 text-gray-800',
      'LOGIN': 'bg-purple-100 text-purple-800',
      'LOGOUT': 'bg-orange-100 text-orange-800',
      'APPROVE': 'bg-emerald-100 text-emerald-800',
      'REJECT': 'bg-red-100 text-red-800',
      'VALIDATE': 'bg-indigo-100 text-indigo-800',
      'SETTLE': 'bg-teal-100 text-teal-800',
      'CANCEL': 'bg-gray-100 text-gray-800'
    };
    
    const color = Object.keys(actionColors).find(key => 
      action?.toUpperCase().includes(key)
    );
    
    return (
      <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
        color ? actionColors[color] : 'bg-gray-100 text-gray-800'
      }`}>
        {action || t('common.unknown')}
      </span>
    );
  };

  const getUserTypeBadge = (userType) => {
    const typeColors = {
      'ADMIN': 'bg-purple-100 text-purple-800',
      'EMPLOYEE': 'bg-blue-100 text-blue-800',
      'TRADER': 'bg-green-100 text-green-800',
      'CLIENT': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
        typeColors[userType] || 'bg-gray-100 text-gray-800'
      }`}>
        {userType || t('common.unknown')}
      </span>
    );
  };

  const parseJSON = (jsonString) => {
    try {
      if (!jsonString) return null;
      return JSON.parse(jsonString);
    } catch (error) {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!log) {
    return null;
  }

  const changes = parseJSON(log.changes);
  const metadata = parseJSON(log.metadata);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/stockship/admin/activity-logs')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </motion.button>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('admin.activityLogs.logDetails') || 'Activity Log Details'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('admin.activityLogs.id') || 'ID'}: #{log.id}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {getActionBadge(log.action)}
          {getUserTypeBadge(log.userType)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Info className="w-5 h-5" />
                {t('admin.activityLogs.basicInfo') || 'Basic Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <label className={`text-sm font-medium text-gray-500 block ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('admin.activityLogs.id') || 'ID'}
                  </label>
                  <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <Code className="w-4 h-4 text-gray-400" />
                    <p className="text-lg font-mono font-semibold">#{log.id}</p>
                  </div>
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <label className={`text-sm font-medium text-gray-500 block ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('admin.activityLogs.action') || 'Action'}
                  </label>
                  <div className="mt-1">{getActionBadge(log.action)}</div>
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <label className={`text-sm font-medium text-gray-500 block ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('admin.activityLogs.userType') || 'User Type'}
                  </label>
                  <div className="mt-1">{getUserTypeBadge(log.userType)}</div>
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <label className={`text-sm font-medium text-gray-500 block ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('admin.activityLogs.entityType') || 'Entity Type'}
                  </label>
                  <p className="text-lg font-semibold mt-1">
                    {log.entityType || t('common.notAvailable')}
                  </p>
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <label className={`text-sm font-medium text-gray-500 block ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('admin.activityLogs.entityId') || 'Entity ID'}
                  </label>
                  <p className="text-lg font-mono font-semibold mt-1">
                    {log.entityId ? `#${log.entityId}` : t('common.notAvailable')}
                  </p>
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <label className={`text-sm font-medium text-gray-500 block ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('admin.activityLogs.createdAt') || 'Created At'}
                  </label>
                  <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <Clock className="w-4 h-4 text-gray-400" />
                    <p className="text-sm">{formatDate(log.createdAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {log.description && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <FileText className="w-5 h-5" />
                  {t('admin.activityLogs.description') || 'Description'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className={`text-sm text-gray-700 whitespace-pre-wrap ${isRTL ? 'text-right' : 'text-left'}`}>
                  {log.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Changes */}
          {changes && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Database className="w-5 h-5" />
                  {t('admin.activityLogs.changes') || 'Changes'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(changes, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {metadata && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Code className="w-5 h-5" />
                  {t('admin.activityLogs.metadata') || 'Metadata'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(metadata, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Information */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <User className="w-5 h-5" />
                {t('admin.activityLogs.userInfo') || 'User Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <label className={`text-sm font-medium text-gray-500 block ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('admin.activityLogs.user') || 'User'}
                </label>
                <p className="text-lg font-semibold mt-1">{getUserName(log)}</p>
                {getUserEmail(log) && (
                  <p className="text-sm text-gray-500 mt-1">{getUserEmail(log)}</p>
                )}
                {getUserCode(log) && (
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    {t('admin.activityLogs.code') || 'Code'}: {getUserCode(log)}
                  </p>
                )}
              </div>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <label className={`text-sm font-medium text-gray-500 block ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('admin.activityLogs.userId') || 'User ID'}
                </label>
                <p className="text-sm font-mono mt-1">
                  {log.userId ? `#${log.userId}` : t('common.notAvailable')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Technical Information */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Shield className="w-5 h-5" />
                {t('admin.activityLogs.technicalInfo') || 'Technical Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {log.ipAddress && (
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <label className={`text-sm font-medium text-gray-500 block ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('admin.activityLogs.ipAddress') || 'IP Address'}
                  </label>
                  <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <Globe className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-mono">{log.ipAddress}</p>
                  </div>
                </div>
              )}
              {log.location && (
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <label className={`text-sm font-medium text-gray-500 block ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('admin.activityLogs.location') || 'Location'}
                  </label>
                  <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <p className="text-sm">{log.location}</p>
                  </div>
                </div>
              )}
              {log.userAgent && (
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <label className={`text-sm font-medium text-gray-500 block ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('admin.activityLogs.userAgent') || 'User Agent'}
                  </label>
                  <p className="text-xs text-gray-600 mt-1 break-words">
                    {log.userAgent}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamp Information */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Calendar className="w-5 h-5" />
                {t('admin.activityLogs.timestampInfo') || 'Timestamp Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <label className={`text-sm font-medium text-gray-500 block ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('admin.activityLogs.createdAt') || 'Created At'}
                </label>
                <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  <Clock className="w-4 h-4 text-gray-400" />
                  <p className="text-sm">{formatDate(log.createdAt)}</p>
                </div>
              </div>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <label className={`text-sm font-medium text-gray-500 block ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('admin.activityLogs.timeAgo') || 'Time Ago'}
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  {(() => {
                    const now = new Date();
                    const created = new Date(log.createdAt);
                    const diff = now - created;
                    const seconds = Math.floor(diff / 1000);
                    const minutes = Math.floor(seconds / 60);
                    const hours = Math.floor(minutes / 60);
                    const days = Math.floor(hours / 24);
                    
                    if (days > 0) return `${days} ${t('admin.activityLogs.daysAgo') || 'days ago'}`;
                    if (hours > 0) return `${hours} ${t('admin.activityLogs.hoursAgo') || 'hours ago'}`;
                    if (minutes > 0) return `${minutes} ${t('admin.activityLogs.minutesAgo') || 'minutes ago'}`;
                    return `${seconds} ${t('admin.activityLogs.secondsAgo') || 'seconds ago'}`;
                  })()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default ViewActivityLog;









