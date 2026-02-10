import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { vendorApi } from '@/lib/stockshipApi';
import { Search, FileText, CheckCircle, Eye, MessageSquare } from 'lucide-react';

const VendorPriceRequests = () => {
  const { t } = useLanguage();
  const [priceRequests, setPriceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseData, setResponseData] = useState({ price: '', message: '' });

  useEffect(() => {
    fetchPriceRequests();
  }, [statusFilter]);

  const fetchPriceRequests = async () => {
    try {
      setLoading(true);
      const params = {
        ...(statusFilter && { status: statusFilter })
      };
      const response = await vendorApi.getPriceRequests(params);
      const data = response.data?.data || response.data || [];
      setPriceRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching price requests:', error);
      setPriceRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestDetails = async (id) => {
    try {
      const response = await vendorApi.getPriceRequests({ id });
      const request = Array.isArray(response.data?.data || response.data) 
        ? (response.data?.data || response.data).find(r => r.id === id)
        : (response.data?.data || response.data);
      setSelectedRequest(request);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching request details:', error);
      alert('Failed to fetch request details');
    }
  };

  const handleRespond = (request) => {
    setSelectedRequest(request);
    setResponseData({
      price: request.responsePrice?.toString() || '',
      message: ''
    });
    setShowResponseModal(true);
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      await vendorApi.respondToPriceRequest(selectedRequest.id, {
        responsePrice: parseFloat(responseData.price),
        response: responseData.message
      });
      setShowResponseModal(false);
      fetchPriceRequests();
    } catch (error) {
      console.error('Error responding to price request:', error);
      alert('Failed to respond to price request');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      RESPONDED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800'
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

  const filteredRequests = priceRequests.filter(request =>
    (request.product?.nameKey || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (request.buyer?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && priceRequests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading price requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Price Requests</h1>
          <p className="text-muted-foreground mt-2">Respond to customer price inquiries</p>
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
                placeholder="Search requests..."
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
              <option value="RESPONDED">Responded</option>
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

      {/* Price Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Price Requests List ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No price requests found</p>
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
                    <th className="text-left p-4">Response Price</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">#{request.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span>{request.product?.nameKey || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{request.buyer?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{request.buyer?.email || ''}</div>
                        </div>
                      </td>
                      <td className="p-4">{request.requestedQuantity || 0}</td>
                      <td className="p-4">
                        {request.responsePrice ? `${request.responsePrice} SAR` : 'Not responded'}
                      </td>
                      <td className="p-4">{getStatusBadge(request.status)}</td>
                      <td className="p-4">
                        <div className="text-sm">{formatDate(request.createdAt)}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => fetchRequestDetails(request.id)}
                            className="p-2 hover:bg-gray-100 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {request.status === 'PENDING' && (
                            <button
                              onClick={() => handleRespond(request)}
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
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Price Request Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><strong>ID:</strong> #{selectedRequest.id}</div>
              <div><strong>Status:</strong> {getStatusBadge(selectedRequest.status)}</div>
              <div><strong>Product:</strong> {selectedRequest.product?.nameKey || 'N/A'}</div>
              <div><strong>Buyer:</strong> {selectedRequest.buyer?.name || 'N/A'}</div>
              <div><strong>Requested Quantity:</strong> {selectedRequest.requestedQuantity || 0}</div>
              <div><strong>Response Price:</strong> {selectedRequest.responsePrice ? `${selectedRequest.responsePrice} SAR` : 'Not responded'}</div>
              {selectedRequest.message && (
                <div className="col-span-2">
                  <strong>Message:</strong> {selectedRequest.message}
                </div>
              )}
              {selectedRequest.response && (
                <div className="col-span-2">
                  <strong>Response:</strong> {selectedRequest.response}
                </div>
              )}
            </div>
            {selectedRequest.status === 'PENDING' && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleRespond(selectedRequest);
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
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Respond to Price Request</h2>
            <form onSubmit={handleResponseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Response Price (SAR) *</label>
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
                <label className="block text-sm font-medium mb-1">Response Message</label>
                <textarea
                  value={responseData.message}
                  onChange={(e) => setResponseData({ ...responseData, message: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                  placeholder="Optional message to the buyer..."
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
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Submit Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorPriceRequests;
