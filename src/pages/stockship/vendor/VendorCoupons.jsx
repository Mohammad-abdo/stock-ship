import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { vendorApi } from '@/lib/stockshipApi';
import { Search, Plus, Edit, Trash2, Tag } from 'lucide-react';

const VendorCoupons = () => {
  const { t } = useLanguage();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    couponType: 'PERCENTAGE',
    discountValue: '',
    minPurchaseAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    usageLimitPerUser: '',
    validFrom: '',
    validUntil: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await vendorApi.getCoupons();
      const data = response.data?.data || response.data || [];
      setCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      code: '',
      couponType: 'PERCENTAGE',
      discountValue: '',
      minPurchaseAmount: '',
      maxDiscountAmount: '',
      usageLimit: '',
      usageLimitPerUser: '',
      validFrom: '',
      validUntil: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : null,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        usageLimitPerUser: formData.usageLimitPerUser ? parseInt(formData.usageLimitPerUser) : null
      };
      await vendorApi.createCoupon(data);
      setShowModal(false);
      fetchCoupons();
    } catch (error) {
      console.error('Error creating coupon:', error);
      alert(error.response?.data?.message || 'Failed to create coupon');
    }
  };

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && coupons.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Coupons</h1>
          <p className="text-muted-foreground mt-2">Create and manage discount coupons</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-5 h-5" />
          Create Coupon
        </button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Coupons List ({filteredCoupons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCoupons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No coupons found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Code</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Discount</th>
                    <th className="text-left p-4">Usage</th>
                    <th className="text-left p-4">Valid Period</th>
                    <th className="text-left p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold">{coupon.code}</span>
                        </div>
                      </td>
                      <td className="p-4">{coupon.couponType?.replace(/_/g, ' ') || 'N/A'}</td>
                      <td className="p-4">
                        {coupon.couponType === 'PERCENTAGE' 
                          ? `${coupon.discountValue}%`
                          : `${coupon.discountValue} SAR`}
                      </td>
                      <td className="p-4">
                        {coupon.usedCount || 0} / {coupon.usageLimit || '∞'}
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {new Date(coupon.validFrom).toLocaleDateString()} - {new Date(coupon.validUntil).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          coupon.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {coupon.status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create Coupon</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select
                    value={formData.couponType}
                    onChange={(e) => setFormData({ ...formData, couponType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min Purchase</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minPurchaseAmount}
                    onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Discount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valid From *</label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valid Until *</label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorCoupons;
