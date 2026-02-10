import React, { useState, useEffect } from "react";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ClientDashboard() {
  const { getActiveToken } = useMultiAuth();
  const { t, isRTL } = useLanguage();
  const token = getActiveToken('client');
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketplaceOffers();
  }, []);

  const fetchMarketplaceOffers = async () => {
    try {
      setLoading(true);
      // Fetch status=active offers. 
      // Assuming public endpoint or client-accessible endpoint exists.
      // If not, we might need a dedicated endpoint like /client/marketplace
      const response = await api.get('/offers?status=active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOffers(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching offers:", error);
      toast.error(t('client.loadFailed') || "Failed to load marketplace offers");
    } finally {
      setLoading(false);
    }
  };

  const handleMakeDeal = (offerId) => {
    // Navigate to deal creation or view offer details
    // Ideally open a modal or page to confirm quantity/price
    // For now, let's assume we view offer details first
    navigate(`/stockship/client/offers/${offerId}`);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('client.marketplace') || 'Marketplace'}</h1>
        <p className="text-muted-foreground">{t('client.marketplaceDesc') || 'Explore available offers and make deals'}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-100">
           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
           </div>
           <h3 className="text-lg font-medium text-gray-900">{t('client.noOffers') || 'No offers available'}</h3>
           <p className="text-gray-500">{t('client.checkLater') || 'Check back later for new deals'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold">{offer.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">{offer.description}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                     {offer.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                 <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                       <span>{t('common.items') || 'Items'}:</span>
                       <span className="font-medium text-gray-900">{offer.items?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                       <span>{t('common.totalCartons') || 'Total Cartons'}:</span>
                       <span className="font-medium text-gray-900">{offer.totalCartons}</span>
                    </div>
                    {/* Add more details like price range if available */}
                 </div>
              </CardContent>
              <CardFooter className="pt-2">
                 <Button className="w-full" onClick={() => handleMakeDeal(offer.id)}>
                    {t('client.makeDeal') || 'View & Make Deal'}
                    <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
