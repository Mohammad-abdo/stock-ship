import { useState, useEffect } from "react";
import { useMultiAuth } from "@/contexts/MultiAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { dealApi } from "@/lib/mediationApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { FileText, Search, Eye, User, DollarSign, Calendar, Package, Loader2, Grid3X3, List, Filter, SortAsc, SortDesc, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import showToast from "@/lib/toast";
import { cn } from "@/lib/utils";

export default function TraderDeals() {
  const { getAuth } = useMultiAuth();
  const { t, language, isRTL } = useLanguage();
  const { user } = getAuth('trader');
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "table"
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [dateFilter, setDateFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");

  useEffect(() => {
    if (user?.id) {
      loadDeals();
    }
  }, [user]);

  const loadDeals = async () => {
    try {
      const response = await dealApi.getDeals({ traderId: user.id });
      setDeals(response.data.data || []);
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNegotiatedAmount = (deal) => {
    if (deal.negotiatedAmount != null && Number(deal.negotiatedAmount) > 0) {
      return Number(deal.negotiatedAmount);
    }
    if (deal.items?.length) {
      const total = deal.items.reduce((sum, item) => {
        const qty = Number(item.quantity) || Number(item.cartons) || 0;
        const price = Number(item.negotiatedPrice) || Number(item.offerItem?.unitPrice) || Number(item.unitPrice) || 0;
        return sum + qty * price;
      }, 0);
      if (total > 0) return total;
    }
    return null;
  };

  const getDealImages = (deal) => {
    const images = [];
    
    // Get images from offer items
    if (deal.offer?.items?.length) {
      deal.offer.items.forEach(item => {
        if (item.images) {
          try {
            const itemImages = typeof item.images === 'string' 
              ? JSON.parse(item.images) 
              : item.images;
            
            if (Array.isArray(itemImages)) {
              itemImages.forEach(img => {
                const imageUrl = typeof img === 'string' ? img : img?.url;
                if (imageUrl) {
                  const fullUrl = imageUrl.startsWith('http') 
                    ? imageUrl 
                    : `http://localhost:5000${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
                  images.push({
                    url: fullUrl,
                    alt: item.nameAr || item.nameEn || 'Product Image'
                  });
                }
              });
            }
          } catch (e) {
            console.warn('Error parsing item images:', e);
          }
        }
      });
    }

    // Get images from deal items (if different structure)
    if (deal.items?.length) {
      deal.items.forEach(item => {
        if (item.images) {
          try {
            const itemImages = typeof item.images === 'string' 
              ? JSON.parse(item.images) 
              : item.images;
            
            if (Array.isArray(itemImages)) {
              itemImages.forEach(img => {
                const imageUrl = typeof img === 'string' ? img : img?.url;
                if (imageUrl) {
                  const fullUrl = imageUrl.startsWith('http') 
                    ? imageUrl 
                    : `http://localhost:5000${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
                  images.push({
                    url: fullUrl,
                    alt: item.nameAr || item.nameEn || 'Product Image'
                  });
                }
              });
            }
          } catch (e) {
            console.warn('Error parsing item images:', e);
          }
        }
      });
    }

    // Remove duplicates and limit to 6 images
    const uniqueImages = images.filter((img, index, self) => 
      index === self.findIndex(i => i.url === img.url)
    ).slice(0, 6);

    return uniqueImages;
  };

  const ImageGallery = ({ images, dealTitle }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showGallery, setShowGallery] = useState(false);

    if (!images || images.length === 0) {
      return (
        <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">{t("noImages") || "لا توجد صور"}</p>
          </div>
        </div>
      );
    }

    const nextImage = () => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
      <>
        <div className="relative">
          {/* Main Image */}
          <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden group">
            <img
              src={images[currentImageIndex]?.url}
              alt={images[currentImageIndex]?.alt || dealTitle}
              className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
              onClick={() => setShowGallery(true)}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';
              }}
            />
            
            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}

            {/* Gallery button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowGallery(true);
              }}
              className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded hover:bg-black/70 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-1 mt-2 overflow-x-auto">
              {images.slice(0, 4).map((img, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`flex-shrink-0 w-8 h-8 rounded border-2 overflow-hidden ${
                    index === currentImageIndex ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                </button>
              ))}
              {images.length > 4 && (
                <div className="flex-shrink-0 w-8 h-8 rounded border-2 border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                  +{images.length - 4}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Full Gallery Modal */}
        {showGallery && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setShowGallery(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <img
                src={images[currentImageIndex]?.url}
                alt={images[currentImageIndex]?.alt || dealTitle}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80';
                }}
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-center">
                <p className="text-sm opacity-80">{images[currentImageIndex]?.alt || dealTitle}</p>
                {images.length > 1 && (
                  <p className="text-xs opacity-60 mt-1">
                    {currentImageIndex + 1} {t("of") || "من"} {images.length}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const sortDeals = (deals) => {
    return [...deals].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'amount':
          aValue = Number(a.negotiatedAmount) || getNegotiatedAmount(a) || 0;
          bValue = Number(b.negotiatedAmount) || getNegotiatedAmount(b) || 0;
          break;
        case 'dealNumber':
          aValue = a.dealNumber || '';
          bValue = b.dealNumber || '';
          break;
        case 'client':
          aValue = a.client?.name || '';
          bValue = b.client?.name || '';
          break;
        default:
          aValue = a[sortBy] || '';
          bValue = b[sortBy] || '';
      }
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });
  };

  const filteredDeals = sortDeals(deals.filter(deal => {
    const matchesSearch = 
      deal.dealNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.offer?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || deal.status === statusFilter;
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== "all") {
      const dealDate = new Date(deal.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now - dealDate) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case "today":
          matchesDate = daysDiff === 0;
          break;
        case "week":
          matchesDate = daysDiff <= 7;
          break;
        case "month":
          matchesDate = daysDiff <= 30;
          break;
        case "3months":
          matchesDate = daysDiff <= 90;
          break;
      }
    }
    
    // Amount filter
    let matchesAmount = true;
    if (amountFilter !== "all") {
      const amount = Number(deal.negotiatedAmount) || getNegotiatedAmount(deal) || 0;
      switch (amountFilter) {
        case "low":
          matchesAmount = amount < 1000;
          break;
        case "medium":
          matchesAmount = amount >= 1000 && amount < 10000;
          break;
        case "high":
          matchesAmount = amount >= 10000;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate && matchesAmount;
  }));

  const getStatusBadge = (status) => {
    const config = {
      NEGOTIATION: { className: "bg-amber-100 text-amber-800 border-amber-200", label: t("mediation.deals.negotiation") || "Negotiation" },
      APPROVED: { className: "bg-blue-100 text-blue-800 border-blue-200", label: t("mediation.deals.approved") || "Approved" },
      PAID: { className: "bg-emerald-100 text-emerald-800 border-emerald-200", label: t("mediation.deals.paid") || "Paid" },
      SETTLED: { className: "bg-slate-100 text-slate-700 border-slate-200", label: t("mediation.deals.settled") || "Settled" },
      CANCELLED: { className: "bg-red-100 text-red-800 border-red-200", label: t("mediation.deals.cancelled") || "Cancelled" }
    };
    const { className, label } = config[status] || { className: "bg-gray-100 text-gray-700 border-gray-200", label: status };
    return <Badge variant="outline" className={cn("font-medium border", className)}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 p-4 sm:p-6", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {t("mediation.deals.myDeals") || "My Deals"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("mediation.deals.manageDealsFromOffers") || "Manage deals from your offers"}
          </p>
        </div>
        {filteredDeals.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <FileText className="h-4 w-4" />
            {filteredDeals.length} {filteredDeals.length === 1 ? "deal" : "deals"}
          </span>
        )}
      </div>

      {/* Filters and Controls */}
      <Card className="border border-border/50 shadow-sm">
        <CardContent className="pt-6">
          {/* Search and View Toggle */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
              <Input
                type="text"
                placeholder={t("mediation.deals.searchDeals") || "البحث برقم الصفقة، العميل، أو العرض..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn("h-10 pl-10 pr-4", isRTL && "pl-4 pr-10")}
              />
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("cards")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  viewMode === "cards" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
                {t("common.cards") || "كروت"}
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  viewMode === "table" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                )}
              >
                <List className="w-4 h-4" />
                {t("common.table") || "جدول"}
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("mediation.deals.status") || "الحالة"}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t("mediation.deals.allStatus") || "جميع الحالات"}</option>
                <option value="NEGOTIATION">{t("mediation.deals.negotiation") || "تفاوض"}</option>
                <option value="APPROVED">{t("mediation.deals.approved") || "موافق عليه"}</option>
                <option value="PAID">{t("mediation.deals.paid") || "مدفوع"}</option>
                <option value="SETTLED">{t("mediation.deals.settled") || "مسوى"}</option>
                <option value="CANCELLED">{t("mediation.deals.cancelled") || "ملغى"}</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("mediation.deals.dateRange") || "الفترة الزمنية"}
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t("mediation.deals.allTime") || "كل الأوقات"}</option>
                <option value="today">{t("mediation.deals.today") || "اليوم"}</option>
                <option value="week">{t("mediation.deals.thisWeek") || "هذا الأسبوع"}</option>
                <option value="month">{t("mediation.deals.thisMonth") || "هذا الشهر"}</option>
                <option value="3months">{t("mediation.deals.last3Months") || "آخر 3 شهور"}</option>
              </select>
            </div>

            {/* Amount Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("mediation.deals.amountRange") || "نطاق المبلغ"}
              </label>
              <select
                value={amountFilter}
                onChange={(e) => setAmountFilter(e.target.value)}
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t("mediation.deals.allAmounts") || "جميع المبالغ"}</option>
                <option value="low">{t("mediation.deals.lowAmount") || "أقل من $1,000"}</option>
                <option value="medium">{t("mediation.deals.mediumAmount") || "$1,000 - $10,000"}</option>
                <option value="high">{t("mediation.deals.highAmount") || "أكثر من $10,000"}</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("mediation.deals.sortBy") || "ترتيب حسب"}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">{t("mediation.deals.date") || "التاريخ"}</option>
                <option value="amount">{t("mediation.deals.amount") || "المبلغ"}</option>
                <option value="dealNumber">{t("mediation.deals.dealNumber") || "رقم الصفقة"}</option>
                <option value="client">{t("mediation.deals.client") || "العميل"}</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("mediation.deals.order") || "الترتيب"}
              </label>
              <button
                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                {sortOrder === "desc" ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                {sortOrder === "desc" ? (t("common.descending") || "تنازلي") : (t("common.ascending") || "تصاعدي")}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deals Display */}
      {filteredDeals.length > 0 ? (
        viewMode === "cards" ? (
          /* Cards View */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDeals.map((deal) => (
              <Card key={deal.id} className="overflow-hidden border border-border/50 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                <CardContent className="p-0">
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-mono text-lg font-bold text-gray-900">
                        {deal.dealNumber}
                      </h3>
                      {getStatusBadge(deal.status)}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {deal.offer?.title || t("mediation.deals.noTitle") || "بدون عنوان"}
                    </p>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-4">
                    {/* Image Gallery */}
                    <ImageGallery 
                      images={getDealImages(deal)} 
                      dealTitle={deal.offer?.title || deal.dealNumber}
                    />

                    {/* Client Info */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">
                          {t("mediation.deals.client") || "العميل"}
                        </p>
                        <p className="font-semibold text-gray-900 truncate">
                          {deal.client?.name || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Amount and Date */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        <p className="text-xs text-gray-500 mb-1">
                          {t("mediation.deals.amount") || "المبلغ"}
                        </p>
                        <p className="font-bold text-green-700">
                          ${(Number(deal.negotiatedAmount) || getNegotiatedAmount(deal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                        <p className="text-xs text-gray-500 mb-1">
                          {t("mediation.deals.created") || "تاريخ الإنشاء"}
                        </p>
                        <p className="font-semibold text-purple-700 text-sm">
                          {new Date(deal.createdAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      to={`/stockship/trader/deals/${deal.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg px-4 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      {t("mediation.deals.viewDetails") || "عرض التفاصيل"}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Table View */
          <Card className="overflow-hidden border border-border/50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("mediation.deals.dealNumber") || "رقم الصفقة"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("mediation.deals.offer") || "العرض"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("mediation.deals.client") || "العميل"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("mediation.deals.amount") || "المبلغ"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("mediation.deals.status") || "الحالة"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("mediation.deals.created") || "تاريخ الإنشاء"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("common.actions") || "الإجراءات"}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDeals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono text-sm font-semibold text-gray-900">
                          {deal.dealNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {deal.offer?.title || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {deal.client?.name || "—"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          ${(Number(deal.negotiatedAmount) || getNegotiatedAmount(deal) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(deal.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(deal.createdAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { 
                          year: 'numeric',
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/stockship/trader/deals/${deal.id}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          {t("mediation.deals.view") || "عرض"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : (
        <Card className="border border-dashed border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {t("mediation.deals.noDealsFound") || "لا توجد صفقات"}
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {searchTerm || statusFilter !== "all" || dateFilter !== "all" || amountFilter !== "all"
                ? (t("mediation.deals.tryAdjustingFilters") || "جرب تعديل الفلاتر أو البحث.")
                : (t("mediation.deals.dealsAppearWhenClientsRequest") || "ستظهر الصفقات هنا عندما يطلب العملاء التفاوض على عروضك.")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

