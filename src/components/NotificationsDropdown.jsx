import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import stockshipApi from '@/lib/stockshipApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function NotificationsDropdown() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const lastFetchRef = useRef(0);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const now = Date.now();
    // Only fetch if last fetch was more than 2 seconds ago
    if (now - lastFetchRef.current > 2000) {
      fetchNotifications();
      fetchUnreadCount();
      lastFetchRef.current = now;
    }

    // Poll for new notifications every 60 seconds (reduced frequency)
    const interval = setInterval(() => {
      const now = Date.now();
      // Throttle: only fetch if last fetch was more than 2 seconds ago
      if (now - lastFetchRef.current > 2000 && !isFetchingRef.current) {
        fetchUnreadCount();
        if (isOpen) {
          fetchNotifications();
        }
        lastFetchRef.current = now;
      }
    }, 60000); // Increased from 30s to 60s

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      const response = await stockshipApi.get('/notifications', { 
        params: { page: 1, limit: 10 } 
      });
      
      // Handle different response structures
      let notificationsList = [];
      if (response.data) {
        if (response.data.success && response.data.data) {
          // If paginated response
          if (response.data.data.data && Array.isArray(response.data.data.data)) {
            notificationsList = response.data.data.data;
          } else if (Array.isArray(response.data.data)) {
            notificationsList = response.data.data;
          }
        } else if (Array.isArray(response.data)) {
          notificationsList = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          notificationsList = response.data.data;
        }
      }
      
      // Map notification fields to match expected structure
      const activeRole = (localStorage.getItem('active_role') || '').toLowerCase();
      notificationsList = notificationsList.map(notif => {
        let action_url = null;
        if (notif.relatedEntityType && notif.relatedEntityId) {
          const type = (notif.type || '').toLowerCase();
          if (type === 'price_quote' && notif.relatedEntityType === 'DEAL') {
            action_url = `/stockship/client/deals/${notif.relatedEntityId}/quote`;
          } else if (activeRole === 'client' && notif.relatedEntityType === 'DEAL') {
            action_url = `/stockship/client/deals/${notif.relatedEntityId}`;
          } else if (activeRole === 'employee' && notif.relatedEntityType === 'DEAL') {
            action_url = `/stockship/employee/deals/${notif.relatedEntityId}`;
          } else if (activeRole === 'trader' && notif.relatedEntityType === 'DEAL') {
            action_url = `/stockship/trader/deals/${notif.relatedEntityId}`;
          } else {
            action_url = `/${notif.relatedEntityType.toLowerCase()}s/${notif.relatedEntityId}`;
          }
        }
        return {
          id: notif.id,
          title: notif.title,
          description: notif.message || notif.description,
          type: notif.type?.toLowerCase() || 'default',
          is_read: notif.isRead !== undefined ? notif.isRead : notif.is_read,
          created_at: notif.createdAt || notif.created_at,
          action_url
        };
      });
      
      setNotifications(notificationsList);
      lastFetchRef.current = Date.now();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't show error for rate limiting - just silently fail
      if (error.response?.status !== 429) {
        console.error('Error details:', error);
      }
      // Keep existing notifications on error (don't clear them)
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const fetchUnreadCount = async () => {
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      const response = await stockshipApi.get('/notifications/unread-count');
      
      // Handle different response structures
      let count = 0;
      if (response.data) {
        if (response.data.success && response.data.data) {
          count = response.data.data.count || 0;
        } else if (response.data.data && response.data.data.count !== undefined) {
          count = response.data.data.count;
        } else if (response.data.count !== undefined) {
          count = response.data.count;
        }
      }
      
      setUnreadCount(count);
      lastFetchRef.current = Date.now();
    } catch (error) {
      // Don't show error for rate limiting - just silently fail
      if (error.response?.status !== 429) {
        console.error('Error fetching unread count:', error);
      }
      // Don't reset count on error - keep last known value
    } finally {
      isFetchingRef.current = false;
    }
  };

  const handleMarkAsRead = async (notificationId, e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    try {
      await stockshipApi.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    try {
      await stockshipApi.put('/notifications/read-all');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.action_url) {
      navigate(notification.action_url);
      setIsOpen(false);
    }
    if (!notification.is_read) {
      handleMarkAsRead(notification.id, { stopPropagation: () => {} });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return '📦';
      case 'prescription':
        return '💊';
      case 'booking':
        return '📅';
      case 'message':
        return '💬';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications();
          }
        }}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/20"
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} top-full mt-2 w-80 md:w-96 bg-card border rounded-lg shadow-xl z-50 max-h-[500px] flex flex-col backdrop-blur-sm`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">
                  {t('common.notifications') || (language === 'ar' ? 'الإشعارات' : 'Notifications')}
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{t('common.noNotifications') || (language === 'ar' ? 'لا توجد إشعارات' : 'No notifications')}</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    <AnimatePresence>
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
                            !notification.is_read ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-2xl flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`font-medium text-sm ${!notification.is_read ? 'font-bold' : ''}`}>
                                  {notification.title}
                                </p>
                                {!notification.is_read && (
                                  <button
                                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                                    className="flex-shrink-0 p-1 hover:bg-accent rounded"
                                  >
                                    <Check className="w-3 h-3 text-muted-foreground" />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {notification.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.created_at
                                  ? format(new Date(notification.created_at), 'PPp')
                                  : ''}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      navigate('/admin/notifications');
                      setIsOpen(false);
                    }}
                  >
                    {t('common.viewAllNotifications') || (language === 'ar' ? 'عرض جميع الإشعارات' : 'View All Notifications')}
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}



