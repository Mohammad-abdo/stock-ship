import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMultiAuth } from '@/contexts/MultiAuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  User, 
  Building2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  AlertCircle,
  Hash,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { employeeApi } from '@/lib/mediationApi';
import showToast from '@/lib/toast';

const ViewTraderUpdateRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { getAuth } = useMultiAuth();
  const { user } = getAuth('employee');

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'

  useEffect(() => {
    if (user?.id && id) {
      fetchUpdateRequest();
    }
  }, [user?.id, id]);

  const fetchUpdateRequest = async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getTraderUpdateRequestById(id);
      setRequest(response.data?.data || response.data);
    } catch (error) {
      console.error('Error fetching update request:', error);
      showToast.error(t('mediation.trader.updateRequest.loadFailed') || 'Failed to load update request');
      navigate('/stockship/employee/trader-update-requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    setActionType('approve');
    setShowConfirmModal(true);
  };

  const handleReject = () => {
    if (!reviewNotes.trim()) {
      showToast.error(t('mediation.trader.updateRequest.reviewNotesRequired') || 'Please provide rejection reason');
      return;
    }
    setActionType('reject');
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    if (!request) return;

    try {
      setProcessing(true);
      
      if (actionType === 'approve') {
        await employeeApi.approveTraderUpdateRequest(request.id, {
          reviewNotes: reviewNotes.trim() || undefined
        });
        showToast.success(t('mediation.trader.updateRequest.approved') || 'Update request approved successfully');
      } else {
        await employeeApi.rejectTraderUpdateRequest(request.id, {
          reviewNotes: reviewNotes.trim()
        });
        showToast.success(t('mediation.trader.updateRequest.rejected') || 'Update request rejected');
      }
      
      setShowConfirmModal(false);
      navigate('/stockship/employee/trader-update-requests');
    } catch (error) {
      console.error(`Error ${actionType}ing request:`, error);
      showToast.error(
        error.response?.data?.message || 
        (actionType === 'approve' 
          ? t('mediation.trader.updateRequest.approveFailed') 
          : t('mediation.trader.updateRequest.rejectFailed')) || 
        `Failed to ${actionType} request`
      );
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: t('mediation.trader.updateRequest.status.pending') || 'Pending' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: t('mediation.trader.updateRequest.status.approved') || 'Approved' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: t('mediation.trader.updateRequest.status.rejected') || 'Rejected' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle, label: t('mediation.trader.updateRequest.status.cancelled') || 'Cancelled' },
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle, label: status };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const renderFieldComparison = (fieldKey, fieldLabel, currentValue, newValue, icon) => {
    const Icon = icon;
    const hasChange = currentValue !== newValue;
    
    return (
      <div className={`p-4 rounded-lg border-2 ${hasChange ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
        <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Icon className={`w-5 h-5 ${hasChange ? 'text-blue-600' : 'text-gray-500'}`} />
          <Label className={`text-sm font-semibold ${hasChange ? 'text-blue-900' : 'text-gray-700'}`}>
            {fieldLabel}
          </Label>
          {hasChange && (
            <span className="ml-auto px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {t('common.changed') || 'Changed'}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">{t('mediation.trader.updateRequest.currentValue') || 'Current Value'}</p>
            <div className="p-3 bg-white rounded border border-gray-200">
              <p className="text-sm text-gray-700">{currentValue || <span className="text-gray-400 italic">{t('common.notAvailable') || 'Not available'}</span>}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">{t('mediation.trader.updateRequest.newValue') || 'New Value'}</p>
            <div className={`p-3 rounded border-2 ${hasChange ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}`}>
              <p className={`text-sm ${hasChange ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                {newValue || <span className="text-gray-400 italic">{t('common.notAvailable') || 'Not available'}</span>}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return null;
  }

  const requestedData = request.requestedData || {};
  const trader = request.trader || {};

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
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/stockship/employee/trader-update-requests')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('mediation.trader.updateRequest.requestDetails') || 'Update Request Details'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('mediation.trader.updateRequest.requestId') || 'Request ID'}: {request.id.substring(0, 8)}...
            </p>
          </div>
        </div>
        {getStatusBadge(request.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trader Information */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <User className="w-5 h-5 text-blue-600" />
                {t('mediation.trader.updateRequest.traderInfo') || 'Trader Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('mediation.common.name') || 'Name'}</p>
                    <p className="font-semibold text-gray-900">{trader.name || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('mediation.traders.companyName') || 'Company Name'}</p>
                    <p className="font-semibold text-gray-900">{trader.companyName || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('common.email') || 'Email'}</p>
                    <p className="font-semibold text-gray-900">{trader.email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('mediation.common.phone') || 'Phone'}</p>
                    <p className="font-semibold text-gray-900">{trader.phone || '-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requested Changes */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Edit2 className="w-5 h-5 text-amber-600" />
                {t('mediation.trader.updateRequest.requestedChanges') || 'Requested Changes'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {Object.keys(requestedData).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('mediation.trader.updateRequest.noChanges') || 'No changes requested'}</p>
                </div>
              ) : (
                <>
                  {requestedData.name !== undefined && renderFieldComparison(
                    'name',
                    t('mediation.common.name') || 'Name',
                    trader.name,
                    requestedData.name,
                    User
                  )}
                  {requestedData.companyName !== undefined && renderFieldComparison(
                    'companyName',
                    t('mediation.traders.companyName') || 'Company Name',
                    trader.companyName,
                    requestedData.companyName,
                    Building2
                  )}
                  {requestedData.phone !== undefined && renderFieldComparison(
                    'phone',
                    t('mediation.common.phone') || 'Phone',
                    trader.phone,
                    requestedData.phone,
                    Phone
                  )}
                  {requestedData.country !== undefined && renderFieldComparison(
                    'country',
                    t('mediation.common.country') || 'Country',
                    trader.country,
                    requestedData.country,
                    MapPin
                  )}
                  {requestedData.city !== undefined && renderFieldComparison(
                    'city',
                    t('mediation.common.city') || 'City',
                    trader.city,
                    requestedData.city,
                    MapPin
                  )}
                  {requestedData.companyAddress !== undefined && renderFieldComparison(
                    'companyAddress',
                    t('mediation.traders.companyAddress') || 'Company Address',
                    trader.companyAddress,
                    requestedData.companyAddress,
                    MapPin
                  )}
                  {requestedData.bankAccountName !== undefined && renderFieldComparison(
                    'bankAccountName',
                    t('mediation.traders.bankAccountName') || 'Bank Account Name',
                    trader.bankAccountName,
                    requestedData.bankAccountName,
                    CreditCard
                  )}
                  {requestedData.bankAccountNumber !== undefined && renderFieldComparison(
                    'bankAccountNumber',
                    t('mediation.traders.bankAccountNumber') || 'Bank Account Number',
                    trader.bankAccountNumber,
                    requestedData.bankAccountNumber,
                    Hash
                  )}
                  {requestedData.bankName !== undefined && renderFieldComparison(
                    'bankName',
                    t('mediation.traders.bankName') || 'Bank Name',
                    trader.bankName,
                    requestedData.bankName,
                    Building2
                  )}
                  {requestedData.bankAddress !== undefined && renderFieldComparison(
                    'bankAddress',
                    t('mediation.traders.bankAddress') || 'Bank Address',
                    trader.bankAddress,
                    requestedData.bankAddress,
                    MapPin
                  )}
                  {requestedData.bankCode !== undefined && renderFieldComparison(
                    'bankCode',
                    t('mediation.traders.bankCode') || 'Bank Code',
                    trader.bankCode,
                    requestedData.bankCode,
                    Hash
                  )}
                  {requestedData.swiftCode !== undefined && renderFieldComparison(
                    'swiftCode',
                    t('mediation.traders.swiftCode') || 'SWIFT Code',
                    trader.swiftCode,
                    requestedData.swiftCode,
                    Hash
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Reason */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
              <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <FileText className="w-5 h-5 text-indigo-600" />
                {t('mediation.trader.updateRequest.reason') || 'Reason for Update'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.reason || '-'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Request Info */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <CardTitle className="text-sm font-semibold">
                {t('mediation.trader.updateRequest.requestInfo') || 'Request Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('common.submittedAt') || 'Submitted At'}</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(request.createdAt).toLocaleString()}
                </p>
              </div>
              {request.reviewer && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('mediation.trader.updateRequest.reviewedBy') || 'Reviewed By'}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {request.reviewer.name} ({request.reviewer.employeeCode})
                  </p>
                </div>
              )}
              {request.reviewedAt && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">{t('mediation.trader.updateRequest.reviewedAt') || 'Reviewed At'}</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(request.reviewedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Notes (if reviewed) */}
          {request.reviewNotes && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle className="text-sm font-semibold">
                  {t('mediation.trader.updateRequest.reviewNotes') || 'Review Notes'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.reviewNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions (if pending) */}
          {request.status === 'PENDING' && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-sm font-semibold">
                  {t('common.actions') || 'Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    {t('mediation.trader.updateRequest.reviewNotes') || 'Review Notes'}
                    {actionType === 'reject' && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={t('mediation.trader.updateRequest.reviewNotesPlaceholder') || 'Add your review notes...'}
                    rows={4}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleApprove}
                    disabled={processing}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {processing && actionType === 'approve' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {t('mediation.trader.updateRequest.approve') || 'Approve'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={processing || !reviewNotes.trim()}
                    className="w-full"
                  >
                    {processing && actionType === 'reject' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {t('mediation.trader.updateRequest.reject') || 'Reject'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {actionType === 'approve' ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
              <h3 className="text-lg font-semibold text-gray-900">
                {actionType === 'approve' 
                  ? t('mediation.trader.updateRequest.confirmApprove') || 'Confirm Approval'
                  : t('mediation.trader.updateRequest.confirmReject') || 'Confirm Rejection'}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {actionType === 'approve'
                ? t('mediation.trader.updateRequest.confirmApproveMessage') || 'Are you sure you want to approve this update request? The trader\'s profile will be updated with the requested changes.'
                : t('mediation.trader.updateRequest.confirmRejectMessage') || 'Are you sure you want to reject this update request? This action cannot be undone.'}
            </p>
            <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmModal(false);
                  setActionType(null);
                }}
                disabled={processing}
                className="flex-1"
              >
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button
                onClick={confirmAction}
                disabled={processing}
                className={`flex-1 ${actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  actionType === 'approve' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )
                )}
                {actionType === 'approve' 
                  ? t('mediation.trader.updateRequest.approve') || 'Approve'
                  : t('mediation.trader.updateRequest.reject') || 'Reject'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ViewTraderUpdateRequest;


