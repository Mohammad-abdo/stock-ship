import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { ArrowLeft, Save, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import showToast from '@/lib/toast';

const CreateCoupon = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    couponType: 'PERCENTAGE',
    discountValue: '',
    minPurchaseAmount: '',
    maxDiscountAmount: '',
    applicableTo: 'ALL',
    userEligibility: 'ALL',
    usageLimit: '',
    usageLimitPerUser: '',
    validFrom: '',
    validUntil: '',
    status: 'ACTIVE',
    isVisible: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.code || !formData.couponType || !formData.discountValue || !formData.validFrom || !formData.validUntil) {
      showToast.error('Required fields missing', 'Please fill in Code, Type, Discount Value, Valid From, and Valid Until');
      return;
    }

    if (new Date(formData.validFrom) >= new Date(formData.validUntil)) {
      showToast.error('Invalid dates', 'Valid Until must be after Valid From');
      return;
    }

    try {
      setSaving(true);
      const couponData = {
        code: formData.code.toUpperCase(),
        couponType: formData.couponType,
        discountValue: parseFloat(formData.discountValue),
        minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : null,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        applicableTo: formData.applicableTo || 'ALL',
        userEligibility: formData.userEligibility || 'ALL',
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        usageLimitPerUser: formData.usageLimitPerUser ? parseInt(formData.usageLimitPerUser) : null,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
        status: formData.status || 'ACTIVE',
        isVisible: formData.isVisible !== undefined ? formData.isVisible : true
      };
      await adminApi.createCoupon(couponData);
      showToast.success('Coupon created successfully', 'The coupon has been created');
      navigate('/stockship/admin/coupons');
    } catch (error) {
      console.error('Error creating coupon:', error);
      showToast.error(
        'Failed to create coupon',
        error.response?.data?.message || 'Please check your input and try again'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => navigate('/stockship/admin/coupons')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Create New Coupon</h1>
          <p className="text-muted-foreground mt-2">Add a new coupon to the platform</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Coupon Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Coupon Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="COUPON123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Coupon Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.couponType}
                      onChange={(e) => setFormData({ ...formData, couponType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="FIXED">Fixed Amount</option>
                      <option value="FREE_SHIPPING">Free Shipping</option>
                      <option value="BUY_X_GET_Y">Buy X Get Y</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Discount Value <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder={formData.couponType === 'PERCENTAGE' ? '10 (for 10%)' : '50.00'}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.couponType === 'PERCENTAGE' ? 'Enter percentage (e.g., 10 for 10%)' : 'Enter amount in currency'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Minimum Purchase Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.minPurchaseAmount}
                      onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="100.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Maximum Discount Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="50.00"
                    />
                  </div>
                </div>
              </div>

              {/* Applicability */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Applicability</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Applicable To</label>
                    <select
                      value={formData.applicableTo}
                      onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="ALL">All Products</option>
                      <option value="PRODUCTS">Specific Products</option>
                      <option value="CATEGORIES">Specific Categories</option>
                      <option value="VENDORS">Specific Vendors</option>
                      <option value="USERS">Specific Users</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">User Eligibility</label>
                    <select
                      value={formData.userEligibility}
                      onChange={(e) => setFormData({ ...formData, userEligibility: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="ALL">All Users</option>
                      <option value="NEW_USERS">New Users Only</option>
                      <option value="EXISTING_USERS">Existing Users Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Usage Limits */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Usage Limits</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Total Usage Limit</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="100"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Leave empty for unlimited</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Usage Limit Per User</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.usageLimitPerUser}
                      onChange={(e) => setFormData({ ...formData, usageLimitPerUser: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Leave empty for unlimited</p>
                  </div>
                </div>
              </div>

              {/* Validity Period */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Validity Period</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Valid From <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Valid Until <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="isVisible"
                      checked={formData.isVisible}
                      onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="isVisible" className="text-sm font-medium">
                      Visible to Users
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/stockship/admin/coupons')}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Creating...' : 'Create Coupon'}
                </motion.button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CreateCoupon;

