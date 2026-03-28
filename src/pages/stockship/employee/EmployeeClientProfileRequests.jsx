import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { employeeApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';

const STATUS_KEYS = {
  DRAFT: { bg: 'bg-slate-100', text: 'text-slate-800', icon: FileText, labelKey: 'draft' },
  PENDING_APPROVAL: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, labelKey: 'pending' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, labelKey: 'approved' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, labelKey: 'rejected' },
  CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle, labelKey: 'cancelled' }
};

export default function EmployeeClientProfileRequests() {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { getAuth } = useMultiAuth();
  const { user } = getAuth('employee');

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const tk = useCallback((k, fb) => t(`mediation.employee.clientProfileRequest.${k}`) || fb, [t]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await employeeApi.listClientProfileRequests({
        status: statusFilter || undefined
      });
      const data = res.data?.data ?? res.data;
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      showToast.error(tk('loadFailed', 'Failed to load requests'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, tk]);

  useEffect(() => {
    if (user?.id) load();
  }, [user?.id, load]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return requests;
    const q = searchTerm.toLowerCase();
    return requests.filter(
      (r) =>
        r.client?.name?.toLowerCase().includes(q) ||
        r.client?.email?.toLowerCase().includes(q)
    );
  }, [requests, searchTerm]);

  const badge = (status) => {
    const cfg = STATUS_KEYS[status] || {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      icon: AlertCircle,
      labelKey: status
    };
    const Icon = cfg.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
      >
        <Icon className="w-3 h-3" />
        {tk(`status.${cfg.labelKey}`, cfg.labelKey)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tk('title', 'Client profile requests')}</h1>
          <p className="text-muted-foreground mt-2">{tk('subtitle', 'Draft changes and submit for admin approval')}</p>
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isRTL ? '' : ''}`}>
            <div className="relative">
              <Search
                className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`}
              />
              <Input
                placeholder={t('common.search') || 'Search...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={isRTL ? 'pr-10' : 'pl-10'}
              />
            </div>
            <div className="relative">
              <Filter
                className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full py-2.5 border border-gray-200 rounded-lg bg-white ${isRTL ? 'pr-10' : 'pl-10'}`}
              >
                <option value="">{tk('allStatus', 'All statuses')}</option>
                <option value="DRAFT">{tk('status.draft', 'Draft')}</option>
                <option value="PENDING_APPROVAL">{tk('status.pending', 'Pending approval')}</option>
                <option value="APPROVED">{tk('status.approved', 'Approved')}</option>
                <option value="REJECTED">{tk('status.rejected', 'Rejected')}</option>
                <option value="CANCELLED">{tk('status.cancelled', 'Cancelled')}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-40" />
            {tk('empty', 'No requests yet. Open a deal and use “Propose profile update”.')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((r) => (
            <Card key={r.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className={`flex flex-wrap items-start justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{r.client?.name || '—'}</h3>
                      <p className="text-sm text-gray-500">{r.client?.email}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {tk('created', 'Created')}: {new Date(r.createdAt).toLocaleString()}
                        {r.submittedAt &&
                          ` · ${tk('submitted', 'Submitted')}: ${new Date(r.submittedAt).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {badge(r.status)}
                    <Button variant="outline" size="sm" onClick={() => navigate(`/stockship/employee/client-profile-requests/${r.id}`)}>
                      <Eye className="w-4 h-4 me-1" />
                      {t('common.view') || 'View'}
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
}
