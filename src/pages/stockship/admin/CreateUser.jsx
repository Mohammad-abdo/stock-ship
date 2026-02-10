import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { ArrowLeft, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import showToast from '@/lib/toast';

const CreateUser = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      showToast.error('Required fields missing', 'Please fill in Name, Email, and Password');
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
      // Only send fields that backend accepts: email, password, name, phone, country, city
      const userData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone || null,
        country: formData.country || null,
        city: formData.city || null
      };
      await adminApi.createUser(userData);
      showToast.success('User created successfully', 'The user has been created');
      navigate('/stockship/admin/users');
    } catch (error) {
      console.error('Error creating user:', error);
      showToast.error(
        'Failed to create user',
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
          onClick={() => navigate('/stockship/admin/users')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Create New User</h1>
          <p className="text-muted-foreground mt-2">Add a new user to the platform</p>
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
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={6}
                  placeholder="Confirm password"
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create User
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

export default CreateUser;

