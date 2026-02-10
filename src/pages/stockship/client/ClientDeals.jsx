import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { dealApi } from '@/lib/mediationApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, FileText, Calendar, DollarSign } from 'lucide-react';
import showToast from '@/lib/toast';

export default function ClientDeals() {
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const response = await dealApi.getDeals();
      setDeals(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
      // showToast.error(t('client.loadDealsFailed') || 'Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
       case 'APPROVED': return 'bg-green-100 text-green-800';
       case 'REJECTED': return 'bg-red-100 text-red-800';
       case 'NEGOTIATION': return 'bg-blue-100 text-blue-800';
       case 'PENDING': return 'bg-yellow-100 text-yellow-800';
       default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-3xl font-bold text-gray-900">{t('client.myDeals') || 'My Deals'}</h1>
      
      {deals.length === 0 ? (
        <Card>
           <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mb-4 text-gray-300" />
              <p>{t('client.noDeals') || 'No deals yet. Start by exploring the Marketplace.'}</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/stockship/client/dashboard')}>
                 {t('client.marketplace') || 'Go to Marketplace'}
              </Button>
           </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {deals.map((deal) => (
             <Card key={deal.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/stockship/client/deals/${deal.id}`)}>
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                   <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                         <h3 className="font-bold text-lg">{deal.offer?.title || `Deal #${deal.id}`}</h3>
                         <Badge variant="secondary" className={getStatusColor(deal.status)}>{deal.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-4">
                         <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(deal.createdAt).toLocaleDateString()}</span>
                         <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {deal.finalPrice ? deal.finalPrice : (t('mediation.deals.negotiation') || 'Negotiating')}</span>
                      </p>
                   </div>
                   <Button variant="ghost" size="sm">
                      {t('client.viewDeal') || 'View Deal'} 
                      <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                   </Button>
                </CardContent>
             </Card>
          ))}
        </div>
      )}
    </div>
  );
}
