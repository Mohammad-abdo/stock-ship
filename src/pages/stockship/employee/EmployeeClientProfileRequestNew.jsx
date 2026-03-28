import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, User } from 'lucide-react';
import { employeeApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';

export default function EmployeeClientProfileRequestNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { t, isRTL } = useLanguage();
  const tk = useCallback((k, fb) => t(`mediation.employee.clientProfileRequest.${k}`) || fb, [t]);

  const clientIdFromRoute = params.clientId;
  const clientId = clientIdFromRoute || location.state?.clientId;
  const snapFromState = location.state?.client || {};

  const [loadingClient, setLoadingClient] = useState(!!clientIdFromRoute);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: snapFromState.name || '',
    email: snapFromState.email || '',
    phone: snapFromState.phone || '',
    countryCode: snapFromState.countryCode || '',
    country: snapFromState.country || '',
    city: snapFromState.city || '',
    language: snapFromState.language || ''
  });

  useEffect(() => {
    if (!clientIdFromRoute) {
      setLoadingClient(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingClient(true);
        const res = await employeeApi.getEmployeeClient(clientIdFromRoute);
        const c = res.data?.data ?? res.data;
        if (cancelled || !c) return;
        setForm({
          name: c.name || '',
          email: c.email || '',
          phone: c.phone || '',
          countryCode: c.countryCode || '',
          country: c.country || '',
          city: c.city || '',
          language: c.language || ''
        });
      } catch (err) {
        if (!cancelled) {
          showToast.error(err.response?.data?.message || tk('loadClientFailed', 'Failed to load client'));
          navigate('/stockship/employee/clients');
        }
      } finally {
        if (!cancelled) setLoadingClient(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientIdFromRoute, navigate, tk]);

  const canSave = useMemo(() => {
    return Object.values(form).some((v) => v !== undefined && v !== null && String(v).trim() !== '');
  }, [form]);

  if (!clientId) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Card>
          <CardContent className="p-8 text-center text-gray-600">
            {tk('missingClient', 'Choose a client from My clients or open a deal.')}
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
              <Button variant="default" onClick={() => navigate('/stockship/employee/clients')}>
                {tk('goClients', 'My clients')}
              </Button>
              <Button variant="outline" onClick={() => navigate('/stockship/employee/deals')}>
                {tk('goDeals', 'Deals')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingClient) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBack = () => {
    if (clientIdFromRoute) navigate('/stockship/employee/clients');
    else navigate(-1);
  };

  const handleSaveDraft = async () => {
    if (!canSave) {
      showToast.error(tk('needOneField', 'Enter at least one field to propose'));
      return;
    }
    try {
      setSaving(true);
      const payload = { clientId, ...form };
      Object.keys(payload).forEach((k) => {
        if (k !== 'clientId' && (payload[k] === '' || payload[k] === undefined)) delete payload[k];
      });
      const res = await employeeApi.createClientProfileRequest(payload);
      const created = res.data?.data ?? res.data;
      showToast.success(tk('draftCreated', 'Draft saved'));
      navigate(`/stockship/employee/client-profile-requests/${created.id}`, { replace: true });
    } catch (err) {
      showToast.error(err.response?.data?.message || tk('createFailed', 'Could not create draft'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <Button variant="ghost" size="sm" className={isRTL ? 'flex-row-reverse' : ''} onClick={handleBack}>
        <ArrowLeft className={`w-4 h-4 ${isRTL ? 'ms-2 rotate-180' : 'me-2'}`} />
        {t('common.back') || 'Back'}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {tk('newTitle', 'New client profile request')}
          </CardTitle>
          <p className="text-sm text-gray-500">{form.name || form.email || clientId}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('mediation.common.name') || 'Name'}</Label>
              <Input name="name" value={form.name} onChange={onChange} className="mt-1" />
            </div>
            <div>
              <Label>{t('mediation.common.email') || 'Email'}</Label>
              <Input name="email" type="email" value={form.email} onChange={onChange} className="mt-1" />
            </div>
            <div>
              <Label>{t('common.phone') || 'Phone'}</Label>
              <Input name="phone" value={form.phone} onChange={onChange} className="mt-1" />
            </div>
            <div>
              <Label>{tk('countryCode', 'Country code')}</Label>
              <Input name="countryCode" value={form.countryCode} onChange={onChange} className="mt-1" />
            </div>
            <div>
              <Label>{tk('country', 'Country')}</Label>
              <Input name="country" value={form.country} onChange={onChange} className="mt-1" />
            </div>
            <div>
              <Label>{tk('city', 'City')}</Label>
              <Input name="city" value={form.city} onChange={onChange} className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label>{tk('language', 'Language')}</Label>
              <Input name="language" placeholder="ar / en" value={form.language} onChange={onChange} className="mt-1" />
            </div>
          </div>
          <Button onClick={handleSaveDraft} disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
            {tk('saveDraft', 'Save draft')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
