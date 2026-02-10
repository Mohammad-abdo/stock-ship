import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { ArrowLeft, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import showToast from '@/lib/toast';

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    countryCode: '+966',
    country: '',
    city: '',
    language: 'ar',
    isActive: true
  });

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUser(id);
      const user = response.data.data || response.data;
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        phone: user.phone || '',
        countryCode: user.countryCode || '+966',
        country: user.country || '',
        city: user.city || '',
        language: user.language || 'ar',
        isActive: user.isActive !== undefined ? user.isActive : true
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      showToast.error('Failed to load user', error.response?.data?.message || 'User not found');
      navigate('/stockship/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email) {
      showToast.error('Required fields missing', 'Please fill in Name and Email');
      return;
    }

    // If password is provided, validate it
    if (formData.password) {
      if (formData.password !== formData.confirmPassword) {
        showToast.error('Password mismatch', 'Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        showToast.error('Password too short', 'Password must be at least 6 characters');
        return;
      }
    }

    try {
      setSaving(true);
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        countryCode: formData.countryCode || null,
        country: formData.country || null,
        city: formData.city || null,
        language: formData.language || 'ar',
        isActive: formData.isActive
      };
      
      // Only include password if it was provided
      if (formData.password) {
        userData.password = formData.password;
      }
      
      await adminApi.updateUser(id, userData);
      showToast.success('User updated successfully', 'The user has been updated');
      navigate('/stockship/admin/users');
    } catch (error) {
      console.error('Error updating user:', error);
      showToast.error(
        'Failed to update user',
        error.response?.data?.message || 'Please check your input and try again'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => navigate('/stockship/admin/users')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Edit User</h1>
          <p className="text-muted-foreground mt-2">Update user information</p>
        </div>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  placeholder="Enter user name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  placeholder="user@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  New Password <span className="text-gray-500 text-xs">(Leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  minLength={6}
                  placeholder="Leave blank to keep current password"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  minLength={6}
                  placeholder="Confirm new password"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Country Code */}
              <div>
                <label className="block text-sm font-medium mb-2">Country Code</label>
                <input
                  type="text"
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+966"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium mb-2">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter country"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter city"
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ar">Arabic</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active User
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/stockship/admin/users')}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update User
                  </>
                )}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditUser;

