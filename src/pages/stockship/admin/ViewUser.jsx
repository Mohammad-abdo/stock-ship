import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  CreditCard, 
  ShoppingCart,
  Building2,
  Hash,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  DollarSign,
  Package,
  Truck,
  Briefcase,
  Shield,
  Loader2,
  Globe,
  QrCode,
  Download,
  Eye
} from 'lucide-react';
import showToast from '@/lib/toast';

const ViewUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUser(id);
      setUser(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      showToast.error(
        t('admin.users.loadFailed') || 'Failed to load user', 
        error.response?.data?.message || t('common.notFound') || 'User not found'
      );
      navigate('/stockship/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, isActive, isVerified, isEmailVerified) => {
    if (status === 'SUSPENDED' || status === 'INACTIVE' || !isActive) {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          {t('common.inactive') || 'Inactive'}
        </span>
      );
    }
    if (status === 'PENDING') {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {t('common.pending') || 'Pending'}
        </span>
      );
    }
    if (isVerified !== undefined && !isVerified) {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {t('common.unverified') || 'Unverified'}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        {t('common.active') || 'Active'}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0.00';
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loading') || 'Loading user details...'}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Determine user type
  const userType = user.role || user.userType || 'USER';
  const isAdmin = userType === 'ADMIN' || userType === 'admin';
  const isEmployee = userType === 'EMPLOYEE' || userType === 'employee';
  const isTrader = userType === 'TRADER' || userType === 'trader';
  const isClient = userType === 'CLIENT' || userType === 'client';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/stockship/admin/users')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </motion.button>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('admin.users.userDetails') || 'User Details'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('admin.users.viewCompleteInfo') || 'View complete user information'}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {getStatusBadge(user.status, user.isActive, user.isVerified, user.isEmailVerified)}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/stockship/admin/users/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            {t('common.edit') || 'Edit'}
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <User className="w-5 h-5 text-blue-600" />
                {t('admin.users.basicInfo') || 'Basic Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Hash className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('common.id') || 'ID'}</p>
                    <p className="font-semibold text-gray-900 font-mono text-sm">{user.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('common.name') || 'Name'}</p>
                    <p className="font-semibold text-gray-900">{user.name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('common.email') || 'Email'}</p>
                    <p className="font-semibold text-gray-900">{user.email || 'N/A'}</p>
                  </div>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('common.phone') || 'Phone'}</p>
                      <p className="font-semibold text-gray-900">{user.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('admin.users.role') || 'Role'}</p>
                    <p className="font-semibold text-gray-900 capitalize">{userType}</p>
                  </div>
                </div>
                {(user.isEmailVerified !== undefined || user.emailVerified !== undefined) && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('admin.users.emailVerified') || 'Email Verified'}</p>
                      <p className="font-semibold text-gray-900">
                        {user.isEmailVerified || user.emailVerified ? t('common.yes') || 'Yes' : t('common.no') || 'No'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Employee Specific Information */}
          {isEmployee && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  {t('admin.users.employeeInfo') || 'Employee Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {user.employeeCode && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Hash className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('mediation.employees.employeeCode') || 'Employee Code'}</p>
                        <p className="font-semibold text-gray-900 font-mono">{user.employeeCode}</p>
                      </div>
                    </div>
                  )}
                  {user.commissionRate !== undefined && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('mediation.employees.commissionRate') || 'Commission Rate'}</p>
                        <p className="font-semibold text-gray-900">{Number(user.commissionRate || 0).toFixed(2)}%</p>
                      </div>
                    </div>
                  )}
                  {user.createdByAdmin && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('admin.users.createdBy') || 'Created By'}</p>
                        <p className="font-semibold text-gray-900">{user.createdByAdmin.name || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                  {user._count?.traders !== undefined && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('mediation.traders.traders') || 'Traders'}</p>
                        <p className="font-semibold text-gray-900">{user._count.traders || 0}</p>
                      </div>
                    </div>
                  )}
                  {user._count?.deals !== undefined && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('mediation.deals.deals') || 'Deals'}</p>
                        <p className="font-semibold text-gray-900">{user._count.deals || 0}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trader Specific Information */}
          {isTrader && (
            <>
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-amber-50 to-yellow-50">
                  <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Building2 className="w-5 h-5 text-amber-600" />
                    {t('admin.users.traderInfo') || 'Trader Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {user.traderCode && (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                          <Hash className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t('mediation.traders.traderCode') || 'Trader Code'}</p>
                          <p className="font-semibold text-gray-900 font-mono">{user.traderCode}</p>
                        </div>
                      </div>
                    )}
                    {user.companyName && (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t('mediation.traders.companyName') || 'Company Name'}</p>
                          <p className="font-semibold text-gray-900">{user.companyName}</p>
                        </div>
                      </div>
                    )}
                    {user.barcode && (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <QrCode className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t('mediation.traders.barcode') || 'Barcode'}</p>
                          <p className="font-semibold text-gray-900 font-mono">{user.barcode}</p>
                        </div>
                      </div>
                    )}
                    {user.isVerified !== undefined && (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t('mediation.traders.verified') || 'Verified'}</p>
                          <p className="font-semibold text-gray-900">
                            {user.isVerified ? t('common.yes') || 'Yes' : t('common.no') || 'No'}
                          </p>
                        </div>
                      </div>
                    )}
                    {user.employee && (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                          <User className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t('mediation.traders.employee') || 'Assigned Employee'}</p>
                          <p className="font-semibold text-gray-900">{user.employee.name} ({user.employee.employeeCode})</p>
                        </div>
                      </div>
                    )}
                    {user.verifiedAt && (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t('mediation.traders.verifiedAt') || 'Verified At'}</p>
                          <p className="font-semibold text-gray-900">{formatDate(user.verifiedAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Company Address */}
              {user.companyAddress && (
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                    <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <MapPin className="w-5 h-5 text-gray-600" />
                      {t('mediation.traders.companyAddress') || 'Company Address'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-gray-900">{user.companyAddress}</p>
                  </CardContent>
                </Card>
              )}

              {/* Bank Information */}
              {(user.bankAccountName || user.bankAccountNumber || user.bankName || user.swiftCode) && (
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <CreditCard className="w-5 h-5 text-green-600" />
                      {t('mediation.traders.bankInfo') || 'Bank Information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {user.bankAccountName && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">{t('mediation.traders.bankAccountName') || 'Account Name'}</p>
                          <p className="font-semibold text-gray-900">{user.bankAccountName}</p>
                        </div>
                      )}
                      {user.bankAccountNumber && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">{t('mediation.traders.bankAccountNumber') || 'Account Number'}</p>
                          <p className="font-semibold text-gray-900 font-mono">{user.bankAccountNumber}</p>
                        </div>
                      )}
                      {user.bankName && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">{t('mediation.traders.bankName') || 'Bank Name'}</p>
                          <p className="font-semibold text-gray-900">{user.bankName}</p>
                        </div>
                      )}
                      {user.bankCode && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">{t('mediation.traders.bankCode') || 'Bank Code'}</p>
                          <p className="font-semibold text-gray-900 font-mono">{user.bankCode}</p>
                        </div>
                      )}
                      {user.swiftCode && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">{t('mediation.traders.swiftCode') || 'SWIFT Code'}</p>
                          <p className="font-semibold text-gray-900 font-mono">{user.swiftCode}</p>
                        </div>
                      )}
                      {user.bankAddress && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 mb-1">{t('mediation.traders.bankAddress') || 'Bank Address'}</p>
                          <p className="font-semibold text-gray-900">{user.bankAddress}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Client Specific Information */}
          {isClient && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-blue-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <User className="w-5 h-5 text-cyan-600" />
                  {t('admin.users.clientInfo') || 'Client Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {user.language && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('common.language') || 'Language'}</p>
                        <p className="font-semibold text-gray-900 uppercase">{user.language}</p>
                      </div>
                    </div>
                  )}
                  {user.termsAccepted !== undefined && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('admin.users.termsAccepted') || 'Terms Accepted'}</p>
                        <p className="font-semibold text-gray-900">
                          {user.termsAccepted ? t('common.yes') || 'Yes' : t('common.no') || 'No'}
                        </p>
                      </div>
                    </div>
                  )}
                  {user.termsAcceptedAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('admin.users.termsAcceptedAt') || 'Terms Accepted At'}</p>
                        <p className="font-semibold text-gray-900">{formatDate(user.termsAcceptedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Information */}
          {(user.country || user.city || user.countryCode) && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-pink-50 to-rose-50">
                <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <MapPin className="w-5 h-5 text-pink-600" />
                  {t('admin.users.locationInfo') || 'Location Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {user.countryCode && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                        <Globe className="w-6 h-6 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('admin.users.countryCode') || 'Country Code'}</p>
                        <p className="font-semibold text-gray-900">{user.countryCode}</p>
                      </div>
                    </div>
                  )}
                  {user.country && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('common.country') || 'Country'}</p>
                        <p className="font-semibold text-gray-900">{user.country}</p>
                      </div>
                    </div>
                  )}
                  {user.city && (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('common.city') || 'City'}</p>
                        <p className="font-semibold text-gray-900">{user.city}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(user._count?.offers !== undefined || user._count?.deals !== undefined || user._count?.payments !== undefined) && (
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50">
                  <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Package className="w-5 h-5 text-teal-600" />
                    {t('admin.users.activity') || 'Activity Statistics'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {user._count?.offers !== undefined && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="text-sm text-gray-600">{t('mediation.offers.offers') || 'Offers'}</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{user._count.offers || 0}</span>
                      </div>
                    )}
                    {user._count?.deals !== undefined && (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-gray-600">{t('mediation.deals.deals') || 'Deals'}</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{user._count.deals || 0}</span>
                      </div>
                    )}
                    {user._count?.payments !== undefined && (
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-purple-600" />
                          <span className="text-sm text-gray-600">{t('mediation.payments.payments') || 'Payments'}</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{user._count.payments || 0}</span>
                      </div>
                    )}
                    {user._count?.traders !== undefined && (
                      <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-amber-600" />
                          <span className="text-sm text-gray-600">{t('mediation.traders.traders') || 'Traders'}</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{user._count.traders || 0}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Shield className="w-5 h-5 text-gray-600" />
                {t('admin.users.accountStatus') || 'Account Status'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('common.status') || 'Status'}</p>
                <div>{getStatusBadge(user.status, user.isActive, user.isVerified, user.isEmailVerified)}</div>
              </div>
              {user.isActive !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('common.active') || 'Active'}</p>
                  <p className="font-semibold text-gray-900">
                    {user.isActive ? t('common.yes') || 'Yes' : t('common.no') || 'No'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Calendar className="w-5 h-5 text-gray-600" />
                {t('admin.users.importantDates') || 'Important Dates'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('common.createdAt') || 'Created At'}</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(user.createdAt)}</p>
              </div>
              {user.updatedAt && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('common.updatedAt') || 'Last Updated'}</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(user.updatedAt)}</p>
                </div>
              )}
              {user.lastLoginAt && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('admin.users.lastLogin') || 'Last Login'}</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(user.lastLoginAt)}</p>
                </div>
              )}
              {user.verifiedAt && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('mediation.traders.verifiedAt') || 'Verified At'}</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(user.verifiedAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Eye className="w-5 h-5 text-gray-600" />
                {t('common.actions') || 'Quick Actions'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/stockship/admin/users/${id}/edit`)}
                className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                {t('common.edit') || 'Edit User'}
              </motion.button>
              {isTrader && user._count?.deals > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/stockship/admin/traders/${id}/deals`)}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {t('mediation.deals.viewDeals') || 'View Deals'}
                </motion.button>
              )}
              {isTrader && user._count?.offers > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/stockship/admin/traders/${id}/offers`)}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Package className="w-4 h-4" />
                  {t('mediation.offers.viewOffers') || 'View Offers'}
                </motion.button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default ViewUser;
