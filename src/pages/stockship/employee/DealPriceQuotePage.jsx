import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { dealApi, employeeApi } from '@/lib/mediationApi';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Video, Send } from 'lucide-react';
import showToast from '@/lib/toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getImageUrl = (img) => {
  if (!img) return '';
  const url = typeof img === 'string' ? img : (img?.url || img?.src || img);
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? url : '/' + url}`;
};

const DealPriceQuotePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();

  // Helper function to get status translation
  const getStatusTranslation = (status) => {
    const statusLower = status?.toLowerCase();
    const translation = t(`mediation.deals.status.${statusLower}`) || t(`mediation.deals.${statusLower}`);
    
    if (translation && translation !== `mediation.deals.status.${statusLower}` && translation !== `mediation.deals.${statusLower}`) {
      return translation;
    }
    
    // Fallback translations
    const fallbacks = {
      'paid': language === 'ar' ? 'مدفوع' : 'Paid',
      'approved': language === 'ar' ? 'موافق عليه' : 'Approved',
      'negotiation': language === 'ar' ? 'تفاوض' : 'Negotiation',
      'settled': language === 'ar' ? 'مسوى' : 'Settled',
      'cancelled': language === 'ar' ? 'ملغى' : 'Cancelled',
      'pending': language === 'ar' ? 'قيد الانتظار' : 'Pending'
    };
    
    return fallbacks[statusLower] || status;
  };

  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState(null);
  const [platformSettings, setPlatformSettings] = useState(null);
  const [productState, setProductState] = useState([]);
  const [sendingToClient, setSendingToClient] = useState(false);
  const [shippingType, setShippingType] = useState('LAND'); // LAND (بري) | SEA (بحري)
  const [shippingCost, setShippingCost] = useState('');
  const [selectedShippingCompany, setSelectedShippingCompany] = useState('');
  const [shippingCompanies, setShippingCompanies] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    fetchDeal();
    fetchShippingCompanies();
  }, [id]);

  const fetchShippingCompanies = async () => {
    try {
      const response = await employeeApi.getActiveShippingCompanies();
      const companies = response.data?.data || response.data || [];
      setShippingCompanies(companies);
    } catch (error) {
      console.error('Error fetching shipping companies:', error);
    }
  };

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const response = await dealApi.getDealById(id);
      const data = response.data?.data || response.data;
      const dealData = data.deal || data;
      setDeal(dealData);
      if (data.platformSettings) setPlatformSettings(data.platformSettings);

      // Load existing shipping data if available
      if (dealData.shippingType) {
        setShippingType(dealData.shippingType);
      }
      if (dealData.shippingCost) {
        setShippingCost(dealData.shippingCost.toString());
      }
      if (dealData.shippingCompanyId) {
        setSelectedShippingCompany(dealData.shippingCompanyId);
      }

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
      navigate('/stockship/employee/deals');
    } finally {
      setLoading(false);
    }
  };

  const saveShippingData = async (showMessage = false) => {
    if (!deal) return;

    try {
      setIsSaving(true);
      const shippingData = {
        shippingType: shippingType || 'LAND',
        ...(shippingType === 'SEA' ? { shippingCost: parseFloat(shippingCost) || 0 } : {}),
        ...(shippingType === 'LAND' ? { shippingCompanyId: selectedShippingCompany } : {})
      };

      await dealApi.updateDealShipping(id, shippingData);
      setLastSaved(new Date());
      
      if (showMessage) {
        showToast.success(t('common.savedSuccessfully') || 'تم الحفظ بنجاح');
      }
    } catch (error) {
      console.error('Error saving shipping data:', error);
      if (showMessage) {
        showToast.error(t('common.saveFailed') || 'فشل في الحفظ');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save shipping data when it changes
  React.useEffect(() => {
    if (deal && shippingType) {
      const timeoutId = setTimeout(() => {
        saveShippingData();
      }, 1000); // Save after 1 second of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [shippingCost, selectedShippingCompany, shippingType]);

  const canSendQuote = () => {
    if (!deal) return false;

    // Check if deal is in a state that allows sending quotes
    const allowedStatuses = ['NEGOTIATION', 'APPROVED'];
    if (!allowedStatuses.includes(deal.status)) {
      if (deal.status === 'PAID') {
        showToast.error(t('mediation.deals.cannotSendQuoteAfterPayment') || 'لا يمكن إرسال عرض سعر بعد الدفع');
      } else if (deal.status === 'SETTLED') {
        showToast.error(t('mediation.deals.cannotSendQuoteAfterSettlement') || 'لا يمكن إرسال عرض سعر بعد تسوية الصفقة');
      } else if (deal.status === 'CANCELLED') {
        showToast.error(t('mediation.deals.cannotSendQuoteCancelled') || 'لا يمكن إرسال عرض سعر لصفقة ملغاة');
      } else {
        showToast.error(t('mediation.deals.cannotSendQuoteInvalidStatus') || 'لا يمكن إرسال عرض سعر في الحالة الحالية للصفقة');
      }
      return false;
    }

    // Check if both parties have agreed (deal is approved)
    if (deal.status === 'NEGOTIATION') {
      showToast.error(t('mediation.deals.waitForBothPartiesApproval') || 'يجب موافقة الطرفين على الصفقة أولاً قبل إرسال عرض السعر');
      return false;
    }

    return true;
  };

  const handleSendToClient = async () => {
    // Check if deal can send quote
    if (!canSendQuote()) {
      return;
    }

    // Validate shipping information
    if (shippingType === 'SEA' && !shippingCost) {
      showToast.error(t('mediation.deals.shippingCostRequired') || 'تكلفة الشحن مطلوبة');
      return;
    }
    
    if (shippingType === 'LAND' && !selectedShippingCompany) {
      showToast.error(t('mediation.deals.shippingCompanyRequired') || 'شركة الشحن مطلوبة');
      return;
    }

    try {
      setSendingToClient(true);
      const shippingData = {
        shippingType: shippingType || 'LAND',
        ...(shippingType === 'SEA' ? { shippingCost: parseFloat(shippingCost) } : {}),
        ...(shippingType === 'LAND' ? { shippingCompanyId: selectedShippingCompany } : {})
      };
      
      await dealApi.sendQuoteToClient(id, shippingData);
      showToast.success(t('mediation.deals.quoteSentToClient') || 'تم إرسال عرض السعر إلى العميل');
    } catch (error) {
      console.error('Send quote to client:', error);
      showToast.error(error.response?.data?.message || (t('mediation.deals.quoteSendFailed') || 'فشل الإرسال'));
    } finally {
      setSendingToClient(false);
    }
  };

  const handlePrint = () => {
    const title = t('mediation.deals.priceQuote') || 'عرض السعر';
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    const dealAmount = Number(deal?.negotiatedAmount) || 0;
    const platformRate = platformSettings?.platformCommissionRate != null ? parseFloat(platformSettings.platformCommissionRate) : 2.5;
    const platformComm = (dealAmount * platformRate) / 100;
    
    // Calculate shipping cost for print
    let printShippingCost = 0;
    if (shippingType === 'SEA') {
      printShippingCost = parseFloat(shippingCost) || 0;
    } else if (shippingType === 'LAND' && selectedShippingCompany) {
      const selectedCompany = shippingCompanies.find(c => c.id === selectedShippingCompany);
      printShippingCost = selectedCompany?.pricePerCBM ? 
        (selectedCompany.pricePerCBM * (productState.reduce((total, product) => {
          const totalQty = product.negotiationQuantity || 0;
          const totalCbm = product.quantity > 0 ? (totalQty / product.quantity) * product.cbm : 0;
          return total + totalCbm;
        }, 0))) : 0;
    }
    
    const totalAmount = dealAmount + platformComm + printShippingCost;

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

    const shippingTypeText = shippingType === 'SEA' ? 
      (t('mediation.deals.shippingTypeSea') || 'بحري') : 
      (t('mediation.deals.shippingTypeLand') || 'بري');
    
    const summaryRows = `
      <div style="background:white;padding:1rem;border-radius:0.5rem;margin-top:1rem;border:1px solid #e5e7eb;">
        <p style="margin:0;display:flex;justify-content:space-between;"><span>${t('mediation.deals.negotiatedAmount') || 'قيمة الصفقة'}</span><strong>$${dealAmount.toFixed(2)}</strong></p>
        <p style="margin:0.5rem 0 0;display:flex;justify-content:space-between;"><span>${t('mediation.deals.platformCommission') || 'عمولة ستوكشيب'} (${platformRate}%)</span><strong>$${platformComm.toFixed(2)}</strong></p>
        <p style="margin:0.5rem 0 0;display:flex;justify-content:space-between;"><span>${t('mediation.deals.shippingToClient') || 'الشحن للعميل'} (${shippingTypeText})</span><strong>$${printShippingCost.toFixed(2)}</strong></p>
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
  const platformComm = (dealAmount * platformRate) / 100;
  
  // Calculate shipping cost based on type
  let actualShippingCost = 0;
  if (shippingType === 'SEA') {
    actualShippingCost = parseFloat(shippingCost) || 0;
  } else if (shippingType === 'LAND' && selectedShippingCompany) {
    const selectedCompany = shippingCompanies.find(c => c.id === selectedShippingCompany);
    actualShippingCost = selectedCompany?.pricePerCBM ? 
      (selectedCompany.pricePerCBM * (productState.reduce((total, product) => {
        const totalQty = product.negotiationQuantity || 0;
        const totalCbm = product.quantity > 0 ? (totalQty / product.quantity) * product.cbm : 0;
        return total + totalCbm;
      }, 0))) : 0;
  }
  
  const totalAmount = dealAmount + platformComm + actualShippingCost;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Header with logo and actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/stockship/employee/deals/${id}`)} className="hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('mediation.deals.priceQuote') || 'عرض السعر'}</h1>
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-medium">{deal.dealNumber}</span>
                <span className="mx-2">•</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  deal.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  deal.status === 'NEGOTIATION' ? 'bg-yellow-100 text-yellow-800' :
                  deal.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                  deal.status === 'SETTLED' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {getStatusTranslation(deal.status)}
                </span>
              </p>
            </div>
          </div>

          {/* Shipping Configuration Section */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              {t('mediation.deals.shippingType') || 'إعدادات الشحن'}
            </h3>
            
            {/* Shipping Type Selector */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-600 min-w-[80px]">
                  {t('mediation.deals.shippingType') || 'نوع الشحن'}:
                </label>
                <select
                  value={shippingType}
                  onChange={(e) => {
                    setShippingType(e.target.value);
                    setShippingCost('');
                    setSelectedShippingCompany('');
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                >
                  <option value="LAND">{t('mediation.deals.shippingTypeLand') || 'بري'}</option>
                  <option value="SEA">{t('mediation.deals.shippingTypeSea') || 'بحري'}</option>
                </select>
              </div>

              {/* Shipping Cost for SEA */}
              {shippingType === 'SEA' && (
                <div className="flex flex-wrap items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="text-sm font-medium text-blue-700 min-w-[80px]">
                    {t('mediation.deals.shippingCost') || 'تكلفة الشحن'}:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(e.target.value)}
                      placeholder={t('mediation.deals.enterShippingCost') || 'أدخل تكلفة الشحن'}
                      className="rounded-lg border border-blue-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-32 bg-white"
                      min="0"
                      step="0.01"
                    />
                    <span className="text-xs text-blue-600 font-medium">USD</span>
                  </div>
                  <button
                    onClick={() => saveShippingData(true)}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                        {t('common.saving') || 'جاري الحفظ...'}
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {t('common.save') || 'حفظ'}
                      </>
                    )}
                  </button>
                  {lastSaved && shippingType === 'SEA' && shippingCost && (
                    <div className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {t('common.savedAt') || 'حُفظ في'} {lastSaved.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              )}

              {/* Shipping Company for LAND */}
              {shippingType === 'LAND' && (
                <div className="flex flex-wrap items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <label className="text-sm font-medium text-green-700 min-w-[80px]">
                    {t('mediation.deals.shippingCompany') || 'شركة الشحن'}:
                  </label>
                  <select
                    value={selectedShippingCompany}
                    onChange={(e) => setSelectedShippingCompany(e.target.value)}
                    className="rounded-lg border border-green-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 min-w-[200px] bg-white"
                  >
                    <option value="">{t('mediation.deals.selectShippingCompany') || 'اختر شركة الشحن'}</option>
                    {shippingCompanies.map(company => (
                      <option key={company.id} value={company.id}>
                        {language === 'ar' ? company.nameAr : company.nameEn} {company.pricePerCBM ? `($${company.pricePerCBM}/CBM)` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedShippingCompany && lastSaved && (
                    <div className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {t('common.savedAt') || 'حُفظ في'} {lastSaved.toLocaleTimeString()}
                    </div>
                  )}
                  {isSaving && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      {t('common.saving') || 'جاري الحفظ...'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Button
          onClick={handleSendToClient}
          disabled={sendingToClient || !canSendQuote()}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            canSendQuote() 
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl' 
              : 'bg-gray-400 cursor-not-allowed text-white'
          }`}
        >
          {sendingToClient ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {t('common.loading') || 'جاري الإرسال...'}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {t('mediation.deals.sendToClient') || 'إرسال إلى العميل'}
            </>
          )}
        </Button>
        <Button 
          onClick={handlePrint} 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
        >
          <Printer className="w-4 h-4" />
          {t('mediation.deals.printOrPdf') || 'طباعة / حفظ PDF'}
        </Button>
      </div>

      {/* Company Header & Deal Information */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold">Stockship</h2>
          <div className="text-sm opacity-90">
            {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-blue-100 text-sm mb-1">{t('mediation.deals.dealNumber') || 'رقم الصفقة'}</p>
            <p className="font-bold text-lg">{deal.dealNumber}</p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-blue-100 text-sm mb-1">{t('mediation.deals.client') || 'العميل'}</p>
            <p className="font-semibold">{deal.client?.name || '—'}</p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-blue-100 text-sm mb-1">{t('mediation.deals.trader') || 'التاجر'}</p>
            <p className="font-semibold">{deal.trader?.name || deal.trader?.companyName || '—'}</p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-blue-100 text-sm mb-1">{t('mediation.deals.employee') || 'الموظف'}</p>
            <p className="font-semibold">{deal.employee?.name || '—'}</p>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-blue-100 text-sm mb-1">{t('mediation.deals.status') || 'الحالة'}</p>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              deal.status === 'APPROVED' ? 'bg-green-500 text-white' : 
              deal.status === 'PAID' ? 'bg-blue-500 text-white' : 
              deal.status === 'SETTLED' ? 'bg-purple-500 text-white' : 
              deal.status === 'CANCELLED' ? 'bg-red-500 text-white' : 
              'bg-yellow-500 text-white'
            }`}>
              {getStatusTranslation(deal.status)}
            </div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-blue-100 text-sm mb-1">{t('mediation.deals.shippingType') || 'نوع الشحن'}</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${shippingType === 'SEA' ? 'bg-blue-300' : 'bg-green-300'}`}></div>
              <p className="font-semibold">
                {shippingType === 'SEA' ? (t('mediation.deals.shippingTypeSea') || 'بحري') : (t('mediation.deals.shippingTypeLand') || 'بري')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Status Warning */}
      {deal && !canSendQuote() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-sm">⚠️</span>
            </div>
            <div>
              <h3 className="font-semibold text-yellow-800">{t('mediation.deals.quoteNotAvailable') || 'عرض السعر غير متاح'}</h3>
              <p className="text-sm text-yellow-700 mt-1">
                {deal.status === 'NEGOTIATION' && (t('mediation.deals.waitForBothPartiesApproval') || 'يجب موافقة الطرفين على الصفقة أولاً')}
                {deal.status === 'PAID' && (t('mediation.deals.cannotSendQuoteAfterPayment') || 'لا يمكن إرسال عرض سعر بعد الدفع')}
                {deal.status === 'SETTLED' && (t('mediation.deals.cannotSendQuoteAfterSettlement') || 'لا يمكن إرسال عرض سعر بعد تسوية الصفقة')}
                {deal.status === 'CANCELLED' && (t('mediation.deals.cannotSendQuoteCancelled') || 'لا يمكن إرسال عرض سعر لصفقة ملغاة')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Products Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{t('mediation.deals.items') || 'عناصر الصفقة'}</h2>
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-sm text-gray-500">{productState.length} {t('mediation.deals.items') || 'عنصر'}</span>
        </div>

        {productState.map((product, index) => {
          const totalQty = product.negotiationQuantity || 0;
          const totalCbmProduct = product.quantity > 0 ? (totalQty / product.quantity) * product.cbm : 0;
          const totalPriceProduct = totalQty * (product.negotiationPrice || 0);
          return (
            <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
                <div className="space-y-3 relative">
                  <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-square shadow-inner">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80'; }}
                    />
                    <div className="absolute top-3 left-3 w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      {index + 1}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
                      <p className="text-white text-xs font-medium truncate">{product.title}</p>
                    </div>
                  </div>
                  <div className="w-full aspect-square max-w-[80px] rounded border border-gray-200 flex items-center justify-center bg-gray-50">
                    <Video className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{product.title}</h3>
                    <p className="text-sm text-gray-500">{product.itemNumber}</p>
                    {product.description && (
                      <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                    )}
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

      {/* Financial Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6 mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">{t('mediation.deals.financialSummary') || 'الملخص المالي'}</h3>
          <div className="h-px bg-gray-300 flex-1"></div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700 font-medium">{t('mediation.deals.negotiatedAmount') || 'قيمة الصفقة'}</span>
            </div>
            <span className="text-lg font-bold text-gray-900">${dealAmount.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-700 font-medium">
                {t('mediation.deals.platformCommission') || 'عمولة ستوكشيب'} 
                <span className="text-sm text-gray-500 ml-1">({platformRate}%)</span>
              </span>
            </div>
            <span className="text-lg font-bold text-purple-600">${platformComm.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${shippingType === 'SEA' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
              <span className="text-gray-700 font-medium">
                {t('mediation.deals.shippingToClient') || 'الشحن للعميل'}
                <span className="text-sm text-gray-500 ml-1">
                  ({shippingType === 'SEA' ? (t('mediation.deals.shippingTypeSea') || 'بحري') : (t('mediation.deals.shippingTypeLand') || 'بري')})
                </span>
              </span>
            </div>
            <span className={`text-lg font-bold ${shippingType === 'SEA' ? 'text-blue-600' : 'text-green-600'}`}>
              ${actualShippingCost.toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between items-center pt-6 mt-6 border-t-2 border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 -mx-6 px-6 py-4 rounded-b-lg">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">{t('mediation.deals.grandTotal') || 'الإجمالي النهائي'}</span>
            </div>
            <span className="text-3xl font-bold text-green-700">${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealPriceQuotePage;
