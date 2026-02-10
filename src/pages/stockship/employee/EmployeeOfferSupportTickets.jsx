import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import StandardDataTable from '@/components/StandardDataTable';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Search, 
  Filter,
  Eye,
  Loader2,
  AlertCircle,
  Gift,
  Clock,
  CheckCircle,
  XCircle,
  Circle,
  Store,
  Plus
} from 'lucide-react';
import { employeeApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';

const EmployeeOfferSupportTickets = () => {
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { getAuth } = useMultiAuth();
  const { user } = getAuth('employee');

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchTickets();
    }
  }, [user?.id, pagination.page, statusFilter, priorityFilter]);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined
      };
      const response = await employeeApi.getAllOfferSupportTickets(params);
      const data = response.data?.data || response.data;
      
      if (data.tickets || Array.isArray(data)) {
        const ticketsData = Array.isArray(data) ? data : data.tickets;
        setTickets(ticketsData || []);
        
        if (data.pagination || data.page) {
          setPagination(prev => ({
            ...prev,
            total: data.pagination?.total || data.total || ticketsData.length,
            pages: data.pagination?.pages || data.pages || Math.ceil((data.pagination?.total || data.total || ticketsData.length) / pagination.limit)
          }));
        }
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      showToast.error(t('mediation.support.loadFailed') || 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.subject?.toLowerCase().includes(searchLower) ||
        ticket.offer?.title?.toLowerCase().includes(searchLower) ||
        ticket.trader?.companyName?.toLowerCase().includes(searchLower) ||
        ticket.trader?.name?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredTickets(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      OPEN: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Circle, label: t('mediation.support.status.open') || 'Open' },
      IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: t('mediation.support.status.inProgress') || 'In Progress' },
      RESOLVED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: t('mediation.support.status.resolved') || 'Resolved' },
      CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle, label: t('mediation.support.status.closed') || 'Closed' },
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle, label: status };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      LOW: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.support.priority.low') || 'Low' },
      MEDIUM: { bg: 'bg-blue-100', text: 'text-blue-800', label: t('mediation.support.priority.medium') || 'Medium' },
      HIGH: { bg: 'bg-orange-100', text: 'text-orange-800', label: t('mediation.support.priority.high') || 'High' },
      URGENT: { bg: 'bg-red-100', text: 'text-red-800', label: t('mediation.support.priority.urgent') || 'Urgent' },
    };
    const config = priorityConfig[priority] || { bg: 'bg-gray-100', text: 'text-gray-800', label: priority };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const columns = [
    {
      key: 'subject',
      label: t('mediation.support.subject') || 'Subject',
      minWidth: '250px',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">
              {value || t('common.unknown') || 'Unknown'}
            </p>
            {row.offer && (
              <p className="text-xs text-gray-500 truncate">
                {t('mediation.offers.offer') || 'Offer'}: {row.offer.title}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'trader',
      label: t('mediation.offers.trader') || 'Trader',
      minWidth: '200px',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 truncate">
              {row.trader?.companyName || row.trader?.name || 'N/A'}
            </p>
            {row.trader?.traderCode && (
              <p className="text-xs text-gray-500 truncate">{row.trader.traderCode}</p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: t('mediation.common.status') || 'Status',
      minWidth: '120px',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'priority',
      label: t('mediation.support.priorityLabel') || 'Priority',
      minWidth: '100px',
      render: (value) => getPriorityBadge(value)
    },
    {
      key: 'createdAt',
      label: t('common.createdAt') || 'Created',
      minWidth: '150px',
      render: (value) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span className="whitespace-nowrap">
            {value ? new Date(value).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'messages',
      label: t('mediation.support.messages') || 'Messages',
      minWidth: '100px',
      align: 'right',
      render: (value, row) => (
        <span className="text-sm text-gray-600">
          {row.messages?.length || 0}
        </span>
      )
    }
  ];

  const rowActions = (row) => (
    <div className="flex items-center gap-1 justify-end">
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/stockship/employee/offer-support-tickets/${row.id}`);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('common.view') || 'View'}
      >
        <Eye className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('mediation.support.tickets') || 'Offer Support Tickets'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('mediation.support.ticketsDescEmployee') || 'Manage and respond to support tickets. You can also create tickets to communicate with traders.'}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/stockship/employee/offers')}
          className={`flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <Plus className="w-5 h-5" />
          {t('mediation.support.createTicket') || 'Create Ticket'}
        </motion.button>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className={`flex flex-col sm:flex-row gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`relative flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
              <input
                type="text"
                placeholder={t('mediation.support.searchTickets') || 'Search tickets...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white`}
              />
            </div>
            <div className="relative">
              <Filter className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none`} />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white appearance-none min-w-[180px]`}
              >
                <option value="">{t('mediation.support.allStatus') || 'All Status'}</option>
                <option value="OPEN">{t('mediation.support.status.open') || 'Open'}</option>
                <option value="IN_PROGRESS">{t('mediation.support.status.inProgress') || 'In Progress'}</option>
                <option value="RESOLVED">{t('mediation.support.status.resolved') || 'Resolved'}</option>
                <option value="CLOSED">{t('mediation.support.status.closed') || 'Closed'}</option>
              </select>
            </div>
            <div className="relative">
              <Filter className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none`} />
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white appearance-none min-w-[180px]`}
              >
                <option value="">{t('mediation.support.allPriority') || 'All Priority'}</option>
                <option value="LOW">{t('mediation.support.priority.low') || 'Low'}</option>
                <option value="MEDIUM">{t('mediation.support.priority.medium') || 'Medium'}</option>
                <option value="HIGH">{t('mediation.support.priority.high') || 'High'}</option>
                <option value="URGENT">{t('mediation.support.priority.urgent') || 'Urgent'}</option>
              </select>
            </div>
            {(statusFilter || priorityFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setPriorityFilter('');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                {t('mediation.employee.clearFilter') || 'Clear Filter'}
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className={`text-lg font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('mediation.support.tickets') || 'Support Tickets'} ({filteredTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <StandardDataTable
            columns={columns}
            data={filteredTickets}
            loading={loading}
            emptyMessage={t('mediation.support.noTickets') || 'No support tickets found'}
            searchable={false}
            rowActions={rowActions}
            compact={false}
            pagination={pagination.pages > 1 ? pagination : null}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            onRowClick={(row) => navigate(`/stockship/employee/offer-support-tickets/${row.id}`)}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmployeeOfferSupportTickets;
