import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Loader2,
  Briefcase,
  Calendar,
  CheckCircle,
  XCircle,
  Send,
  Trash2,
  Info
} from 'lucide-react';
import { employeeApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';

function parseRequestedData(val) {
  if (!val) return {};
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  }
  return typeof val === 'object' && !Array.isArray(val) ? val : {};
}

const EmployeeSettings = () => {
  const { getAuth } = useMultiAuth();
  const { t, language } = useLanguage();
  const tk = useCallback((k) => t(`mediation.employee.ownProfileRequest.${k}`), [t]);
  const { user } = getAuth('employee');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [employeeRecord, setEmployeeRecord] = useState(null);
  const [openRequest, setOpenRequest] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const loadAll = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      localStorage.setItem('active_role', 'employee');
      const [empRes, listRes] = await Promise.all([
        employeeApi.getEmployeeById(user.id),
        employeeApi.listEmployeeProfileRequests()
      ]);
      const employee = empRes.data.data || empRes.data;
      setEmployeeRecord(employee);

      const list = listRes.data.data || listRes.data || [];
      const open = Array.isArray(list)
        ? list.find((r) => r.status === 'DRAFT' || r.status === 'PENDING_APPROVAL')
        : null;
      setOpenRequest(open || null);

      const rd = open ? parseRequestedData(open.requestedData) : {};
      setProfileData({
        name:
          rd.name !== undefined && (open?.status === 'DRAFT' || open?.status === 'PENDING_APPROVAL')
            ? rd.name
            : employee.name || '',
        email: employee.email || '',
        phone:
          rd.phone !== undefined && (open?.status === 'DRAFT' || open?.status === 'PENDING_APPROVAL')
            ? rd.phone ?? ''
            : employee.phone || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      showToast.error(
        t('mediation.employee.loadProfileFailed'),
        error.response?.data?.message || t('common.tryAgain')
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    if (user) loadAll();
  }, [user, loadAll]);

  const tabs = useMemo(
    () => [
      { id: 'profile', label: t('mediation.employee.profile'), icon: User },
      { id: 'password', label: t('mediation.employee.password'), icon: Lock }
    ],
    [t]
  );

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const buildPayload = () => {
    const payload = {};
    if (profileData.name !== undefined) payload.name = profileData.name;
    if (profileData.phone !== undefined) payload.phone = profileData.phone || null;
    return payload;
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!profileData.name?.trim()) {
      showToast.error(t('mediation.employee.validationError'), tk('nameRequired'));
      return;
    }

    try {
      setSaving(true);
      localStorage.setItem('active_role', 'employee');
      const payload = buildPayload();
      if (Object.keys(payload).length === 0) {
        showToast.error(tk('validationTitle'), tk('validationNothingToSave'));
        return;
      }

      if (openRequest?.status === 'DRAFT') {
        await employeeApi.updateEmployeeProfileRequestDraft(openRequest.id, payload);
        showToast.success(tk('draftUpdatedTitle'), tk('draftUpdatedDesc'));
      } else if (!openRequest) {
        await employeeApi.createEmployeeProfileRequest(payload);
        showToast.success(tk('draftCreatedTitle'), tk('draftCreatedDesc'));
      } else {
        showToast.error(tk('notAllowedTitle'), tk('notAllowedPending'));
        return;
      }
      await loadAll();
    } catch (error) {
      console.error(error);
      showToast.error(
        t('mediation.employee.updateFailed'),
        error.response?.data?.message || t('common.tryAgain')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!openRequest || openRequest.status !== 'DRAFT') return;
    try {
      setSaving(true);
      localStorage.setItem('active_role', 'employee');
      await employeeApi.submitEmployeeProfileRequest(openRequest.id);
      showToast.success(tk('submittedTitle'), tk('submittedDesc'));
      await loadAll();
    } catch (error) {
      showToast.error(tk('submitFailedTitle'), error.response?.data?.message || tk('tryAgainShort'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelDraft = async () => {
    if (!openRequest || openRequest.status !== 'DRAFT') return;
    if (!window.confirm(tk('cancelConfirm'))) return;
    try {
      setSaving(true);
      localStorage.setItem('active_role', 'employee');
      await employeeApi.cancelEmployeeProfileRequestDraft(openRequest.id);
      showToast.success(tk('cancelledTitle'), tk('cancelledDesc'));
      await loadAll();
    } catch (error) {
      showToast.error(tk('cancelFailedTitle'), error.response?.data?.message || tk('tryAgainShort'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showToast.error(
        t('mediation.employee.validationError'),
        t('mediation.employee.allPasswordFieldsRequired')
      );
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast.error(
        t('mediation.employee.passwordMismatch'),
        t('mediation.employee.passwordMismatchDesc')
      );
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast.error(
        t('mediation.employee.passwordTooShort'),
        t('mediation.employee.passwordTooShortDesc')
      );
      return;
    }

    try {
      setSaving(true);
      const { stockshipApi } = await import('@/lib/stockshipApi');
      try {
        await stockshipApi.put('/auth/change-password', {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        });
      } catch (err) {
        if (err.response?.status === 404) {
          await stockshipApi.put('/auth/profile', {
            currentPassword: passwordData.currentPassword,
            password: passwordData.newPassword
          });
        } else {
          throw err;
        }
      }
      showToast.success(
        t('mediation.employee.passwordChanged'),
        t('mediation.employee.passwordChangedSuccess')
      );
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      showToast.error(
        t('mediation.employee.changePasswordFailed'),
        error.response?.data?.message || t('mediation.employee.changePasswordFailedDesc')
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.employee.loading')}</p>
        </div>
      </div>
    );
  }

  const pendingApproval = openRequest?.status === 'PENDING_APPROVAL';
  const hasDraft = openRequest?.status === 'DRAFT';
  const canEditProposed = !openRequest || hasDraft;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('common.settings')}</h1>
        <p className="text-muted-foreground mt-2">{t('mediation.employee.settingsDesc')}</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === 'profile' && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              {t('mediation.employee.profileInformation')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex gap-2 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{tk('profileApprovalNotice')}</p>
                <p className="text-blue-800/90 mt-1">{tk('profileApprovalNotice2')}</p>
              </div>
            </div>

            {employeeRecord && (
              <div className="mb-6 text-sm text-gray-600 border rounded-lg p-4 bg-gray-50">
                <p className="font-medium text-gray-800 mb-2">{tk('currentOnFile')}</p>
                <p>
                  <span className="text-gray-500">{t('mediation.common.name')}:</span> {employeeRecord.name}
                </p>
                <p>
                  <span className="text-gray-500">{t('mediation.common.phone')}:</span>{' '}
                  {employeeRecord.phone || t('common.notAvailable')}
                </p>
              </div>
            )}

            {pendingApproval && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                <p className="font-medium flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {tk('profilePendingTitle')}
                </p>
                <p className="mt-2">
                  {t('mediation.common.name')}: <strong>{String(profileData.name)}</strong>
                </p>
                <p>
                  {t('mediation.common.phone')}:{' '}
                  <strong>{profileData.phone || t('common.notAvailable')}</strong>
                </p>
              </div>
            )}

            <form onSubmit={handleSaveDraft} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.employees.employeeCode')}
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={user?.employeeCode || t('common.notAvailable')}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.common.name')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                    disabled={!canEditProposed || pendingApproval}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder={t('mediation.employee.namePlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.common.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={profileData.email}
                    readOnly
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('mediation.employee.emailCannotChange')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.common.phone')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    disabled={!canEditProposed || pendingApproval}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder={t('mediation.common.phonePlaceholder')}
                  />
                </div>
              </div>

              {user?.createdAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tk('memberSince')}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={new Date(user.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-4 pt-4 border-t border-gray-200">
                {hasDraft && (
                  <button
                    type="button"
                    onClick={handleCancelDraft}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {tk('cancelDraft')}
                  </button>
                )}
                {hasDraft && (
                  <button
                    type="button"
                    onClick={handleSubmitRequest}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {tk('submitForApproval')}
                  </button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={saving || pendingApproval}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('mediation.employee.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {hasDraft ? tk('saveDraft') : tk('createDraft')}
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'password' && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-600" />
              {t('mediation.employee.changePassword')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.employee.currentPassword')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.employee.currentPasswordPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.employee.newPassword')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.employee.newPasswordPlaceholder')}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('mediation.employee.passwordMinLength')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.employee.confirmPassword')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.employee.confirmPasswordPlaceholder')}
                  />
                </div>
                {passwordData.newPassword && passwordData.confirmPassword && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${
                    passwordData.newPassword === passwordData.confirmPassword ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {passwordData.newPassword === passwordData.confirmPassword ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        {t('mediation.employee.passwordsMatch')}
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        {t('mediation.employee.passwordsDoNotMatch')}
                      </>
                    )}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={saving || passwordData.newPassword !== passwordData.confirmPassword}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('mediation.employee.changing')}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t('mediation.employee.changePassword')}
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default EmployeeSettings;
