import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { dealApi } from '@/lib/mediationApi';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Video } from 'lucide-react';
import showToast from '@/lib/toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getImageUrl = (img) => {
  if (!img) return '';
  const url = typeof img === 'string' ? img : (img?.url || img?.src || img);
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? url : '/' + url}`;
};

/** عرض السعر للعميل — نفس شكل الفاتورة كما يراها الموظف */
const ClientDealQuotePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState(null);
  const [platformSettings, setPlatformSettings] = useState(null);
  const [productState, setProductState] = useState([]);

  useEffect(() => {
    fetchDeal();
  }, [id]);

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const response = await dealApi.getDealById(id);
      const data = response.data?.data || response.data;
      const dealData = data.deal || data;
      setDeal(dealData);
      if (data.platformSettings) setPlatformSettings(data.platformSettings);

      if (dealData?.items?.length > 0) {
        const products = dealData.items.map((dealItem) => {
          const { offerItem } = dealItem;
          if (!offerItem) return null;
          let images = [];
          try {
            const parsed = typeof offerItem.images === 'string' ? JSON.parse(offerItem.images || '[]') : (offerItem.images || []);
            if (Array.isArray(parsed)) {
              images = parsed.map(img => getImageUrl(typeof img === 'string' ? img : img?.url || img?.src)).filter(Boolean);
            }
          } catch (e) {}
          const imageUrl = images[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';
          return {
            id: dealItem.id,
            image: imageUrl,
            title: offerItem.productName || offerItem.description || t('mediation.deals.product') || 'منتج',
            itemNumber: offerItem.itemNo || `#${offerItem.id?.substring(0, 8) || 'N/A'}`,
            description: offerItem.description || offerItem.notes || '',
            quantity: parseInt(offerItem.quantity) || 0,
            piecesPerCarton: parseInt(offerItem.packageQuantity || offerItem.cartons || 1),
            pricePerPiece: parseFloat(offerItem.unitPrice) || 0,
            cbm: parseFloat(offerItem.totalCBM || offerItem.cbm || 0),
            negotiationPrice: dealItem.negotiatedPrice ? parseFloat(dealItem.negotiatedPrice) : parseFloat(offerItem.unitPrice) || 0,
            negotiationQuantity: parseInt(dealItem.quantity) || 0
          };
        }).filter(Boolean);
        setProductState(products);
      } else {
        setProductState([]);
      }
    } catch (error) {
      console.error('Error fetching deal:', error);
      showToast.error(t('mediation.deals.loadDealFailed') || 'Failed to load deal');
      navigate('/stockship/client/deals');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const title = t('mediation.deals.priceQuote') || 'عرض السعر';
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    const dealAmount = Number(deal?.negotiatedAmount) || 0;
    const platformRate = platformSettings?.platformCommissionRate != null ? parseFloat(platformSettings.platformCommissionRate) : 2.5;
    const shippingRate = platformSettings?.shippingCommissionRate != null ? parseFloat(platformSettings.shippingCommissionRate) : 5;
    const employeeRate = deal?.employee?.commissionRate != null ? parseFloat(deal.employee.commissionRate) : 1;
    const platformComm = (dealAmount * platformRate) / 100;
    const shippingComm = (dealAmount * shippingRate) / 100;
    const employeeComm = (dealAmount * employeeRate) / 100;
    const totalAmount = dealAmount + platformComm + shippingComm + employeeComm;

    const cards = productState.map((product, index) => {
      const totalQty = product.negotiationQuantity || 0;
      const totalCbm = product.quantity > 0 ? (totalQty / product.quantity) * product.cbm : 0;
      const totalPrice = totalQty * (product.negotiationPrice || 0);
      return `
        <div class="quote-card" style="background:white;border-radius:1rem;padding:1.5rem;margin-bottom:1rem;border:1px solid #e5e7eb;">
          <div style="display:grid;grid-template-columns:200px 1fr;gap:1.5rem;">
            <div>
              <div style="position:relative;border-radius:0.5rem;overflow:hidden;aspect-ratio:1;background:#f3f4f6;">
                <img src="${product.image}" alt="${product.title}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'"/>
                <span style="position:absolute;top:0.5rem;left:0.5rem;width:2rem;height:2rem;border-radius:9999px;background:#374151;color:white;display:flex;align-items:center;justify-content:center;font-size:0.875rem;font-weight:bold;">${index + 1}</span>
              </div>
              <div style="width:80px;height:80px;margin-top:0.5rem;border:1px solid #e5e7eb;border-radius:0.5rem;display:flex;align-items:center;justify-content:center;background:#f9fafb;">🎥</div>
            </div>
            <div>
              <h3 style="font-size:1.125rem;font-weight:bold;color:#111;">${product.title}</h3>
              <p style="font-size:0.875rem;color:#6b7280;">${product.itemNumber}</p>
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-top:1rem;font-size:0.875rem;">
                <div><p style="color:#6b7280;margin:0;">${t('mediation.deals.quantity') || 'الكمية'}</p><p style="font-weight:600;margin:0.25rem 0 0;">${product.quantity} (${product.piecesPerCarton} ${t('mediation.deals.piecesInCarton') || 'قطع/كرتون'})</p></div>
                <div><p style="color:#6b7280;margin:0;">${t('mediation.deals.pricePerPiece') || 'سعر القطعة'}</p><p style="font-weight:600;margin:0.25rem 0 0;">$${(product.pricePerPiece || 0).toFixed(2)}</p></div>
                <div><p style="color:#6b7280;margin:0;">${t('mediation.deals.negotiationPrice') || 'السعر المتفاوض عليه'}</p><p style="font-weight:600;margin:0.25rem 0 0;">$${(product.negotiationPrice || 0).toFixed(2)}</p></div>
                <div><p style="color:#6b7280;margin:0;">${t('mediation.deals.negotiationQuantity') || 'الكمية المتفاوض عليها'}</p><p style="font-weight:600;margin:0.25rem 0 0;">${product.negotiationQuantity || 0}</p></div>
              </div>
              <div style="display:flex;gap:1.5rem;margin-top:1rem;padding-top:1rem;border-top:1px solid #f3f4f6;font-size:0.875rem;">
                <div><p style="color:#6b7280;margin:0;">${t('mediation.deals.totalQuantity') || 'الكمية الإجمالية'}</p><p style="font-weight:600;margin:0.25rem 0 0;">${totalQty.toLocaleString()} ${t('mediation.deals.piece') || 'قطعة'}</p></div>
                <div><p style="color:#6b7280;margin:0;">${t('mediation.deals.totalCbm') || 'إجمالي CBM'}</p><p style="font-weight:600;margin:0.25rem 0 0;">${totalCbm.toFixed(2)} CBM</p></div>
                <div><p style="color:#6b7280;margin:0;">${t('mediation.deals.totalPrice') || 'السعر الإجمالي'}</p><p style="font-weight:600;margin:0.25rem 0 0;color:#15803d;">$${totalPrice.toFixed(2)}</p></div>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');

    const summaryRows = `
      <div style="background:white;padding:1rem;border-radius:0.5rem;margin-top:1rem;border:1px solid #e5e7eb;">
        <p style="margin:0;display:flex;justify-content:space-between;"><span>${t('mediation.deals.negotiatedAmount') || 'قيمة الصفقة'}</span><strong>$${dealAmount.toFixed(2)}</strong></p>
        <p style="margin:0.5rem 0 0;display:flex;justify-content:space-between;"><span>${t('mediation.deals.platformCommission') || 'عمولة ستوكشيب'} (${platformRate}%)</span><strong>$${platformComm.toFixed(2)}</strong></p>
        <p style="margin:0.5rem 0 0;display:flex;justify-content:space-between;"><span>${t('mediation.deals.shippingToClient') || 'التوصيل للعميل'} (${shippingRate}%)</span><strong>$${shippingComm.toFixed(2)}</strong></p>
        <p style="margin:0.5rem 0 0;display:flex;justify-content:space-between;"><span>${t('mediation.deals.employeeCommission') || 'عمولة الموظف'} (${employeeRate}%)</span><strong>$${employeeComm.toFixed(2)}</strong></p>
        <p style="margin:0.75rem 0 0;padding-top:0.75rem;border-top:2px solid #e5e7eb;display:flex;justify-content:space-between;font-size:1.25rem;"><span>${t('mediation.deals.grandTotal') || 'الإجمالي'}</span><strong style="color:#15803d;">$${totalAmount.toFixed(2)}</strong></p>
      </div>`;

    const html = `<!DOCTYPE html><html dir="${dir}" lang="${language || 'ar'}"><head><meta charset="utf-8"/><title>${title} - ${deal?.dealNumber}</title><style>body{font-family:system-ui,sans-serif;background:#f3f4f6;padding:1.5rem;margin:0;} .header{background:white;padding:1rem;border-radius:0.5rem;margin-bottom:1rem;} .logo{font-size:1.5rem;font-weight:bold;color:#1e40af;}</style></head><body><div class="header"><p class="logo">Stockship</p><p style="margin:0.25rem 0 0;color:#6b7280;">${t('mediation.deals.dealNumber') || 'رقم الصفقة'}: <strong>${deal?.dealNumber}</strong></p><p style="margin:0.25rem 0 0;color:#6b7280;">${t('mediation.deals.client') || 'العميل'}: <strong>${deal?.client?.name}</strong></p><p style="margin:0.25rem 0 0;color:#6b7280;">${t('mediation.deals.trader') || 'التاجر'}: <strong>${deal?.trader?.name || deal?.trader?.companyName}</strong></p><p style="margin:0.25rem 0 0;color:#6b7280;">${t('mediation.deals.employee') || 'الموظف'}: <strong>${deal?.employee?.name}</strong></p></div>${cards}${summaryRows}</body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!deal) return null;

  const dealAmount = Number(deal.negotiatedAmount) || 0;
  const platformRate = platformSettings?.platformCommissionRate != null ? parseFloat(platformSettings.platformCommissionRate) : 2.5;
  const shippingRate = platformSettings?.shippingCommissionRate != null ? parseFloat(platformSettings.shippingCommissionRate) : 5;
  const employeeRate = deal.employee?.commissionRate != null ? parseFloat(deal.employee.commissionRate) : 1;
  const platformComm = (dealAmount * platformRate) / 100;
  const shippingComm = (dealAmount * shippingRate) / 100;
  const employeeComm = (dealAmount * employeeRate) / 100;
  const totalAmount = dealAmount + platformComm + shippingComm + employeeComm;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/stockship/client/deals/${id}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('mediation.deals.priceQuote') || 'عرض السعر'}</h1>
            <p className="text-sm text-gray-500">{deal.dealNumber}</p>
          </div>
        </div>
        <Button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
          <Printer className="w-4 h-4" />
          {t('mediation.deals.printOrPdf') || 'طباعة / حفظ PDF'}
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <p className="text-2xl font-bold text-blue-700 mb-4">Stockship</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">{t('mediation.deals.dealNumber') || 'رقم الصفقة'}</p>
            <p className="font-semibold text-gray-900">{deal.dealNumber}</p>
          </div>
          <div>
            <p className="text-gray-500">{t('mediation.deals.client') || 'العميل'}</p>
            <p className="font-semibold text-gray-900">{deal.client?.name || '—'}</p>
          </div>
          <div>
            <p className="text-gray-500">{t('mediation.deals.trader') || 'التاجر'}</p>
            <p className="font-semibold text-gray-900">{deal.trader?.name || deal.trader?.companyName || '—'}</p>
          </div>
          <div>
            <p className="text-gray-500">{t('mediation.deals.employee') || 'الموظف'}</p>
            <p className="font-semibold text-gray-900">{deal.employee?.name || '—'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {productState.map((product, index) => {
          const totalQty = product.negotiationQuantity || 0;
          const totalCbmProduct = product.quantity > 0 ? (totalQty / product.quantity) * product.cbm : 0;
          const totalPriceProduct = totalQty * (product.negotiationPrice || 0);
          return (
            <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
                <div className="space-y-2 relative">
                  <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-square">
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80'; }} />
                    <span className="absolute top-2 left-2 w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center text-sm font-bold">{index + 1}</span>
                  </div>
                  <div className="w-full aspect-square max-w-[80px] rounded border border-gray-200 flex items-center justify-center bg-gray-50">
                    <Video className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{product.title}</h3>
                    <p className="text-sm text-gray-500">{product.itemNumber}</p>
                    {product.description && <p className="text-sm text-gray-600 mt-1">{product.description}</p>}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-0.5">{t('mediation.deals.quantity') || 'الكمية'}</p>
                      <p className="font-semibold text-gray-900">{product.quantity} ({product.piecesPerCarton} {t('mediation.deals.piecesInCarton') || 'قطع/كرتون'})</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">{t('mediation.deals.pricePerPiece') || 'سعر القطعة'}</p>
                      <p className="font-semibold text-gray-900">${(product.pricePerPiece || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">{t('mediation.deals.negotiationPrice') || 'السعر المتفاوض عليه'}</p>
                      <p className="font-semibold text-gray-900">${(product.negotiationPrice || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">{t('mediation.deals.negotiationQuantity') || 'الكمية المتفاوض عليها'}</p>
                      <p className="font-semibold text-gray-900">{product.negotiationQuantity || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">{t('mediation.deals.cbm') || 'المتر المكعب'}</p>
                      <p className="font-semibold text-gray-900">{(product.cbm || 0).toFixed(2)} CBM</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-100 text-sm">
                    <div>
                      <p className="text-gray-500 mb-0.5">{t('mediation.deals.totalQuantity') || 'الكمية الإجمالية'}</p>
                      <p className="font-semibold text-gray-900">{totalQty.toLocaleString()} {t('mediation.deals.piece') || 'قطعة'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">{t('mediation.deals.totalCbm') || 'إجمالي CBM'}</p>
                      <p className="font-semibold text-gray-900">{totalCbmProduct.toFixed(2)} CBM</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">{t('mediation.deals.totalPrice') || 'السعر الإجمالي'}</p>
                      <p className="font-semibold text-green-700">${totalPriceProduct.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mt-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t('mediation.deals.negotiatedAmount') || 'قيمة الصفقة'}</span>
          <span className="font-semibold">${dealAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t('mediation.deals.platformCommission') || 'عمولة ستوكشيب'} ({platformRate}%)</span>
          <span className="font-semibold">${platformComm.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t('mediation.deals.shippingToClient') || 'التوصيل للعميل'} ({shippingRate}%)</span>
          <span className="font-semibold">${shippingComm.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t('mediation.deals.employeeCommission') || 'عمولة الموظف'} ({employeeRate}%)</span>
          <span className="font-semibold">${employeeComm.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
          <span className="text-lg font-bold text-gray-900">{t('mediation.deals.grandTotal') || 'الإجمالي'}</span>
          <span className="text-2xl font-bold text-green-700">${totalAmount.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default ClientDealQuotePage;
