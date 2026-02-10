import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/stockshipApi';
import { Search, Wallet, Filter } from 'lucide-react';

const AdminWallets = () => {
  const { t } = useLanguage();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchWallets();
  }, [pagination.page, typeFilter, searchTerm]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(typeFilter && { type: typeFilter }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await adminApi.getWallets(params);
      const data = response.data.data || response.data;
      setWallets(Array.isArray(data) ? data : []);
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && wallets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading wallets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Wallets Management</h1>
          <p className="text-muted-foreground mt-2">Manage all platform wallets</p>
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
                placeholder="Search wallets..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Types</option>
              <option value="vendor">Vendor Wallets</option>
              <option value="user">User Wallets</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Wallets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Wallets List ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {wallets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No wallets found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">ID</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Owner</th>
                    <th className="text-left p-4">Balance</th>
                    <th className="text-left p-4">Total Earnings</th>
                    <th className="text-left p-4">Total Payouts</th>
                    <th className="text-left p-4">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((wallet) => (
                    <tr key={wallet.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{wallet.id}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          wallet.walletType === 'VENDOR' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {wallet.walletType || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">
                            {wallet.walletType === 'VENDOR' 
                              ? wallet.vendor?.companyName || 'N/A'
                              : wallet.user?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {wallet.walletType === 'VENDOR' 
                              ? wallet.vendor?.email || ''
                              : wallet.user?.email || ''}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold">{wallet.balance || 0} SAR</span>
                        </div>
                      </td>
                      <td className="p-4">{wallet.totalEarnings || 0} SAR</td>
                      <td className="p-4">{wallet.totalPayouts || 0} SAR</td>
                      <td className="p-4">{wallet.totalCommission || 0} SAR</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWallets;
