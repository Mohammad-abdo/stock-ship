import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { ArrowLeft, Save, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import showToast from '@/lib/toast';

const CreateVendor = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    businessName: '',
    phone: '',
    countryCode: '+966',
    country: '',
    city: '',
    businessLicense: '',
    taxId: '',
    website: '',
    description: '',
    paymentTerms: '',
    shippingTerms: '',
    leadTime: '',
    language: 'ar',
    isActive: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password || !formData.companyName || !formData.phone) {
      showToast.error('Required fields missing', 'Please fill in Email, Password, Company Name, and Phone');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast.error('Password mismatch', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      showToast.error('Password too short', 'Password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      const vendorData = {
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        businessName: formData.businessName || null,
        phone: formData.phone,
        countryCode: formData.countryCode || null,
        country: formData.country || null,
        city: formData.city || null,
        businessLicense: formData.businessLicense || null,
        taxId: formData.taxId || null,
        website: formData.website || null,
        description: formData.description || null,
        paymentTerms: formData.paymentTerms || null,
        shippingTerms: formData.shippingTerms || null,
        leadTime: formData.leadTime || null,
        language: formData.language || 'ar',
        isActive: formData.isActive
      };
      await adminApi.createVendor(vendorData);
      showToast.success('Vendor created successfully', 'The vendor has been created');
      navigate('/stockship/admin/vendors');
    } catch (error) {
      console.error('Error creating vendor:', error);
      showToast.error(
        'Failed to create vendor',
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
          onClick={() => navigate('/stockship/admin/vendors')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Create Vendor</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Vendor Information
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
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="vendor@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Company Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Business Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.countryCode}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        className="w-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="+966"
                      />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Phone Number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Password (min 6 characters)"
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Confirm Password"
                    />
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Location Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="City"
                    />
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Business Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Business License</label>
                    <input
                      type="text"
                      value={formData.businessLicense}
                      onChange={(e) => setFormData({ ...formData, businessLicense: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Business License Number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Tax ID</label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Tax ID"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={4}
                      placeholder="Company description"
                    />
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Terms & Conditions</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Terms</label>
                    <textarea
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                      placeholder="Payment terms"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Shipping Terms</label>
                    <textarea
                      value={formData.shippingTerms}
                      onChange={(e) => setFormData({ ...formData, shippingTerms: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                      placeholder="Shipping terms"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Lead Time</label>
                    <input
                      type="text"
                      value={formData.leadTime}
                      onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g., 7-14 days"
                    />
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Language</label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="ar">Arabic</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium">
                      Active
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/stockship/admin/vendors')}
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
                  {saving ? 'Creating...' : 'Create Vendor'}
                </motion.button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CreateVendor;

