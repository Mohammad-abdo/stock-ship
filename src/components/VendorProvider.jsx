import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { extractDataFromResponse } from '@/lib/apiHelper';

const VendorContext = createContext(null);

export function VendorProvider({ children }) {
  const { user } = useAuth();
  const [vendors, setVendors] = useState({
    shops: [],
    pharmacies: [],
    companies: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedVendorType, setSelectedVendorType] = useState('all');

  useEffect(() => {
    // Only fetch vendors if user is admin
    if (user && (user.role === 'admin' || (user.role_names && user.role_names.includes('admin')))) {
      fetchVendors();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchVendors = async () => {
    // Only fetch if user is admin
    if (!user || (user.role !== 'admin' && (!user.role_names || !user.role_names.includes('admin')))) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const shopsRes = await api.get('/admin/shops').catch(() => ({ data: [] }));

      const shops = extractDataFromResponse(shopsRes);

      // Filter by category
      const pharmacies = shops.filter(shop => 
        shop.category?.toLowerCase().includes('pharmacy') || 
        shop.category?.toLowerCase().includes('صيدلية')
      );
      
      const companies = shops.filter(shop => 
        shop.category?.toLowerCase().includes('company') || 
        shop.category?.toLowerCase().includes('شركة')
      );

      setVendors({
        shops,
        pharmacies,
        companies,
      });
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVendorsByType = (type) => {
    switch (type) {
      case 'shops':
        return vendors.shops;
      case 'pharmacies':
        return vendors.pharmacies;
      case 'companies':
        return vendors.companies;
      case 'all':
      default:
        return {
          shops: vendors.shops,
          pharmacies: vendors.pharmacies,
          companies: vendors.companies,
        };
    }
  };

  const value = {
    vendors,
    loading,
    selectedVendorType,
    setSelectedVendorType,
    getVendorsByType,
    refreshVendors: fetchVendors,
  };

  return (
    <VendorContext.Provider value={value}>
      {children}
    </VendorContext.Provider>
  );
}

export function useVendors() {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error('useVendors must be used within VendorProvider');
  }
  return context;
}

