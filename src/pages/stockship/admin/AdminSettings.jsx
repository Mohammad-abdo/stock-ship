import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import {
  Settings,
  Globe,
  Shield,
  Bell,
  Mail,
  CreditCard,
  Database,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import showToast from '@/lib/toast';
import { adminApi } from '@/lib/stockshipApi';

const AdminSettings = () => {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'Stockship',
    platformDescription: '',
    platformEmail: '',
    platformPhone: '',
    platformAddress: '',
    defaultLanguage: 'ar',
    timezone: 'Asia/Riyadh',
    currency: 'SAR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h'
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireTwoFactor: false,
    enableAuditLog: true,
    enableIPWhitelist: false
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notifyOnNewOrder: true,
    notifyOnNewDeal: true,
    notifyOnNewOffer: true,
    notifyOnPayment: true,
    notifyOnSupportTicket: true
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: true,
    fromEmail: '',
    fromName: 'Stockship'
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    enablePayments: true,
    defaultPaymentMethod: 'credit_card',
    taxRate: 15,
    platformCommissionRate: 2.5, // Percentage based commission
    shippingCommissionRate: 5.0, // Shipping commission rate (default 5%)
    cbmRate: null, // CBM-based commission rate (SAR per cubic meter)
    commissionMethod: 'PERCENTAGE', // PERCENTAGE, CBM, BOTH
    enableAutoSettlement: false,
    settlementPeriod: 7
  });

  // Password Change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Fetch platform settings from backend
      const response = await adminApi.getPlatformSettings();
      const settings = response.data.data || response.data;
      
      if (settings) {
        // Update general settings
        if (settings.platformName) setGeneralSettings(prev => ({ ...prev, platformName: settings.platformName }));
        if (settings.platformEmail) setGeneralSettings(prev => ({ ...prev, platformEmail: settings.platformEmail }));
        if (settings.platformPhone) setGeneralSettings(prev => ({ ...prev, platformPhone: settings.platformPhone }));
        if (settings.platformAddress) setGeneralSettings(prev => ({ ...prev, platformAddress: settings.platformAddress }));
        if (settings.defaultLanguage) setGeneralSettings(prev => ({ ...prev, defaultLanguage: settings.defaultLanguage }));
        if (settings.timezone) setGeneralSettings(prev => ({ ...prev, timezone: settings.timezone }));
        if (settings.currency) setGeneralSettings(prev => ({ ...prev, currency: settings.currency }));
        
        // Update payment settings
        if (settings.taxRate !== undefined) setPaymentSettings(prev => ({ ...prev, taxRate: parseFloat(settings.taxRate) || 0 }));
        if (settings.platformCommissionRate !== undefined) setPaymentSettings(prev => ({ ...prev, platformCommissionRate: parseFloat(settings.platformCommissionRate) || 2.5 }));
        if (settings.shippingCommissionRate !== undefined) setPaymentSettings(prev => ({ ...prev, shippingCommissionRate: parseFloat(settings.shippingCommissionRate) || 5.0 }));
        if (settings.cbmRate !== undefined && settings.cbmRate !== null) setPaymentSettings(prev => ({ ...prev, cbmRate: parseFloat(settings.cbmRate) }));
        if (settings.commissionMethod) setPaymentSettings(prev => ({ ...prev, commissionMethod: settings.commissionMethod }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showToast.error(
        t('admin.settings.loadFailed') || 'Failed to load settings',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section) => {
    try {
      setSaving(true);
      
      if (section === 'general') {
        // Save general settings
        await adminApi.updatePlatformSettings({
          platformName: generalSettings.platformName,
          platformEmail: generalSettings.platformEmail,
          platformPhone: generalSettings.platformPhone,
          platformAddress: generalSettings.platformAddress,
          defaultLanguage: generalSettings.defaultLanguage,
          timezone: generalSettings.timezone,
          currency: generalSettings.currency
        });
      } else if (section === 'payment') {
        // Save payment settings (including CBM Rate and Shipping Commission)
        await adminApi.updatePlatformSettings({
          taxRate: paymentSettings.taxRate,
          platformCommissionRate: paymentSettings.platformCommissionRate,
          shippingCommissionRate: paymentSettings.shippingCommissionRate,
          cbmRate: paymentSettings.cbmRate || null,
          commissionMethod: paymentSettings.commissionMethod
        });
      }
      
      showToast.success(
        t('admin.settings.saveSuccess') || 'Settings saved successfully',
        t('admin.settings.saveSuccessDesc') || 'Your changes have been saved'
      );
      
      // Reload settings to get updated values
      if (section === 'payment' || section === 'general') {
        await fetchSettings();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast.error(
        t('admin.settings.saveFailed') || 'Failed to save settings',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast.error(
        t('admin.settings.passwordMismatch') || 'Passwords do not match',
        t('admin.settings.passwordMismatchDesc') || 'Please make sure both passwords are the same'
      );
      return;
    }

    if (passwordData.newPassword.length < securitySettings.passwordMinLength) {
      showToast.error(
        t('admin.settings.passwordTooShort') || 'Password too short',
        t('admin.settings.passwordMinLengthDesc') || `Password must be at least ${securitySettings.passwordMinLength} characters`
      );
      return;
    }

    try {
      setSaving(true);
      // TODO: Replace with actual API call when backend is ready
      // await adminApi.changePassword({
      //   currentPassword: passwordData.currentPassword,
      //   newPassword: passwordData.newPassword
      // });
      
      showToast.success(
        t('admin.settings.passwordChanged') || 'Password changed successfully',
        t('admin.settings.passwordChangedDesc') || 'Your password has been updated'
      );
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      showToast.error(
        t('admin.settings.passwordChangeFailed') || 'Failed to change password',
        error.response?.data?.message || 'Please check your current password and try again'
      );
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: t('admin.settings.general') || 'General', icon: Globe },
    { id: 'security', label: t('admin.settings.security') || 'Security', icon: Shield },
    { id: 'notifications', label: t('admin.settings.notifications') || 'Notifications', icon: Bell },
    { id: 'email', label: t('admin.settings.email') || 'Email', icon: Mail },
    { id: 'payment', label: t('admin.settings.payment') || 'Payment', icon: CreditCard },
    { id: 'password', label: t('admin.settings.password') || 'Password', icon: Lock }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="w-8 h-8" />
            {t('admin.settings.title') || 'Platform Settings'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('admin.settings.subtitle') || 'Manage and configure platform settings'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className={`flex space-x-1 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${isRTL ? 'flex-row-reverse' : ''} flex items-center gap-2`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t('admin.settings.generalSettings') || 'General Settings'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>{t('admin.settings.platformName') || 'Platform Name'}</Label>
                <Input
                  value={generalSettings.platformName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, platformName: e.target.value })}
                  placeholder={t('admin.settings.platformNamePlaceholder') || 'Enter platform name'}
                />
              </div>
              <div>
                <Label>{t('admin.settings.platformEmail') || 'Platform Email'}</Label>
                <Input
                  type="email"
                  value={generalSettings.platformEmail}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, platformEmail: e.target.value })}
                  placeholder={t('admin.settings.platformEmailPlaceholder') || 'admin@example.com'}
                />
              </div>
              <div>
                <Label>{t('admin.settings.platformPhone') || 'Platform Phone'}</Label>
                <Input
                  value={generalSettings.platformPhone}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, platformPhone: e.target.value })}
                  placeholder={t('admin.settings.platformPhonePlaceholder') || '+966 50 123 4567'}
                />
              </div>
              <div>
                <Label>{t('admin.settings.defaultLanguage') || 'Default Language'}</Label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={generalSettings.defaultLanguage}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, defaultLanguage: e.target.value })}
                >
                  <option value="ar">{t('common.ar') || 'العربية'}</option>
                  <option value="en">{t('common.en') || 'English'}</option>
                </select>
              </div>
              <div>
                <Label>{t('admin.settings.timezone') || 'Timezone'}</Label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={generalSettings.timezone}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                >
                  <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                  <option value="UTC">UTC (GMT+0)</option>
                  <option value="America/New_York">America/New_York (GMT-5)</option>
                </select>
              </div>
              <div>
                <Label>{t('admin.settings.currency') || 'Currency'}</Label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={generalSettings.currency}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                >
                  <option value="SAR">SAR - Saudi Riyal</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
            </div>
            <div>
              <Label>{t('admin.settings.platformDescription') || 'Platform Description'}</Label>
              <Textarea
                value={generalSettings.platformDescription}
                onChange={(e) => setGeneralSettings({ ...generalSettings, platformDescription: e.target.value })}
                placeholder={t('admin.settings.platformDescriptionPlaceholder') || 'Enter platform description'}
                rows={4}
              />
            </div>
            <div>
              <Label>{t('admin.settings.platformAddress') || 'Platform Address'}</Label>
              <Textarea
                value={generalSettings.platformAddress}
                onChange={(e) => setGeneralSettings({ ...generalSettings, platformAddress: e.target.value })}
                placeholder={t('admin.settings.platformAddressPlaceholder') || 'Enter platform address'}
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleSave('general')} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.saving') || 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('common.save') || 'Save Changes'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t('admin.settings.securitySettings') || 'Security Settings'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>{t('admin.settings.sessionTimeout') || 'Session Timeout (minutes)'}</Label>
                <Input
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                  min={5}
                  max={1440}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.settings.sessionTimeoutDesc') || 'User session will expire after this time'}
                </p>
              </div>
              <div>
                <Label>{t('admin.settings.maxLoginAttempts') || 'Max Login Attempts'}</Label>
                <Input
                  type="number"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                  min={3}
                  max={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.settings.maxLoginAttemptsDesc') || 'Account will be locked after this many failed attempts'}
                </p>
              </div>
              <div>
                <Label>{t('admin.settings.passwordMinLength') || 'Password Minimum Length'}</Label>
                <Input
                  type="number"
                  value={securitySettings.passwordMinLength}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) })}
                  min={6}
                  max={32}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-semibold">{t('admin.settings.requireTwoFactor') || 'Require Two-Factor Authentication'}</Label>
                  <p className="text-sm text-gray-500">
                    {t('admin.settings.requireTwoFactorDesc') || 'Users must enable 2FA to access their accounts'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings.requireTwoFactor}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, requireTwoFactor: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-semibold">{t('admin.settings.enableAuditLog') || 'Enable Audit Log'}</Label>
                  <p className="text-sm text-gray-500">
                    {t('admin.settings.enableAuditLogDesc') || 'Track all user activities and system changes'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings.enableAuditLog}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, enableAuditLog: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-semibold">{t('admin.settings.enableIPWhitelist') || 'Enable IP Whitelist'}</Label>
                  <p className="text-sm text-gray-500">
                    {t('admin.settings.enableIPWhitelistDesc') || 'Only allow access from specific IP addresses'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings.enableIPWhitelist}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, enableIPWhitelist: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleSave('security')} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.saving') || 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('common.save') || 'Save Changes'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t('admin.settings.notificationSettings') || 'Notification Settings'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-semibold">{t('admin.settings.emailNotifications') || 'Email Notifications'}</Label>
                  <p className="text-sm text-gray-500">
                    {t('admin.settings.emailNotificationsDesc') || 'Send notifications via email'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.emailNotifications}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-semibold">{t('admin.settings.smsNotifications') || 'SMS Notifications'}</Label>
                  <p className="text-sm text-gray-500">
                    {t('admin.settings.smsNotificationsDesc') || 'Send notifications via SMS'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.smsNotifications}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-semibold">{t('admin.settings.pushNotifications') || 'Push Notifications'}</Label>
                  <p className="text-sm text-gray-500">
                    {t('admin.settings.pushNotificationsDesc') || 'Send browser push notifications'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.pushNotifications}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>
            </div>
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">{t('admin.settings.notificationEvents') || 'Notification Events'}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>{t('admin.settings.notifyOnNewOrder') || 'New Order'}</Label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.notifyOnNewOrder}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnNewOrder: e.target.checked })}
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>{t('admin.settings.notifyOnNewDeal') || 'New Deal'}</Label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.notifyOnNewDeal}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnNewDeal: e.target.checked })}
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>{t('admin.settings.notifyOnNewOffer') || 'New Offer'}</Label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.notifyOnNewOffer}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnNewOffer: e.target.checked })}
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>{t('admin.settings.notifyOnPayment') || 'Payment Received'}</Label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.notifyOnPayment}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnPayment: e.target.checked })}
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>{t('admin.settings.notifyOnSupportTicket') || 'New Support Ticket'}</Label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.notifyOnSupportTicket}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnSupportTicket: e.target.checked })}
                    className="w-5 h-5"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleSave('notifications')} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.saving') || 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('common.save') || 'Save Changes'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Settings */}
      {activeTab === 'email' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {t('admin.settings.emailSettings') || 'Email Settings'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>{t('admin.settings.smtpHost') || 'SMTP Host'}</Label>
                <Input
                  value={emailSettings.smtpHost}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                  placeholder="smtp.example.com"
                />
              </div>
              <div>
                <Label>{t('admin.settings.smtpPort') || 'SMTP Port'}</Label>
                <Input
                  type="number"
                  value={emailSettings.smtpPort}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) })}
                  placeholder="587"
                />
              </div>
              <div>
                <Label>{t('admin.settings.smtpUser') || 'SMTP Username'}</Label>
                <Input
                  value={emailSettings.smtpUser}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label>{t('admin.settings.smtpPassword') || 'SMTP Password'}</Label>
                <Input
                  type="password"
                  value={emailSettings.smtpPassword}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <Label>{t('admin.settings.fromEmail') || 'From Email'}</Label>
                <Input
                  type="email"
                  value={emailSettings.fromEmail}
                  onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                  placeholder="noreply@example.com"
                />
              </div>
              <div>
                <Label>{t('admin.settings.fromName') || 'From Name'}</Label>
                <Input
                  value={emailSettings.fromName}
                  onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                  placeholder="Stockship"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-semibold">{t('admin.settings.smtpSecure') || 'Use Secure Connection (TLS)'}</Label>
                <p className="text-sm text-gray-500">
                  {t('admin.settings.smtpSecureDesc') || 'Enable TLS/SSL for secure email transmission'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailSettings.smtpSecure}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpSecure: e.target.checked })}
                className="w-5 h-5"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleSave('email')} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.saving') || 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('common.save') || 'Save Changes'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Settings */}
      {activeTab === 'payment' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {t('admin.settings.paymentSettings') || 'Payment Settings'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-semibold">{t('admin.settings.enablePayments') || 'Enable Payments'}</Label>
                <p className="text-sm text-gray-500">
                  {t('admin.settings.enablePaymentsDesc') || 'Allow users to make payments on the platform'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={paymentSettings.enablePayments}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, enablePayments: e.target.checked })}
                className="w-5 h-5"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>{t('admin.settings.defaultPaymentMethod') || 'Default Payment Method'}</Label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={paymentSettings.defaultPaymentMethod}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, defaultPaymentMethod: e.target.value })}
                >
                  <option value="credit_card">{t('admin.settings.creditCard') || 'Credit Card'}</option>
                  <option value="bank_transfer">{t('admin.settings.bankTransfer') || 'Bank Transfer'}</option>
                  <option value="wallet">{t('admin.settings.wallet') || 'Wallet'}</option>
                </select>
              </div>
              <div>
                <Label>{t('admin.settings.taxRate') || 'Tax Rate (%)'}</Label>
                <Input
                  type="number"
                  value={paymentSettings.taxRate}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, taxRate: parseFloat(e.target.value) })}
                  min={0}
                  max={100}
                  step={0.1}
                />
              </div>
              <div>
                <Label>{t('admin.settings.platformCommissionRate') || 'Platform Commission Rate (%)'}</Label>
                <Input
                  type="number"
                  value={paymentSettings.platformCommissionRate}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, platformCommissionRate: parseFloat(e.target.value) })}
                  min={0}
                  max={100}
                  step={0.1}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.settings.platformCommissionRateDesc') || 'Percentage commission based on deal amount'}
                </p>
              </div>
              <div>
                <Label>{t('admin.settings.shippingCommissionRate') || 'Shipping Commission Rate (%)'}</Label>
                <Input
                  type="number"
                  value={paymentSettings.shippingCommissionRate}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, shippingCommissionRate: parseFloat(e.target.value) })}
                  min={0}
                  max={100}
                  step={0.1}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.settings.shippingCommissionRateDesc') || 'Shipping commission rate (paid by buyer, default 5%)'}
                </p>
              </div>
              <div>
                <Label>{t('admin.settings.cbmRate') || 'CBM Rate (per cubic meter)'}</Label>
                <Input
                  type="number"
                  value={paymentSettings.cbmRate || ''}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, cbmRate: e.target.value ? parseFloat(e.target.value) : null })}
                  min={0}
                  step={0.01}
                  placeholder={t('admin.settings.cbmRatePlaceholder') || 'e.g., 50 (SAR per CBM)'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.settings.cbmRateDesc') || 'Commission rate based on total cubic meters (CBM) in deal'}
                </p>
              </div>
              <div>
                <Label>{t('admin.settings.commissionMethod') || 'Commission Calculation Method'}</Label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={paymentSettings.commissionMethod}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, commissionMethod: e.target.value })}
                >
                  <option value="PERCENTAGE">{t('admin.settings.commissionMethodPercentage') || 'Percentage (based on amount)'}</option>
                  <option value="CBM">{t('admin.settings.commissionMethodCBM') || 'CBM (based on cubic meters)'}</option>
                  <option value="BOTH">{t('admin.settings.commissionMethodBoth') || 'Both (take the higher value)'}</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.settings.commissionMethodDesc') || 'Select how platform commission is calculated'}
                </p>
              </div>
              <div>
                <Label>{t('admin.settings.settlementPeriod') || 'Settlement Period (days)'}</Label>
                <Input
                  type="number"
                  value={paymentSettings.settlementPeriod}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, settlementPeriod: parseInt(e.target.value) })}
                  min={1}
                  max={30}
                />
              </div>
            </div>
            {paymentSettings.commissionMethod === 'CBM' && !paymentSettings.cbmRate && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {t('admin.settings.cbmRateRequired') || 'CBM Rate Required'}
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {t('admin.settings.cbmRateRequiredDesc') || 'Please set a CBM Rate when using CBM-based commission method.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {paymentSettings.commissionMethod === 'BOTH' && !paymentSettings.cbmRate && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {t('admin.settings.cbmRateRequired') || 'CBM Rate Required'}
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {t('admin.settings.cbmRateRequiredForBoth') || 'Please set a CBM Rate when using BOTH commission method.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-semibold">{t('admin.settings.enableAutoSettlement') || 'Enable Auto Settlement'}</Label>
                <p className="text-sm text-gray-500">
                  {t('admin.settings.enableAutoSettlementDesc') || 'Automatically settle payments after the settlement period'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={paymentSettings.enableAutoSettlement}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, enableAutoSettlement: e.target.checked })}
                className="w-5 h-5"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleSave('payment')} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.saving') || 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('common.save') || 'Save Changes'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Password Change */}
      {activeTab === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {t('admin.settings.changePassword') || 'Change Password'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">
                    {t('admin.settings.passwordSecurity') || 'Password Security'}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {t('admin.settings.passwordSecurityDesc') || `Your password must be at least ${securitySettings.passwordMinLength} characters long and contain a mix of letters, numbers, and special characters.`}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label>{t('admin.settings.currentPassword') || 'Current Password'}</Label>
                <div className="relative">
                  <Input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder={t('admin.settings.currentPasswordPlaceholder') || 'Enter your current password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>{t('admin.settings.newPassword') || 'New Password'}</Label>
                <div className="relative">
                  <Input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder={t('admin.settings.newPasswordPlaceholder') || 'Enter your new password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>{t('admin.settings.confirmPassword') || 'Confirm New Password'}</Label>
                <div className="relative">
                  <Input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder={t('admin.settings.confirmPasswordPlaceholder') || 'Confirm your new password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handlePasswordChange} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.saving') || 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('admin.settings.updatePassword') || 'Update Password'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default AdminSettings;
