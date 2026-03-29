import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { adminApi } from '@/lib/stockshipApi';
import { ArrowLeft, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import showToast from '@/lib/toast';

const KEYS = ['name', 'phone'];

const FIELD_LABEL_KEY = {
  name: 'mediation.common.name',
  phone: 'mediation.common.phone'
};

const STATUS_I18N_KEY = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

function parseJson(val) {
  if (!val) return {};
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  }
  return typeof val === 'object' ? val : {};
}

export default function AdminViewEmployeeProfileRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const tk = useCallback((k, fb) => t(`mediation.admin.employeeProfileRequest.${k}`) || fb, [t]);

  const statusLabel = useCallback(
    (status) => {
      const sub = STATUS_I18N_KEY[status];
      return sub ? tk(sub, status) : status;
    },
    [tk]
  );

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getEmployeeProfileRequest(id);
      setRequest(res.data?.data ?? res.data);
    } catch (e) {
      showToast.error(tk('loadFailed', 'Failed to load'));
      navigate('/stockship/admin/employee-profile-requests');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, tk]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  const proposed = useMemo(() => parseJson(request?.requestedData), [request]);
  const employee = request?.employee;

  const approve = async () => {
    if (!window.confirm(tk('confirmApprove', 'Apply these changes to the employee profile?'))) return;
    try {
      setBusy(true);
      await adminApi.approveEmployeeProfileRequest(id, { reviewNotes: reviewNotes.trim() || undefined });
      showToast.success(tk('approvedOk', 'Approved'));
      navigate('/stockship/admin/employee-profile-requests');
    } catch (e) {
      showToast.error(e.response?.data?.message || tk('approveFailed', 'Approve failed'));
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) {
      showToast.error(tk('reasonRequired', 'Rejection reason is required'));
      return;
    }
    try {
      setBusy(true);
      await adminApi.rejectEmployeeProfileRequest(id, { rejectionReason: rejectReason.trim() });
      showToast.success(tk('rejectedOk', 'Rejected'));
      navigate('/stockship/admin/employee-profile-requests');
    } catch (e) {
      showToast.error(e.response?.data?.message || tk('rejectFailed', 'Reject failed'));
    } finally {
      setBusy(false);
    }
  };

  if (loading || !request) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const pending = request.status === 'PENDING_APPROVAL';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Button variant="ghost" size="sm" onClick={() => navigate('/stockship/admin/employee-profile-requests')}>
        <ArrowLeft className={`w-4 h-4 ${isRTL ? 'ms-2 rotate-180' : 'me-2'}`} />
        {t('common.back')}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{employee?.name || tk('employee', 'Employee')}</CardTitle>
          <p className="text-sm text-gray-500">{employee?.email}</p>
          <p className="text-xs text-gray-400 mt-2">
            {tk('status', 'Status')}: <strong>{statusLabel(request.status)}</strong>
          </p>
          <p className="text-xs text-gray-400">
            {tk('code', 'Code')}: {employee?.employeeCode}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-start p-3">{tk('field', 'Field')}</th>
                  <th className="text-start p-3">{tk('current', 'Current')}</th>
                  <th className="text-start p-3">{tk('proposed', 'Proposed')}</th>
                </tr>
              </thead>
              <tbody>
                {KEYS.map((key) => {
                  const cur = employee?.[key];
                  const next = proposed[key];
                  if (next === undefined) return null;
                  const changed = String(cur ?? '') !== String(next ?? '');
                  const labelKey = FIELD_LABEL_KEY[key];
                  return (
                    <tr key={key} className={changed ? 'bg-amber-50/80' : ''}>
                      <td className="p-3 font-medium">{labelKey ? t(labelKey) : key}</td>
                      <td className="p-3 text-gray-600">{cur ?? '—'}</td>
                      <td className="p-3">{String(next)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {request.rejectionReason && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-sm">
              <strong>{tk('rejectionReason', 'Rejection reason')}:</strong> {request.rejectionReason}
            </div>
          )}

          {pending && (
            <div className="space-y-4 border-t pt-6">
              <div>
                <label className="text-sm font-medium text-gray-700">{tk('reviewNotes', 'Review notes (optional)')}</label>
                <Textarea
                  className="mt-1"
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
              {!showReject ? (
                <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Button onClick={approve} disabled={busy} className="bg-green-600 hover:bg-green-700">
                    <ThumbsUp className="w-4 h-4 me-1" />
                    {tk('approve', 'Approve & apply')}
                  </Button>
                  <Button variant="destructive" onClick={() => setShowReject(true)} disabled={busy}>
                    <ThumbsDown className="w-4 h-4 me-1" />
                    {tk('reject', 'Reject')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{tk('rejectReason', 'Rejection reason')}</label>
                  <Textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                  <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Button variant="destructive" onClick={reject} disabled={busy}>
                      {tk('confirmReject', 'Confirm reject')}
                    </Button>
                    <Button variant="outline" onClick={() => setShowReject(false)} disabled={busy}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
