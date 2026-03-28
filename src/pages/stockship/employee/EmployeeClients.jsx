import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { employeeApi } from '@/lib/mediationApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Users, Search, Building2, Calendar, Pencil, Loader2, FileText, Clock, ExternalLink } from 'lucide-react';
import showToast from '@/lib/toast';

export default function EmployeeClients() {
  const navigate = useNavigate();
  const { getAuth } = useMultiAuth();
  const { t, language, isRTL } = useLanguage();
  const { user } = getAuth('employee');
  const tk = useCallback((k, fb) => t(`mediation.employee.clientsList.${k}`) || fb, [t]);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const fetchingRef = useRef(false);

  useEffect(() => {
    const tmr = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(tmr);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const load = useCallback(async () => {
    if (!user?.id || fetchingRef.current) return;
    try {
      fetchingRef.current = true;
      setLoading(true);
      const res = await employeeApi.getMyClients({
        page,
        limit: 20,
        ...(debouncedSearch && { search: debouncedSearch })
      });
      const data = res.data?.data ?? res.data;
      setItems(data?.items ?? []);
      if (data?.pagination) setPagination(data.pagination);
    } catch (e) {
      console.error(e);
      showToast.error(tk('loadFailed', 'Failed to load clients'));
      setItems([]);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user?.id, page, debouncedSearch, tk]);

  useEffect(() => {
    load();
  }, [load]);

  const openBadge = (openRequest) => {
    if (!openRequest) return null;
    const isDraft = openRequest.status === 'DRAFT';
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          isDraft ? 'bg-slate-100 text-slate-800' : 'bg-amber-100 text-amber-900'
        }`}
      >
        {isDraft ? <FileText className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
        {openRequest.status === 'DRAFT' ? tk('statusDraft', 'Draft') : tk('statusPending', 'Pending approval')}
        {!openRequest.isMine && ` (${tk('otherEmployee', 'other')})`}
      </span>
    );
  };

  const handleEdit = (row) => {
    const o = row.openRequest;
    if (o?.status === 'PENDING_APPROVAL') {
      if (o.isMine) {
        navigate(`/stockship/employee/client-profile-requests/${o.id}`);
      } else {
        showToast.error(tk('blockedOtherPending', 'Another request is pending for this client'));
      }
      return;
    }
    if (o?.status === 'DRAFT') {
      if (o.isMine) {
        navigate(`/stockship/employee/client-profile-requests/${o.id}`);
      } else {
        showToast.error(tk('blockedOtherDraft', 'Another employee has a draft for this client'));
      }
      return;
    }
    navigate(`/stockship/employee/clients/${row.client.id}/edit`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-7 h-7 text-indigo-600" />
          {tk('title', 'My clients')}
        </h1>
        <p className="text-gray-500 mt-1">
          {tk('subtitle', 'Clients who have deals with your traders. Edit profile and submit for admin approval.')}
        </p>
        <Button variant="link" className="px-0 h-auto mt-2 text-indigo-600" onClick={() => navigate('/stockship/employee/client-profile-requests')}>
          <ExternalLink className="w-4 h-4 me-1" />
          {tk('viewRequests', 'View my profile update requests')}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{tk('search', 'Search')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tk('searchPlaceholder', 'Name, email, phone...')}
              className={isRTL ? 'pr-10' : 'pl-10'}
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            {tk('empty', 'No clients yet. Clients appear here when they have deals with your traders.')}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-start p-3 font-semibold text-gray-700">{tk('client', 'Client')}</th>
                  <th className="text-start p-3 font-semibold text-gray-700">{tk('traders', 'Traders')}</th>
                  <th className="text-start p-3 font-semibold text-gray-700">{tk('deals', 'Deals')}</th>
                  <th className="text-start p-3 font-semibold text-gray-700">{tk('lastDeal', 'Last deal')}</th>
                  <th className="text-start p-3 font-semibold text-gray-700">{tk('request', 'Request')}</th>
                  <th className="text-end p-3 font-semibold text-gray-700">{t('common.actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.client.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                    <td className="p-3">
                      <p className="font-medium text-gray-900">{row.client.name}</p>
                      <p className="text-gray-500 text-xs">{row.client.email}</p>
                      {row.client.phone && <p className="text-gray-400 text-xs">{row.client.phone}</p>}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        {(row.traders || []).map((tr) => (
                          <span key={tr.id} className="inline-flex items-center gap-1 text-xs text-gray-700">
                            <Building2 className="w-3 h-3 shrink-0" />
                            {tr.companyName || tr.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-gray-700">{row.dealCount}</td>
                    <td className="p-3 text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {row.lastDealAt
                          ? new Date(row.lastDealAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')
                          : '—'}
                      </span>
                    </td>
                    <td className="p-3">{openBadge(row.openRequest)}</td>
                    <td className="p-3 text-end">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(row)} className="gap-1">
                        <Pencil className="w-3 h-3" />
                        {tk('edit', 'Edit')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                {t('common.previous') || 'Previous'}
              </Button>
              <span className="text-sm text-gray-600">
                {page} / {pagination.pages} ({pagination.total} {tk('total', 'total')})
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.pages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('common.next') || 'Next'}
              </Button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
