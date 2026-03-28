import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { Eye, Loader2, User, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import showToast from '@/lib/toast';

const STATUS_STYLE = {
  DRAFT: { icon: FileText, className: 'bg-slate-100 text-slate-800' },
  PENDING_APPROVAL: { icon: Clock, className: 'bg-amber-100 text-amber-900' },
  APPROVED: { icon: CheckCircle, className: 'bg-green-100 text-green-800' },
  REJECTED: { icon: XCircle, className: 'bg-red-100 text-red-800' },
  CANCELLED: { icon: XCircle, className: 'bg-gray-100 text-gray-700' }
};

export default function AdminClientProfileRequests() {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const tk = useCallback((k, fb) => t(`mediation.admin.clientProfileRequest.${k}`) || fb, [t]);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [statusFilter, setStatusFilter] = useState('PENDING_APPROVAL');

  const load = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const res = await adminApi.listClientProfileRequests({
          page,
          limit: 20,
          status: statusFilter || undefined
        });
        const payload = res.data?.data ?? res.data;
        setItems(payload?.items ?? []);
        if (payload?.pagination) setPagination(payload.pagination);
      } catch (e) {
        console.error(e);
        showToast.error(tk('loadFailed', 'Failed to load requests'));
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, tk]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{tk('title', 'Client profile requests')}</h1>
        <p className="text-gray-500 mt-1">{tk('subtitle', 'Review employee-proposed client profile changes')}</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{tk('filter', 'Status')}</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 bg-white max-w-xs"
          >
            <option value="">{tk('all', 'All')}</option>
            <option value="PENDING_APPROVAL">{tk('pending', 'Pending approval')}</option>
            <option value="DRAFT">{tk('draft', 'Draft')}</option>
            <option value="APPROVED">{tk('approved', 'Approved')}</option>
            <option value="REJECTED">{tk('rejected', 'Rejected')}</option>
            <option value="CANCELLED">{tk('cancelled', 'Cancelled')}</option>
          </select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">{tk('empty', 'No requests')}</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const st = STATUS_STYLE[r.status] || STATUS_STYLE.DRAFT;
            const Icon = st.icon;
            return (
              <Card key={r.id} className="border-gray-200">
                <CardContent className="p-4">
                  <div className={`flex flex-wrap items-center justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                        <User className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{r.client?.name || '—'}</p>
                        <p className="text-sm text-gray-500">{r.client?.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {tk('by', 'By')}: {r.submittedByEmployee?.name} ({r.submittedByEmployee?.employeeCode})
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${st.className}`}>
                        <Icon className="w-3 h-3" />
                        {r.status}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/stockship/admin/client-profile-requests/${r.id}`)}>
                        <Eye className="w-4 h-4 me-1" />
                        {t('common.view') || 'View'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1 || loading}
            onClick={() => load(pagination.page - 1)}
          >
            {t('common.previous') || 'Previous'}
          </Button>
          <span className="self-center text-sm text-gray-600">
            {pagination.page} / {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.pages || loading}
            onClick={() => load(pagination.page + 1)}
          >
            {t('common.next') || 'Next'}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
