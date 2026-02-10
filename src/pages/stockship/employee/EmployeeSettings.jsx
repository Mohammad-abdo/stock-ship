import React, { useState, useEffect } from 'react';
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
  XCircle
} from 'lucide-react';
import { employeeApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';

const EmployeeSettings = () => {
  const { getAuth } = useMultiAuth();
  const { t, language } = useLanguage();
  const { user } = getAuth('employee');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
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

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getEmployeeById(user.id);
      const employee = response.data.data || response.data;
      setProfileData({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      showToast.error(
        t('mediation.employee.loadProfileFailed') || 'Failed to load profile',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (!profileData.name) {
      showToast.error(
        t('mediation.employee.validationError') || 'Validation Error',
        t('mediation.employee.requiredFields') || 'Please fill in all required fields'
      );
      return;
    }

    try {
      setSaving(true);
      // Use auth updateProfile endpoint which supports employees
      const { authApi } = await import('@/lib/stockshipApi');
      await authApi.updateProfile({
        name: profileData.name,
        phone: profileData.phone
      });
      showToast.success(
        t('mediation.employee.profileUpdated') || 'Profile Updated',
        t('mediation.employee.profileUpdatedSuccess') || 'Your profile has been updated successfully'
      );
      // Update user in context
      loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast.error(
        t('mediation.employee.updateFailed') || 'Failed to update profile',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showToast.error(
        t('mediation.employee.validationError') || 'Validation Error',
        t('mediation.employee.allPasswordFieldsRequired') || 'Please fill in all password fields'
      );
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast.error(
        t('mediation.employee.passwordMismatch') || 'Password Mismatch',
        t('mediation.employee.passwordMismatchDesc') || 'New password and confirm password do not match'
      );
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast.error(
        t('mediation.employee.passwordTooShort') || 'Password Too Short',
        t('mediation.employee.passwordTooShortDesc') || 'Password must be at least 6 characters'
      );
      return;
    }

    try {
      setSaving(true);
      // Use auth changePassword endpoint if available
      const { stockshipApi } = await import('@/lib/stockshipApi');
      try {
        await stockshipApi.put('/auth/change-password', {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        });
      } catch (err) {
        // If change-password endpoint doesn't exist, try using updateProfile with password
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
        t('mediation.employee.passwordChanged') || 'Password Changed',
        t('mediation.employee.passwordChangedSuccess') || 'Your password has been changed successfully'
      );
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      showToast.error(
        t('mediation.employee.changePasswordFailed') || 'Failed to change password',
        error.response?.data?.message || 'Please check your current password and try again'
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
          <p className="text-muted-foreground">{t('mediation.employee.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: t('mediation.employee.profile') || 'Profile', icon: User },
    { id: 'password', label: t('mediation.employee.password') || 'Password', icon: Lock }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t('common.settings') || 'Settings'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('mediation.employee.settingsDesc') || 'Manage your account settings and preferences'}
        </p>
      </div>

      {/* Tabs */}
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

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              {t('mediation.employee.profileInformation') || 'Profile Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Employee Code (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.employees.employeeCode') || 'Employee Code'}
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={user?.employeeCode || 'N/A'}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('mediation.employee.employeeCodeDesc') || 'Employee code cannot be changed'}
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.common.name') || 'Name'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.employee.namePlaceholder') || 'Enter your name'}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.common.email') || 'Email'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.common.emailPlaceholder') || 'Enter your email'}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.common.phone') || 'Phone'}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                    placeholder={t('mediation.common.phonePlaceholder') || 'Enter your phone number'}
                  />
                </div>
              </div>

              {/* Created At (Read-only) */}
              {user?.createdAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('mediation.common.createdAt') || 'Member Since'}
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

              {/* Save Button */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('mediation.employee.saving') || 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t('common.save') || 'Save Changes'}
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-600" />
              {t('mediation.employee.changePassword') || 'Change Password'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.employee.currentPassword') || 'Current Password'} <span className="text-red-500">*</span>
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
                    placeholder={t('mediation.employee.currentPasswordPlaceholder') || 'Enter your current password'}
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.employee.newPassword') || 'New Password'} <span className="text-red-500">*</span>
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
                    placeholder={t('mediation.employee.newPasswordPlaceholder') || 'Enter your new password (min 6 characters)'}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('mediation.employee.passwordMinLength') || 'Password must be at least 6 characters'}
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mediation.employee.confirmPassword') || 'Confirm New Password'} <span className="text-red-500">*</span>
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
                    placeholder={t('mediation.employee.confirmPasswordPlaceholder') || 'Confirm your new password'}
                  />
                </div>
                {passwordData.newPassword && passwordData.confirmPassword && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${
                    passwordData.newPassword === passwordData.confirmPassword ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {passwordData.newPassword === passwordData.confirmPassword ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        {t('mediation.employee.passwordsMatch') || 'Passwords match'}
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        {t('mediation.employee.passwordsDoNotMatch') || 'Passwords do not match'}
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* Save Button */}
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
                      {t('mediation.employee.changing') || 'Changing...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t('mediation.employee.changePassword') || 'Change Password'}
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

