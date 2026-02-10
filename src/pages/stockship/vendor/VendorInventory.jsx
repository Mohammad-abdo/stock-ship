import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { vendorApi } from '@/lib/stockshipApi';
import { Search, Warehouse, AlertTriangle, Plus, Minus, Package } from 'lucide-react';

const VendorInventory = () => {
  const { t } = useLanguage();
  const [inventory, setInventory] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockChange, setStockChange] = useState({ type: 'add', quantity: '' });

  useEffect(() => {
    fetchInventory();
    fetchLowStock();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await vendorApi.getInventory();
      const data = response.data?.data || response.data || [];
      setInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStock = async () => {
    try {
      const response = await vendorApi.getLowStockProducts();
      const data = response.data?.data || response.data || [];
      setLowStockProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
    }
  };

  const handleStockChange = (product) => {
    setSelectedProduct(product);
    setStockChange({ type: 'add', quantity: '' });
    setShowStockModal(true);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!stockChange.quantity || !selectedProduct) return;
    try {
      if (stockChange.type === 'add') {
        await vendorApi.addStock({
          productId: selectedProduct.productId || selectedProduct.id,
          quantity: parseInt(stockChange.quantity)
        });
      } else {
        await vendorApi.removeStock({
          productId: selectedProduct.productId || selectedProduct.id,
          quantity: parseInt(stockChange.quantity)
        });
      }
      setShowStockModal(false);
      fetchInventory();
      fetchLowStock();
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock');
    }
  };

  const filteredInventory = inventory.filter(item =>
    (item.product?.nameKey || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.product?.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && inventory.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground mt-2">Track and manage your product stock levels</p>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alert ({lowStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="p-3 rounded-lg bg-orange-500/10">
                  <p className="font-semibold">{product.nameKey || 'Unnamed Product'}</p>
                  <p className="text-sm text-muted-foreground">
                    Current Stock: {product.quantity || 0} | Min Level: {product.minStockLevel || 0}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Levels ({filteredInventory.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No inventory items found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Product</th>
                    <th className="text-left p-4">SKU</th>
                    <th className="text-left p-4">Current Stock</th>
                    <th className="text-left p-4">Min Level</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => {
                    const isLowStock = item.minStockLevel && item.quantity <= item.minStockLevel;
                    return (
                      <tr key={item.id} className={`border-b hover:bg-gray-50 ${isLowStock ? 'bg-orange-50' : ''}`}>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <div className="font-medium">{item.product?.nameKey || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="p-4">{item.product?.sku || item.sku || 'N/A'}</td>
                        <td className="p-4">
                          <div className="font-semibold">{item.quantity || 0}</div>
                        </td>
                        <td className="p-4">{item.minStockLevel || 'N/A'}</td>
                        <td className="p-4">
                          {isLowStock ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedProduct(item);
                                setStockChange({ type: 'add', quantity: '' });
                                setShowStockModal(true);
                              }}
                              className="p-2 hover:bg-green-100 rounded text-green-600"
                              title="Add Stock"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct(item);
                                setStockChange({ type: 'remove', quantity: '' });
                                setShowStockModal(true);
                              }}
                              className="p-2 hover:bg-red-100 rounded text-red-600"
                              title="Remove Stock"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Change Modal */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {stockChange.type === 'add' ? 'Add Stock' : 'Remove Stock'}
            </h2>
            <form onSubmit={handleStockSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product</label>
                <input
                  type="text"
                  value={selectedProduct.product?.nameKey || selectedProduct.nameKey || 'N/A'}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Current Stock</label>
                <input
                  type="text"
                  value={selectedProduct.quantity || 0}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity *</label>
                <input
                  type="number"
                  value={stockChange.quantity}
                  onChange={(e) => setStockChange({ ...stockChange, quantity: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  min="1"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg ${
                    stockChange.type === 'add' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {stockChange.type === 'add' ? 'Add' : 'Remove'} Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorInventory;
