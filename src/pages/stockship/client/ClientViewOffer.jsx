import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { offerApi, dealApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Store, Gift, MapPin, Tag, Package, Download, FileSpreadsheet } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ClientViewOffer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingDeal, setCreatingDeal] = useState(false);

  useEffect(() => {
    fetchOffer();
  }, [id]);

  const fetchOffer = async () => {
    try {
      setLoading(true);
      const response = await offerApi.getOfferById(id);
      const data = response.data?.data?.offer || response.data?.data || response.data;
      
      // Parse images if needed
      if (data.images && typeof data.images === 'string') {
        try { data.images = JSON.parse(data.images); } catch (e) { data.images = []; }
      }
      if (data.items) {
        data.items = data.items.map(item => {
           if (item.images && typeof item.images === 'string') {
             try { item.images = JSON.parse(item.images); } catch (e) { item.images = []; }
           }
           return item;
        });
      }
      
      setOffer(data);
    } catch (error) {
      console.error('Error fetching offer:', error);
      showToast.error(t('client.loadFailed') || 'Failed to load offer');
      navigate('/stockship/client/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeal = async () => {
    try {
      setCreatingDeal(true);
      // Assuming requestNegotiation creates the deal
      const response = await dealApi.requestNegotiation(offer.id, {}); 
      const newDeal = response.data?.data || response.data?.deal || response.data;
      
      showToast.success(t('client.dealCreated') || 'Deal request sent successfully');
      // Redirect to the deal view/negotiation page (to be created)
      navigate(`/stockship/client/deals/${newDeal.id || newDeal.dealId}`); 
    } catch (error) {
      console.error('Error creating deal:', error);
      showToast.error(t('client.createDealFailed') || 'Failed to create deal request');
    } finally {
      setCreatingDeal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!offer) return null;

  return (
    <div className="p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button variant="ghost" size="icon" onClick={() => navigate('/stockship/client/dashboard')}>
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
          <div>
             <h1 className="text-2xl font-bold text-gray-900">{offer.title}</h1>
             <p className="text-gray-500 text-sm mt-1">{t('client.offerDetails') || 'Offer Details'}</p>
          </div>
        </div>
        <Button 
          onClick={handleCreateDeal} 
          disabled={creatingDeal}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {creatingDeal ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Gift className="w-4 h-4 mr-2" />}
          {t('client.makeDeal') || 'Make Deal'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Main Info */}
         <div className="lg:col-span-2 space-y-6">
            <Card>
               <CardHeader><CardTitle>{t('mediation.offers.details') || 'Details'}</CardTitle></CardHeader>
               <CardContent className="space-y-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{offer.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                     {offer.country && (
                        <div className="flex items-center gap-2 text-gray-600">
                           <MapPin className="w-4 h-4" />
                           <span>{offer.country} {offer.city ? `- ${offer.city}` : ''}</span>
                        </div>
                     )}
                     {offer.category && (
                        <div className="flex items-center gap-2 text-gray-600">
                           <Tag className="w-4 h-4" />
                           <span>{offer.category}</span>
                        </div>
                     )}
                     <div className="flex items-center gap-2 text-gray-600">
                        <Store className="w-4 h-4" />
                        <span>{offer.trader?.companyName || offer.trader?.name || (t('client.trader') || 'Trader')}</span>
                     </div>
                  </div>
               </CardContent>
            </Card>

            {/* Items */}
            {offer.items?.length > 0 && (
               <Card>
                  <CardHeader><CardTitle>{t('mediation.offers.items') || 'Items'}</CardTitle></CardHeader>
                  <CardContent>
                     <div className="space-y-4">
                        {offer.items.map((item, idx) => (
                           <div key={idx} className="border p-4 rounded-lg flex flex-col md:flex-row gap-4">
                              {/* Simple Image display for now */}
                              {/* ... */}
                              <div>
                                 <h4 className="font-medium">{item.name || `${t('client.item') || 'Item'} ${idx + 1}`}</h4>
                                 <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                                 <div className="mt-2 text-sm flex gap-4">
                                     <span className="bg-gray-100 px-2 py-1 rounded">{t('client.quantity') || 'Qty'}: {item.quantity}</span>
                                     {item.price && <span className="bg-green-50 text-green-700 px-2 py-1 rounded">{item.price} {item.currency}</span>}
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </CardContent>
               </Card>
            )}
         </div>

         {/* Sidebar / Files */}
         <div className="space-y-6">
            {offer.excelFileUrl && (
               <Card>
                  <CardHeader><CardTitle>{t('mediation.trader.excelFile') || 'Excel File'}</CardTitle></CardHeader>
                  <CardContent>
                     <a 
                        href={offer.excelFileUrl.startsWith('http') ? offer.excelFileUrl : `${API_URL}${offer.excelFileUrl}`}
                        className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                        download
                     >
                        <FileSpreadsheet className="w-5 h-5" />
                        <span className="flex-1 font-medium truncate">{offer.excelFileName || (t('client.downloadExcel') || 'Download Excel')}</span>
                        <Download className="w-4 h-4" />
                     </a>
                  </CardContent>
               </Card>
            )}
         </div>
      </div>
    </div>
  );
}
