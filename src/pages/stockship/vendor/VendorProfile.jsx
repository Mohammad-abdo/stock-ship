import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { vendorApi } from '@/lib/stockshipApi';
import { User, Save } from 'lucide-react';

const VendorProfile = () => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    companyName: '',
    businessName: '',
    phone: '',
    country: '',
    city: '',
    activities: '',
    paymentTerms: '',
    shippingTerms: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await vendorApi.getProfile();
      const data = response.data?.data || response.data;
      setProfile(data);
      setFormData({
        companyName: data?.companyName || '',
        businessName: data?.businessName || '',
        phone: data?.phone || '',
        country: data?.country || '',
        city: data?.city || '',
        activities: data?.activities || '',
        paymentTerms: data?.paymentTerms || '',
        shippingTerms: data?.shippingTerms || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await vendorApi.updateProfile(formData);
      alert('Profile updated successfully');
      fetchProfile();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your vendor profile information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company Name *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Business Name</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Activities</label>
              <textarea
                value={formData.activities}
                onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Payment Terms</label>
              <textarea
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Shipping Terms</label>
              <textarea
                value={formData.shippingTerms}
                onChange={(e) => setFormData({ ...formData, shippingTerms: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorProfile;
