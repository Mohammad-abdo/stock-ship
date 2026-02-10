import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { vendorApi } from '@/lib/stockshipApi';
import { Search, Plus, Edit, Trash2, Gift, CheckCircle, XCircle } from 'lucide-react';

const VendorOffers = () => {
  const { t } = useLanguage();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    title: '',
    description: '',
    offerType: 'PERCENTAGE',
    discountValue: '',
    startDate: '',
    endDate: '',
    usageLimit: ''
  });

  useEffect(() => {
    fetchOffers();
  }, [statusFilter]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const params = {
        ...(statusFilter && { status: statusFilter })
      };
      const response = await vendorApi.getOffers(params);
      const data = response.data?.data || response.data || [];
      setOffers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      productId: '',
      title: '',
      description: '',
      offerType: 'PERCENTAGE',
      discountValue: '',
      startDate: '',
      endDate: '',
      usageLimit: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        productId: parseInt(formData.productId),
        discountValue: parseFloat(formData.discountValue),
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null
      };
      await vendorApi.createOffer(data);
      setShowModal(false);
      fetchOffers();
    } catch (error) {
      console.error('Error creating offer:', error);
      alert(error.response?.data?.message || 'Failed to create offer');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    try {
      await vendorApi.deleteOffer(id);
      fetchOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      alert('Failed to delete offer');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      ACTIVE: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      REJECTED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  const filteredOffers = offers.filter(offer =>
    offer.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.product?.nameKey?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && offers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Offers</h1>
          <p className="text-muted-foreground mt-2">Create and manage special offers</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-5 h-5" />
          Create Offer
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search offers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Offers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Offers List ({filteredOffers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOffers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No offers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">ID</th>
                    <th className="text-left p-4">Product</th>
                    <th className="text-left p-4">Title</th>
                    <th className="text-left p-4">Discount</th>
                    <th className="text-left p-4">Period</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOffers.map((offer) => (
                    <tr key={offer.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{offer.id}</td>
                      <td className="p-4">{offer.product?.nameKey || 'N/A'}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-gray-400" />
                          <span>{offer.title || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {offer.offerType === 'PERCENTAGE' 
                          ? `${offer.discountValue}%`
                          : `${offer.discountValue} SAR`}
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {new Date(offer.startDate).toLocaleDateString()} - {new Date(offer.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(offer.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(offer.id)}
                            className="p-2 hover:bg-red-100 rounded text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
            <h2 className="text-2xl font-bold mb-4">Create Offer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Product ID *</label>
                  <input
                    type="number"
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select
                    value={formData.offerType}
                    onChange={(e) => setFormData({ ...formData, offerType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
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
                  <label className="block text-sm font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                />
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

export default VendorOffers;
