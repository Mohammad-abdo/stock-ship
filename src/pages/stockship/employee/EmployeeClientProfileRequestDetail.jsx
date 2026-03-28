import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, Send, Trash2, Save } from 'lucide-react';
import { employeeApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';

const FIELDS = [
  { key: 'name', labelKey: 'name' },
  { key: 'email', labelKey: 'email', type: 'email' },
  { key: 'phone', labelKey: 'phone' },
  { key: 'countryCode', labelKey: 'countryCode' },
  { key: 'country', labelKey: 'country' },
  { key: 'city', labelKey: 'city' },
  { key: 'language', labelKey: 'language' }
];

function parseRequested(raw) {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return typeof raw === 'object' ? raw : {};
}

export default function EmployeeClientProfileRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { getAuth } = useMultiAuth();
  const { user } = getAuth('employee');
  const tk = useCallback((k, fb) => t(`mediation.employee.clientProfileRequest.${k}`) || fb, [t]);

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await employeeApi.getClientProfileRequestById(id);
      const r = res.data?.data ?? res.data;
      setRequest(r);
      const rd = parseRequested(r.requestedData);
      setForm(rd);
    } catch (e) {
      showToast.error(tk('loadFailed', 'Failed to load'));
      navigate('/stockship/employee/client-profile-requests');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, tk]);

  useEffect(() => {
    if (user?.id && id) load();
  }, [user?.id, id, load]);

  const client = request?.client;
  const isDraft = request?.status === 'DRAFT';
  const isPending = request?.status === 'PENDING_APPROVAL';

  const onField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const saveDraft = async () => {
    try {
      setBusy(true);
      const res = await employeeApi.updateClientProfileRequestDraft(id, form);
      setRequest(res.data?.data ?? res.data);
      showToast.success(tk('draftUpdated', 'Draft updated'));
    } catch (e) {
      showToast.error(e.response?.data?.message || tk('updateFailed', 'Update failed'));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!window.confirm(tk('confirmSubmit', 'Submit for admin approval?'))) return;
    try {
      setBusy(true);
      const res = await employeeApi.submitClientProfileRequest(id);
      setRequest(res.data?.data ?? res.data);
      showToast.success(tk('submittedOk', 'Submitted for approval'));
    } catch (e) {
      showToast.error(e.response?.data?.message || tk('submitFailed', 'Submit failed'));
    } finally {
      setBusy(false);
    }
  };

  const cancelDraft = async () => {
    if (!window.confirm(tk('confirmCancel', 'Cancel this draft?'))) return;
    try {
      setBusy(true);
      await employeeApi.cancelClientProfileRequestDraft(id);
      showToast.success(tk('cancelledOk', 'Draft cancelled'));
      navigate('/stockship/employee/client-profile-requests');
    } catch (e) {
      showToast.error(e.response?.data?.message || tk('cancelFailed', 'Cancel failed'));
    } finally {
      setBusy(false);
    }
  };

  const rows = useMemo(() => {
    return FIELDS.map(({ key }) => {
      const proposed = form[key];
      const current = client?.[key];
      return { key, current, proposed };
    });
  }, [form, client]);

  if (loading || !request) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Button variant="ghost" size="sm" onClick={() => navigate('/stockship/employee/client-profile-requests')}>
        <ArrowLeft className={`w-4 h-4 ${isRTL ? 'ms-2 rotate-180' : 'me-2'}`} />
        {t('common.back') || 'Back'}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{client?.name || tk('client', 'Client')}</CardTitle>
          <p className="text-sm text-gray-500">{client?.email}</p>
          <p className="text-xs text-gray-400 mt-2">
            {tk('statusLabel', 'Status')}: <strong>{request.status}</strong>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pe-4">{tk('field', 'Field')}</th>
                  <th className="py-2 pe-4">{tk('current', 'Current')}</th>
                  <th className="py-2">{tk('proposed', 'Proposed')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ key, current, proposed }) => (
                  <tr key={key} className="border-b border-gray-100">
                    <td className="py-3 font-medium text-gray-700">
                      {tk(key, t(`mediation.common.${key}`) || key)}
                    </td>
                    <td className="py-3 text-gray-600">{current ?? '—'}</td>
                    <td className="py-3">
                      {isDraft ? (
                        <Input
                          value={proposed ?? ''}
                          onChange={(e) => onField(key, e.target.value)}
                          className="max-w-xs"
                        />
                      ) : (
                        <span className="text-gray-900">{proposed ?? '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {request.rejectionReason && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-900">
              <strong>{tk('rejectionReason', 'Rejection reason')}:</strong> {request.rejectionReason}
            </div>
          )}

          {isDraft && (
            <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button onClick={saveDraft} disabled={busy} variant="secondary">
                <Save className="w-4 h-4 me-1" />
                {tk('saveDraft', 'Save draft')}
              </Button>
              <Button onClick={submit} disabled={busy}>
                <Send className="w-4 h-4 me-1" />
                {tk('submitForApproval', 'Submit for approval')}
              </Button>
              <Button onClick={cancelDraft} disabled={busy} variant="destructive">
                <Trash2 className="w-4 h-4 me-1" />
                {tk('cancelDraft', 'Cancel draft')}
              </Button>
            </div>
          )}

          {isPending && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-4">
              {tk('pendingHint', 'Waiting for admin review. You cannot edit this request.')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
