import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import StandardDataTable from '@/components/StandardDataTable';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Eye, 
  MessageSquare, 
  Send, 
  X,
  Filter,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { adminApi } from '@/lib/stockshipApi';
import showToast from '@/lib/toast';

const AdminSupportTickets = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchTickets();
  }, [pagination.page, statusFilter, priorityFilter, searchTerm]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await adminApi.getSupportTickets(params);
      const data = response.data.data || response.data;
      setTickets(Array.isArray(data) ? data : (data?.tickets || []));
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      showToast.error(
        t('mediation.support.loadFailed') || 'Failed to load tickets',
        error.response?.data?.message || 'Please try again'
      );
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (id) => {
    try {
      const response = await adminApi.getSupportTicket(id);
      setSelectedTicket(response.data.data || response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      showToast.error(
        t('mediation.support.loadDetailsFailed') || 'Failed to load ticket details',
        error.response?.data?.message || 'Please try again'
      );
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await adminApi.updateSupportTicketStatus(id, { status });
      showToast.success(
        t('mediation.support.statusUpdated') || 'Status updated',
        t('mediation.support.statusUpdateSuccess') || 'Ticket status has been updated'
      );
      fetchTickets();
      if (selectedTicket && selectedTicket.id === id) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      showToast.error(
        t('mediation.support.updateFailed') || 'Failed to update status',
        error.response?.data?.message || 'Please try again'
      );
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    try {
      setSendingMessage(true);
      await adminApi.addSupportTicketMessage(selectedTicket.id, newMessage);
      setNewMessage('');
      showToast.success(
        t('mediation.support.messageSent') || 'Message sent',
        t('mediation.support.messageSentSuccess') || 'Your message has been sent'
      );
      await fetchTicketDetails(selectedTicket.id);
    } catch (error) {
      console.error('Error sending message:', error);
      showToast.error(
        t('mediation.support.sendFailed') || 'Failed to send message',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      OPEN: { bg: 'bg-blue-100', text: 'text-blue-800', label: t('mediation.support.open') || 'Open' },
      IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('mediation.support.inProgress') || 'In Progress' },
      RESOLVED: { bg: 'bg-green-100', text: 'text-green-800', label: t('mediation.support.resolved') || 'Resolved' },
      CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.support.closed') || 'Closed' }
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status || 'Unknown' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      LOW: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.support.priority.low') || 'Low' },
      MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('mediation.support.priority.medium') || 'Medium' },
      HIGH: { bg: 'bg-orange-100', text: 'text-orange-800', label: t('mediation.support.priority.high') || 'High' },
      URGENT: { bg: 'bg-red-100', text: 'text-red-800', label: t('mediation.support.priority.urgent') || 'Urgent' }
    };
    const config = priorityConfig[priority] || { bg: 'bg-gray-100', text: 'text-gray-800', label: priority || 'Unknown' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
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

  // Table columns
  const columns = [
    {
      key: 'id',
      label: t('mediation.common.id') || 'ID',
      render: (value) => <span className="font-mono text-sm">#{value}</span>
    },
    {
      key: 'user',
      label: t('mediation.support.user') || 'User',
      render: (value, row) => (
        <div>
          <div className="font-medium text-sm text-gray-900">{row.client?.name || row.user?.name || 'N/A'}</div>
          <div className="text-xs text-gray-500">{row.client?.email || row.user?.email || ''}</div>
        </div>
      )
    },
    {
      key: 'subject',
      label: t('mediation.support.subject') || 'Subject',
      render: (value) => (
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-900 line-clamp-1">{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'priority',
      label: t('mediation.support.priorityLabel') || 'Priority',
      render: (value) => getPriorityBadge(value)
    },
    {
      key: 'status',
      label: t('mediation.common.status') || 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'messages',
      label: t('mediation.support.messages') || 'Messages',
      align: 'right',
      render: (value, row) => (
        <span className="text-sm text-gray-600">
          {row._count?.messages || row.messages?.length || 0}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: t('mediation.support.createdAt') || 'Created',
      render: (value) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(value)}</span>
        </div>
      )
    }
  ];

  const rowActions = (row) => (
    <div className="flex items-center gap-1 justify-end">
      <button
        onClick={(e) => {
          e.stopPropagation();
          fetchTicketDetails(row.id);
        }}
        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
        title={t('mediation.support.viewDetails') || 'View Details'}
      >
        <Eye className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.support.loading') || 'Loading tickets...'}</p>
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
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('mediation.support.title') || 'Support Tickets'}</h1>
          <p className="text-muted-foreground mt-2">{t('mediation.support.subtitle') || 'Manage all support tickets'}</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('mediation.support.searchPlaceholder') || 'Search tickets...'}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white appearance-none min-w-[160px]"
              >
                <option value="">{t('mediation.support.allStatus') || 'All Status'}</option>
                <option value="OPEN">{t('mediation.support.open') || 'Open'}</option>
                <option value="IN_PROGRESS">{t('mediation.support.inProgress') || 'In Progress'}</option>
                <option value="RESOLVED">{t('mediation.support.resolved') || 'Resolved'}</option>
                <option value="CLOSED">{t('mediation.support.closed') || 'Closed'}</option>
              </select>
            </div>
            <div className="relative">
              <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white appearance-none min-w-[160px]"
              >
                <option value="">{t('mediation.support.allPriorities') || 'All Priorities'}</option>
                <option value="LOW">{t('mediation.support.low') || 'Low'}</option>
                <option value="MEDIUM">{t('mediation.support.medium') || 'Medium'}</option>
                <option value="HIGH">{t('mediation.support.high') || 'High'}</option>
                <option value="URGENT">{t('mediation.support.urgent') || 'Urgent'}</option>
              </select>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setPriorityFilter('');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              {t('mediation.support.clearFilters') || 'Clear Filters'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {t('mediation.support.ticketsList') || 'Support Tickets'} ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <StandardDataTable
            columns={columns}
            data={tickets}
            loading={loading}
            emptyMessage={t('mediation.support.noTickets') || 'No tickets found'}
            searchable={false}
            rowActions={rowActions}
            compact={false}
            pagination={{
              page: pagination.page,
              pages: pagination.pages,
              total: pagination.total,
              limit: pagination.limit
            }}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          />
        </CardContent>
      </Card>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !sendingMessage && setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {t('mediation.support.ticketDetails') || 'Ticket Details'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('mediation.common.id')} #{selectedTicket.id}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={sendingMessage}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Ticket Info */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-gray-200">
                    <CardContent className="pt-4">
                      <div className="text-sm text-gray-500 mb-1">{t('mediation.common.status')}</div>
                      <div>{getStatusBadge(selectedTicket.status)}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200">
                    <CardContent className="pt-4">
                      <div className="text-sm text-gray-500 mb-1">{t('mediation.support.priorityLabel')}</div>
                      <div>{getPriorityBadge(selectedTicket.priority)}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200">
                    <CardContent className="pt-4">
                      <div className="text-sm text-gray-500 mb-1">{t('mediation.support.createdAt')}</div>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(selectedTicket.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200">
                    <CardContent className="pt-4">
                      <div className="text-sm text-gray-500 mb-1">{t('mediation.support.messages')}</div>
                      <div className="text-sm font-medium">
                        {selectedTicket._count?.messages || selectedTicket.messages?.length || 0}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* User Info */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {t('mediation.support.userInfo') || 'User Information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">{t('mediation.common.name')}</div>
                        <div className="font-medium">{selectedTicket.client?.name || selectedTicket.user?.name || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">{t('mediation.common.email')}</div>
                        <div className="font-medium">{selectedTicket.client?.email || selectedTicket.user?.email || 'N/A'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Subject */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      {t('mediation.support.subject')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-900">{selectedTicket.subject || 'N/A'}</p>
                  </CardContent>
                </Card>

                {/* Messages */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      {t('mediation.support.messages')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                        selectedTicket.messages.map((message, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-4 rounded-lg ${
                              message.isAdmin 
                                ? 'bg-blue-50 border border-blue-100' 
                                : 'bg-gray-50 border border-gray-100'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded ${
                                  message.isAdmin ? 'bg-blue-100' : 'bg-gray-200'
                                }`}>
                                  {message.isAdmin ? (
                                    <User className="w-3 h-3 text-blue-600" />
                                  ) : (
                                    <User className="w-3 h-3 text-gray-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-sm">
                                    {message.isAdmin 
                                      ? (t('mediation.support.admin') || 'Admin')
                                      : (message.user?.name || selectedTicket.client?.name || t('mediation.support.user') || 'User')
                                    }
                                  </div>
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(message.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-900 whitespace-pre-wrap">{message.message || message.content}</div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>{t('mediation.support.noMessages') || 'No messages yet'}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Reply */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-base">{t('mediation.support.reply') || 'Reply'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t('mediation.support.messagePlaceholder') || 'Type your message...'}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                        rows="4"
                        disabled={sendingMessage}
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {sendingMessage ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t('mediation.support.sending') || 'Sending...'}
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            {t('mediation.support.send') || 'Send'}
                          </>
                        )}
                      </motion.button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusUpdate(selectedTicket.id, e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
                  disabled={sendingMessage}
                >
                  <option value="OPEN">{t('mediation.support.open') || 'Open'}</option>
                  <option value="IN_PROGRESS">{t('mediation.support.inProgress') || 'In Progress'}</option>
                  <option value="RESOLVED">{t('mediation.support.resolved') || 'Resolved'}</option>
                  <option value="CLOSED">{t('mediation.support.closed') || 'Closed'}</option>
                </select>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  disabled={sendingMessage}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {t('common.cancel') || 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminSupportTickets;
