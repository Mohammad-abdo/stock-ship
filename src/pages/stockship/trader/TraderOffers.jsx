import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import StandardDataTable from '@/components/StandardDataTable';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Eye, 
  Edit, 
  Upload,
  Gift,
  Package,
  Plus,
  Filter,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { traderApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';

const TraderOffers = () => {
  const navigate = useNavigate();
  const { getAuth } = useMultiAuth();
  const { t, language, isRTL } = useLanguage();
  const { user } = getAuth('trader');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [dateFilter, setDateFilter] = useState('all');
  const [itemsFilter, setItemsFilter] = useState('all');
  const [dealsFilter, setDealsFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchOffers();
    }
  }, [user, pagination.page, statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchOffers();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await traderApi.getTraderOffers(user.id, params);
      const data = response.data?.data || response.data || [];
      setOffers(Array.isArray(data) ? data : []);
      if (response.data?.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      } else {
        // Client-side pagination fallback
        setPagination(prev => ({
          ...prev,
          total: Array.isArray(data) ? data.length : 0,
          pages: Math.ceil((Array.isArray(data) ? data.length : 0) / pagination.limit) || 1
        }));
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      showToast.error(
        t('mediation.offers.loadFailed') || 'Failed to load offers',
        error.response?.data?.message || 'Please try again'
      );
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const sortOffers = (offers) => {
    return [...offers].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'title':
          aValue = a.title || '';
          bValue = b.title || '';
          break;
        case 'items':
          aValue = a._count?.items || a.items?.length || 0;
          bValue = b._count?.items || b.items?.length || 0;
          break;
        case 'deals':
          aValue = a._count?.deals || 0;
          bValue = b._count?.deals || 0;
          break;
        case 'totalCBM':
          aValue = Number(a.totalCBM) || 0;
          bValue = Number(b.totalCBM) || 0;
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

  const getFilteredOffers = () => {
    let filtered = offers.filter(offer => {
      // Search filter
      const matchesSearch = 
        offer.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = !statusFilter || offer.status === statusFilter;
      
      // Date filter
      let matchesDate = true;
      if (dateFilter !== "all") {
        const offerDate = new Date(offer.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now - offerDate) / (1000 * 60 * 60 * 24));
        
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
      
      // Items filter
      let matchesItems = true;
      if (itemsFilter !== "all") {
        const itemsCount = offer._count?.items || offer.items?.length || 0;
        switch (itemsFilter) {
          case "few":
            matchesItems = itemsCount <= 5;
            break;
          case "medium":
            matchesItems = itemsCount > 5 && itemsCount <= 20;
            break;
          case "many":
            matchesItems = itemsCount > 20;
            break;
        }
      }

      // Deals filter
      let matchesDeals = true;
      if (dealsFilter !== "all") {
        const dealsCount = offer._count?.deals || 0;
        switch (dealsFilter) {
          case "none":
            matchesDeals = dealsCount === 0;
            break;
          case "active":
            matchesDeals = dealsCount > 0;
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate && matchesItems && matchesDeals;
    });

    return sortOffers(filtered);
  };

  const filteredOffers = getFilteredOffers();

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.offers.draft') || 'Draft', icon: FileText },
      PENDING_VALIDATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('mediation.offers.pending') || 'Pending', icon: Clock },
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: t('mediation.offers.active') || 'Active', icon: CheckCircle },
      CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.offers.closed') || 'Closed', icon: XCircle },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: t('mediation.offers.rejected') || 'Rejected', icon: XCircle }
    };
    const config = statusConfig[status] || statusConfig.DRAFT;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOfferImage = (offer) => {
    // Try to get image from first item
    if (offer.items && offer.items.length > 0) {
      const firstItem = offer.items[0];
      if (firstItem.images) {
        try {
          const images = typeof firstItem.images === 'string' 
            ? JSON.parse(firstItem.images) 
            : firstItem.images;
          if (Array.isArray(images) && images.length > 0) {
            const imageUrl = typeof images[0] === 'string' ? images[0] : images[0]?.url;
            if (imageUrl) {
              if (imageUrl.startsWith('http')) return imageUrl;
              return `http://localhost:5000${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
            }
          }
        } catch (e) {
          console.warn('Error parsing images:', e);
        }
      }
    }
    
    // Default placeholder image
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';
  };

  const columns = [
    {
      key: 'title',
      label: t('mediation.offers.offerTitle') || 'Title',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-gray-400" />
          <div className="flex flex-col">
            <span className="font-medium text-sm text-gray-900">{value || 'N/A'}</span>
            {row.description && (
              <span className="text-xs text-gray-500 line-clamp-1">{row.description}</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: t('mediation.common.status') || 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'items_count',
      label: t('mediation.offers.items') || 'Items',
      render: (value, row) => (
        <div className="flex items-center gap-1.5">
          <Package className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            {row._count?.items || row.items?.length || 0}
          </span>
        </div>
      )
    },
    {
      key: 'totalCBM',
      label: t('mediation.offers.totalCBM') || 'Total CBM',
      render: (value) => (
        <span className="text-sm font-medium text-gray-900">
          {(Number(value) || 0).toFixed(2)}
        </span>
      )
    },
    {
      key: 'deals_count',
      label: t('mediation.offers.deals') || 'Deals',
      render: (value, row) => (
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            {row._count?.deals || 0}
          </span>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: t('mediation.common.createdAt') || 'Created',
      render: (value) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(value)}</span>
        </div>
      )
    }
  ];

  const rowActions = (row) => (
    <div className={`flex items-center gap-1 ${isRTL ? 'justify-start' : 'justify-end'}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/stockship/trader/offers/${row.id}`);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('mediation.offers.viewDetails') || 'View Details'}
      >
        <Eye className="w-4 h-4 text-gray-600" />
      </button>
      {row.status === 'DRAFT' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/stockship/trader/offers/${row.id}/edit`);
          }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title={t('common.edit') || 'Edit'}
        >
          <Edit className="w-4 h-4 text-gray-600" />
        </button>
      )}
      {row.status === 'PENDING_VALIDATION' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/stockship/trader/offers/${row.id}/upload`);
          }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title={t('mediation.offers.uploadData') || 'Upload Data'}
        >
          <Upload className="w-4 h-4 text-gray-600" />
        </button>
      )}
      {row.status === 'ACTIVE' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/stockship/trader/offers/${row.id}/support-tickets/create`);
          }}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          title={t('mediation.support.createTicket') || 'Create Support Ticket'}
        >
          <MessageSquare className="w-4 h-4 text-green-600" />
        </button>
      )}
    </div>
  );

  // Calculate stats from pagination total (if available) or current offers
  const stats = {
    total: pagination.total || offers.length,
    active: offers.filter(o => o.status === 'ACTIVE').length,
    pending: offers.filter(o => o.status === 'PENDING_VALIDATION').length,
    draft: offers.filter(o => o.status === 'DRAFT').length
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('mediation.trader.myOffers') || 'My Offers'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('mediation.trader.myOffersDesc') || 'Manage and track your product offers'}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/stockship/trader/offers/create')}
          className={`flex items-center gap-2 px-6 py-2.5 bg-yellow-400 text-blue-900 font-bold rounded-lg hover:bg-yellow-300 transition-colors shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <Plus className="w-4 h-4" />
          <span>{t('mediation.trader.createOffer') || 'Create Offer'}</span>
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('mediation.offers.totalOffers') || 'Total Offers'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Gift className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('mediation.offers.active') || 'Active'}</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('mediation.offers.pending') || 'Pending'}</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('mediation.offers.draft') || 'Draft'}</p>
                <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          {/* View Mode Toggle */}
          <div className={`flex justify-between items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-sm font-medium text-gray-700">
                {t('viewMode') || 'View Mode'}:
              </span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  {t('cards') || 'Cards'}
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                  {t('table') || 'Table'}
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {t('showingResults') || 'Showing'}: {filteredOffers.length} {t('of') || 'of'} {offers.length}
            </div>
          </div>

          {/* Filters */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 ${isRTL ? 'text-right' : 'text-left'}`}>
            {/* Search */}
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
              <input
                type="text"
                placeholder={t('searchOffers') || 'Search offers...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">{t('allStatuses') || 'All Statuses'}</option>
              <option value="DRAFT">{t('mediation.offers.draft') || 'Draft'}</option>
              <option value="PENDING_VALIDATION">{t('mediation.offers.pending') || 'Pending'}</option>
              <option value="ACTIVE">{t('mediation.offers.active') || 'Active'}</option>
              <option value="CLOSED">{t('mediation.offers.closed') || 'Closed'}</option>
              <option value="REJECTED">{t('mediation.offers.rejected') || 'Rejected'}</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">{t('allTime') || 'All Time'}</option>
              <option value="today">{t('today') || 'Today'}</option>
              <option value="week">{t('thisWeek') || 'This Week'}</option>
              <option value="month">{t('thisMonth') || 'This Month'}</option>
              <option value="3months">{t('last3Months') || 'Last 3 Months'}</option>
            </select>

            {/* Items Filter */}
            <select
              value={itemsFilter}
              onChange={(e) => setItemsFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">{t('allItems') || 'All Items'}</option>
              <option value="few">{t('fewItems') || 'Few Items (≤5)'}</option>
              <option value="medium">{t('mediumItems') || 'Medium Items (6-20)'}</option>
              <option value="many">{t('manyItems') || 'Many Items (>20)'}</option>
            </select>

            {/* Deals Filter */}
            <select
              value={dealsFilter}
              onChange={(e) => setDealsFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">{t('allDeals') || 'All Deals'}</option>
              <option value="none">{t('noDeals') || 'No Deals'}</option>
              <option value="active">{t('withDeals') || 'With Deals'}</option>
            </select>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="createdAt">{t('date') || 'Date'}</option>
                <option value="title">{t('title') || 'Title'}</option>
                <option value="items">{t('items') || 'Items'}</option>
                <option value="deals">{t('deals') || 'Deals'}</option>
                <option value="totalCBM">{t('totalCBM') || 'Total CBM'}</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title={sortOrder === 'asc' ? t('ascending') || 'Ascending' : t('descending') || 'Descending'}
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offers Display */}
      {loading ? (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">{t('loading') || 'Loading...'}</span>
            </div>
          </CardContent>
        </Card>
      ) : filteredOffers.length === 0 ? (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Gift className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('noOffersFound') || 'No offers found'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter || dateFilter !== 'all' || itemsFilter !== 'all' || dealsFilter !== 'all'
                  ? t('tryAdjustingFilters') || 'Try adjusting your filters to see more results.'
                  : t('createFirstOffer') || 'Create your first offer to get started.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer, index) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                <div 
                  onClick={() => navigate(`/stockship/trader/offers/${offer.id}`)}
                  className="block"
                >
                  {/* Offer Image */}
                  <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                    <img
                      src={getOfferImage(offer)}
                      alt={offer.title || 'Offer'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(offer.status)}
                    </div>
                  </div>

                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white">
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Gift className="w-5 h-5" />
                        <span className="font-semibold text-sm">
                          {t('offer') || 'Offer'} #{offer.id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mt-1 line-clamp-1">
                      {offer.title || t('noTitle') || 'No Title'}
                    </h3>
                  </div>

                  {/* Card Content */}
                  <CardContent className="p-4 space-y-4">
                    {/* Description */}
                    {offer.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {offer.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Package className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t('items') || 'Items'}</p>
                          <p className="font-semibold text-gray-900">
                            {offer._count?.items || offer.items?.length || 0}
                          </p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t('deals') || 'Deals'}</p>
                          <p className="font-semibold text-gray-900">
                            {offer._count?.deals || 0}
                          </p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t('totalCBM') || 'Total CBM'}</p>
                          <p className="font-semibold text-gray-900">
                            {(Number(offer.totalCBM) || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t('created') || 'Created'}</p>
                          <p className="font-semibold text-gray-900 text-xs">
                            {formatDate(offer.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  {/* Card Actions */}
                  <div className="px-4 pb-4 pt-0">
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/stockship/trader/offers/${offer.id}`);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        {t('viewDetails') || 'View Details'}
                      </button>

                      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {offer.status === 'DRAFT' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/stockship/trader/offers/${offer.id}/edit`);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title={t('common.edit') || 'Edit'}
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                        {offer.status === 'PENDING_VALIDATION' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/stockship/trader/offers/${offer.id}/upload`);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title={t('mediation.offers.uploadData') || 'Upload Data'}
                          >
                            <Upload className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                        {offer.status === 'ACTIVE' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/stockship/trader/offers/${offer.id}/support-tickets/create`);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title={t('mediation.support.createTicket') || 'Create Support Ticket'}
                          >
                            <MessageSquare className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {t('mediation.offers.list') || 'Offers List'} ({filteredOffers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className={`pb-3 text-sm font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('offer') || 'Offer'}
                    </th>
                    <th className={`pb-3 text-sm font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('status') || 'Status'}
                    </th>
                    <th className={`pb-3 text-sm font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('items') || 'Items'}
                    </th>
                    <th className={`pb-3 text-sm font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('deals') || 'Deals'}
                    </th>
                    <th className={`pb-3 text-sm font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('totalCBM') || 'Total CBM'}
                    </th>
                    <th className={`pb-3 text-sm font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('created') || 'Created'}
                    </th>
                    <th className={`pb-3 text-sm font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('actions') || 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOffers.map((offer, index) => (
                    <motion.tr
                      key={offer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/stockship/trader/offers/${offer.id}`)}
                    >
                      <td className="py-4">
                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <img
                            src={getOfferImage(offer)}
                            alt={offer.title || 'Offer'}
                            className="w-12 h-12 rounded-lg object-cover"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              {offer.title || t('noTitle') || 'No Title'}
                            </div>
                            <div className="text-sm text-gray-500">
                              #{offer.id.slice(-8).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        {getStatusBadge(offer.status)}
                      </td>
                      <td className="py-4">
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {offer._count?.items || offer.items?.length || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {offer._count?.deals || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="font-medium text-gray-900">
                          {(Number(offer.totalCBM) || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatDate(offer.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/stockship/trader/offers/${offer.id}`);
                            }}
                            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                            title={t('viewDetails') || 'View Details'}
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          {offer.status === 'DRAFT' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/stockship/trader/offers/${offer.id}/edit`);
                              }}
                              className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                              title={t('common.edit') || 'Edit'}
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </button>
                          )}
                          {offer.status === 'PENDING_VALIDATION' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/stockship/trader/offers/${offer.id}/upload`);
                              }}
                              className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                              title={t('mediation.offers.uploadData') || 'Upload Data'}
                            >
                              <Upload className="w-4 h-4 text-gray-600" />
                            </button>
                          )}
                          {offer.status === 'ACTIVE' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/stockship/trader/offers/${offer.id}/support-tickets/create`);
                              }}
                              className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                              title={t('mediation.support.createTicket') || 'Create Support Ticket'}
                            >
                              <MessageSquare className="w-4 h-4 text-green-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default TraderOffers;
