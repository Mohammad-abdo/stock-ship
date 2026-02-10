import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { vendorApi } from '@/lib/stockshipApi';
import { Search, Handshake, CheckCircle, XCircle, MessageSquare, Eye } from 'lucide-react';

const VendorNegotiations = () => {
  const { t } = useLanguage();
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNegotiation, setSelectedNegotiation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseData, setResponseData] = useState({ accept: true, price: '', quantity: '', notes: '' });

  useEffect(() => {
    fetchNegotiations();
  }, [statusFilter]);

  const fetchNegotiations = async () => {
    try {
      setLoading(true);
      const params = {
        ...(statusFilter && { status: statusFilter })
      };
      const response = await vendorApi.getNegotiations(params);
      const data = response.data?.data || response.data || [];
      setNegotiations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching negotiations:', error);
      setNegotiations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNegotiationDetails = async (id) => {
    try {
      const response = await vendorApi.getNegotiation(id);
      setSelectedNegotiation(response.data.data || response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching negotiation details:', error);
      alert('Failed to fetch negotiation details');
    }
  };

  const handleRespond = (negotiation) => {
    setSelectedNegotiation(negotiation);
    setResponseData({
      accept: true,
      price: negotiation.negotiatedPrice?.toString() || '',
      quantity: negotiation.negotiatedQuantity?.toString() || '',
      notes: ''
    });
    setShowResponseModal(true);
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedNegotiation) return;
    try {
      await vendorApi.respondToNegotiation(selectedNegotiation.id, {
        accept: responseData.accept,
        negotiatedPrice: responseData.accept ? parseFloat(responseData.price) : null,
        negotiatedQuantity: responseData.accept ? parseInt(responseData.quantity) : null,
        notes: responseData.notes,
        status: responseData.accept ? 'ACCEPTED' : 'REJECTED'
      });
      setShowResponseModal(false);
      fetchNegotiations();
    } catch (error) {
      console.error('Error responding to negotiation:', error);
      alert('Failed to respond to negotiation');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      CLOSED: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredNegotiations = negotiations.filter(negotiation =>
    (negotiation.product?.nameKey || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (negotiation.buyer?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && negotiations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading negotiations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Negotiations</h1>
          <p className="text-muted-foreground mt-2">Manage price and quantity negotiations</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search negotiations..."
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
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="CLOSED">Closed</option>
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

      {/* Negotiations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Negotiations List ({filteredNegotiations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredNegotiations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No negotiations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">ID</th>
                    <th className="text-left p-4">Product</th>
                    <th className="text-left p-4">Buyer</th>
                    <th className="text-left p-4">Quantity</th>
                    <th className="text-left p-4">Price</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNegotiations.map((negotiation) => (
                    <tr key={negotiation.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">#{negotiation.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Handshake className="w-4 h-4 text-gray-400" />
                          <span>{negotiation.product?.nameKey || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{negotiation.buyer?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{negotiation.buyer?.email || ''}</div>
                        </div>
                      </td>
                      <td className="p-4">{negotiation.negotiatedQuantity || negotiation.quantity || 0}</td>
                      <td className="p-4">{negotiation.negotiatedPrice || negotiation.price || 0} SAR</td>
                      <td className="p-4">{getStatusBadge(negotiation.status)}</td>
                      <td className="p-4">
                        <div className="text-sm">{formatDate(negotiation.createdAt)}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => fetchNegotiationDetails(negotiation.id)}
                            className="p-2 hover:bg-gray-100 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {negotiation.status === 'PENDING' && (
                            <button
                              onClick={() => handleRespond(negotiation)}
                              className="px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
                            >
                              Respond
                            </button>
                          )}
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

      {/* Details Modal */}
      {showDetailsModal && selectedNegotiation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Negotiation Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><strong>ID:</strong> #{selectedNegotiation.id}</div>
              <div><strong>Status:</strong> {getStatusBadge(selectedNegotiation.status)}</div>
              <div><strong>Product:</strong> {selectedNegotiation.product?.nameKey || 'N/A'}</div>
              <div><strong>Buyer:</strong> {selectedNegotiation.buyer?.name || 'N/A'}</div>
              <div><strong>Quantity:</strong> {selectedNegotiation.negotiatedQuantity || selectedNegotiation.quantity || 0}</div>
              <div><strong>Price:</strong> {selectedNegotiation.negotiatedPrice || selectedNegotiation.price || 0} SAR</div>
              {selectedNegotiation.notes && (
                <div className="col-span-2">
                  <strong>Notes:</strong> {selectedNegotiation.notes}
                </div>
              )}
            </div>
            {selectedNegotiation.status === 'PENDING' && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleRespond(selectedNegotiation);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Respond
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedNegotiation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Respond to Negotiation</h2>
            <form onSubmit={handleResponseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Response</label>
                <select
                  value={responseData.accept ? 'accept' : 'reject'}
                  onChange={(e) => setResponseData({ ...responseData, accept: e.target.value === 'accept' })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="accept">Accept</option>
                  <option value="reject">Reject</option>
                </select>
              </div>
              {responseData.accept && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Price (SAR) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={responseData.price}
                      onChange={(e) => setResponseData({ ...responseData, price: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity *</label>
                    <input
                      type="number"
                      value={responseData.quantity}
                      onChange={(e) => setResponseData({ ...responseData, quantity: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={responseData.notes}
                  onChange={(e) => setResponseData({ ...responseData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowResponseModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg ${
                    responseData.accept 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {responseData.accept ? 'Accept' : 'Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorNegotiations;
