import React, { useState, useEffect } from 'react';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Save, 
  Loader2,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  MapPin,
  Hash,
  FileText,
  AlertCircle,
  CreditCard,
  Banknote,
  Building
} from 'lucide-react';
import { traderApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const TraderUpdateRequest = () => {
  const { getAuth } = useMultiAuth();
  const { t, language, isRTL } = useLanguage();
  const { user } = getAuth('trader');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [traderDetails, setTraderDetails] = useState(null);
  const [updateRequests, setUpdateRequests] = useState([]);
  const [requestData, setRequestData] = useState({
    name: '',
    phone: '',
    country: '',
    city: '',
    companyName: '',
    companyAddress: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankName: '',
    bankAddress: '',
    bankCode: '',
    swiftCode: ''
  });

  useEffect(() => {
    if (user) {
      loadProfile();
      loadUpdateRequests();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await traderApi.getTraderById(user.id);
      const trader = response.data.data || response.data;
      setTraderDetails(trader);
      // Initialize request data with current values
      setRequestData({
        name: trader.name || '',
        phone: trader.phone || '',
        country: trader.country || '',
        city: trader.city || '',
        companyName: trader.companyName || '',
        companyAddress: trader.companyAddress || '',
        bankAccountName: trader.bankAccountName || '',
        bankAccountNumber: trader.bankAccountNumber || '',
        bankName: trader.bankName || '',
        bankAddress: trader.bankAddress || '',
        bankCode: trader.bankCode || '',
        swiftCode: trader.swiftCode || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      showToast.error(
        t('mediation.trader.loadProfileFailed') || 'Failed to load profile',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadUpdateRequests = async () => {
    try {
      const response = await traderApi.getUpdateRequests();
      setUpdateRequests(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error loading update requests:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRequestData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if there are any changes
    const hasChanges = Object.keys(requestData).some(key => {
      const currentValue = traderDetails?.[key] || '';
      return requestData[key] !== currentValue;
    });

    if (!hasChanges) {
      showToast.error(
        t('mediation.trader.updateRequest.noChanges') || 'No Changes',
        t('mediation.trader.updateRequest.noChangesDesc') || 'Please make some changes before submitting a request'
      );
      return;
    }

    // Check if there's a pending request
    const pendingRequest = updateRequests.find(req => req.status === 'PENDING');
    if (pendingRequest) {
      showToast.error(
        t('mediation.trader.updateRequest.pendingExists') || 'Pending Request Exists',
        t('mediation.trader.updateRequest.pendingExistsDesc') || 'You already have a pending request. Please wait for review or cancel it first.'
      );
      return;
    }

    try {
      setSaving(true);
      await traderApi.createUpdateRequest(requestData);
      showToast.success(
        t('mediation.trader.updateRequest.requestCreated') || 'Request Created',
        t('mediation.trader.updateRequest.requestCreatedSuccess') || 'Your update request has been submitted successfully. An employee will review it soon.'
      );
      await loadUpdateRequests();
      await loadProfile();
    } catch (error) {
      console.error('Error creating update request:', error);
      showToast.error(
        t('mediation.trader.updateRequest.createFailed') || 'Failed to create request',
        error.response?.data?.message || 'Please try again'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!confirm(t('mediation.trader.updateRequest.cancelConfirm') || 'Are you sure you want to cancel this request?')) {
      return;
    }

    try {
      await traderApi.cancelUpdateRequest(requestId);
      showToast.success(
        t('mediation.trader.updateRequest.requestCancelled') || 'Request Cancelled',
        t('mediation.trader.updateRequest.requestCancelledSuccess') || 'Your update request has been cancelled'
      );
      await loadUpdateRequests();
    } catch (error) {
      console.error('Error cancelling request:', error);
      showToast.error(
        t('mediation.trader.updateRequest.cancelFailed') || 'Failed to cancel request',
        error.response?.data?.message || 'Please try again'
      );
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('mediation.trader.updateRequest.status.pending') || 'Pending' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: t('mediation.trader.updateRequest.status.approved') || 'Approved' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: t('mediation.trader.updateRequest.status.rejected') || 'Rejected' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('mediation.trader.updateRequest.status.cancelled') || 'Cancelled' }
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('mediation.trader.loading') || 'Loading...'}</p>
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t('mediation.trader.updateRequest.title') || 'Request Profile Update'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('mediation.trader.updateRequest.subtitle') || 'Request changes to your profile information. An employee will review and approve your request.'}
        </p>
      </div>

      {/* Pending Request Alert */}
      {updateRequests.some(req => req.status === 'PENDING') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900 mb-1">
                {t('mediation.trader.updateRequest.pendingRequest') || 'You have a pending update request'}
              </p>
              <p className="text-xs text-yellow-700">
                {t('mediation.trader.updateRequest.pendingRequestDesc') || 'Please wait for an employee to review your request before submitting a new one.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Update Request Form */}
        <div className="lg:col-span-2">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                {t('mediation.trader.updateRequest.requestForm') || 'Update Request Form'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {t('mediation.trader.updateRequest.personalInfo') || 'Personal Information'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('mediation.common.name') || 'Name'}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          type="text"
                          name="name"
                          value={requestData.name}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder={t('mediation.trader.namePlaceholder') || 'Enter your name'}
                        />
                      </div>
                      {traderDetails && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t('mediation.trader.updateRequest.current') || 'Current'}: {traderDetails.name}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('mediation.common.phone') || 'Phone'}
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          type="tel"
                          name="phone"
                          value={requestData.phone}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder={t('mediation.common.phonePlaceholder') || 'Enter your phone number'}
                        />
                      </div>
                      {traderDetails && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t('mediation.trader.updateRequest.current') || 'Current'}: {traderDetails.phone || t('common.notAvailable') || 'N/A'}
                        </p>
                      )}
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('mediation.common.country') || 'Country'}
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          type="text"
                          name="country"
                          value={requestData.country}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder={t('mediation.common.countryPlaceholder') || 'Enter your country'}
                        />
                      </div>
                      {traderDetails && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t('mediation.trader.updateRequest.current') || 'Current'}: {traderDetails.country || t('common.notAvailable') || 'N/A'}
                        </p>
                      )}
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('mediation.common.city') || 'City'}
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          type="text"
                          name="city"
                          value={requestData.city}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder={t('mediation.common.cityPlaceholder') || 'Enter your city'}
                        />
                      </div>
                      {traderDetails && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t('mediation.trader.updateRequest.current') || 'Current'}: {traderDetails.city || t('common.notAvailable') || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {t('mediation.trader.updateRequest.companyInfo') || 'Company Information'}
                  </h3>
                  <div className="space-y-4">
                    {/* Company Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('mediation.traders.companyName') || 'Company Name'}
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          type="text"
                          name="companyName"
                          value={requestData.companyName}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder={t('mediation.trader.companyNamePlaceholder') || 'Enter your company name'}
                        />
                      </div>
                      {traderDetails && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t('mediation.trader.updateRequest.current') || 'Current'}: {traderDetails.companyName}
                        </p>
                      )}
                    </div>

                    {/* Company Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('mediation.trader.updateRequest.companyAddress') || 'Company Address'}
                      </label>
                      <Textarea
                        name="companyAddress"
                        value={requestData.companyAddress}
                        onChange={handleChange}
                        rows={3}
                        placeholder={t('mediation.trader.updateRequest.companyAddressPlaceholder') || 'Enter your company address'}
                      />
                      {traderDetails && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t('mediation.trader.updateRequest.current') || 'Current'}: {traderDetails.companyAddress || t('common.notAvailable') || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bank Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    {t('mediation.trader.updateRequest.bankInfo') || 'Bank Information'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bank Account Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('mediation.trader.updateRequest.bankAccountName') || 'Bank Account Name'}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          type="text"
                          name="bankAccountName"
                          value={requestData.bankAccountName}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder={t('mediation.trader.updateRequest.bankAccountNamePlaceholder') || 'Enter bank account name'}
                        />
                      </div>
                      {traderDetails && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t('mediation.trader.updateRequest.current') || 'Current'}: {traderDetails.bankAccountName || t('common.notAvailable') || 'N/A'}
                        </p>
                      )}
                    </div>

                    {/* Bank Account Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('mediation.trader.updateRequest.bankAccountNumber') || 'Bank Account Number'}
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          type="text"
                          name="bankAccountNumber"
                          value={requestData.bankAccountNumber}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder={t('mediation.trader.updateRequest.bankAccountNumberPlaceholder') || 'Enter bank account number'}
                        />
                      </div>
                      {traderDetails && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t('mediation.trader.updateRequest.current') || 'Current'}: {traderDetails.bankAccountNumber || t('common.notAvailable') || 'N/A'}
                        </p>
                      )}
                    </div>

                    {/* Bank Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('mediation.trader.updateRequest.bankName') || 'Bank Name'}
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          type="text"
                          name="bankName"
                          value={requestData.bankName}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder={t('mediation.trader.updateRequest.bankNamePlaceholder') || 'Enter bank name'}
                        />
                      </div>
                      {traderDetails && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t('mediation.trader.updateRequest.current') || 'Current'}: {traderDetails.bankName || t('common.notAvailable') || 'N/A'}
                        </p>
                      )}
                    </div>

                    {/* Bank Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('mediation.trader.updateRequest.bankCode') || 'Bank Code'}
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          type="text"
                          name="bankCode"
                          value={requestData.bankCode}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder={t('mediation.trader.updateRequest.bankCodePlaceholder') || 'Enter bank code'}
                        />
                      </div>
                      {traderDetails && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t('mediation.trader.updateRequest.current') || 'Current'}: {traderDetails.bankCode || t('common.notAvailable') || 'N/A'}
                        </p>
                      )}
                    </div>

                    {/* Swift Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('mediation.trader.updateRequest.swiftCode') || 'SWIFT Code'}
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          type="text"
                          name="swiftCode"
                          value={requestData.swiftCode}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder={t('mediation.trader.updateRequest.swiftCodePlaceholder') || 'Enter SWIFT code'}
                        />
                      </div>
                      {traderDetails && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t('mediation.trader.updateRequest.current') || 'Current'}: {traderDetails.swiftCode || t('common.notAvailable') || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bank Address */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('mediation.trader.updateRequest.bankAddress') || 'Bank Address'}
                    </label>
                    <Textarea
                      name="bankAddress"
                      value={requestData.bankAddress}
                      onChange={handleChange}
                      rows={3}
                      placeholder={t('mediation.trader.updateRequest.bankAddressPlaceholder') || 'Enter bank address'}
                    />
                    {traderDetails && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t('mediation.trader.updateRequest.current') || 'Current'}: {traderDetails.bankAddress || t('common.notAvailable') || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={saving || updateRequests.some(req => req.status === 'PENDING')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('mediation.trader.updateRequest.submitting') || 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {t('mediation.trader.updateRequest.submitRequest') || 'Submit Update Request'}
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Update Requests History */}
        <div>
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                {t('mediation.trader.updateRequest.requestHistory') || 'Request History'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {updateRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('mediation.trader.updateRequest.noRequests') || 'No update requests yet'}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {updateRequests.map((request) => (
                    <div key={request.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        {getStatusBadge(request.status)}
                        <span className="text-xs text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                        </span>
                      </div>
                      {request.reviewer && (
                        <p className="text-xs text-gray-600 mb-2">
                          {t('mediation.trader.updateRequest.reviewedBy') || 'Reviewed by'}: {request.reviewer.name}
                        </p>
                      )}
                      {request.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelRequest(request.id)}
                          className="mt-2 w-full"
                        >
                          {t('mediation.trader.updateRequest.cancel') || 'Cancel Request'}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default TraderUpdateRequest;


