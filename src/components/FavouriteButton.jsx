import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FavouriteButton({ productId, size = 'md' }) {
  const { user } = useAuth();
  const [isFavourite, setIsFavourite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (user && productId) {
      checkFavouriteStatus();
    } else {
      setChecking(false);
    }
  }, [user, productId]);

  const checkFavouriteStatus = async () => {
    try {
      const response = await api.get(`/favourites/${productId}/check`);
      setIsFavourite(response.data?.data?.is_favourite || false);
    } catch (error) {
      console.error('Error checking favourite status:', error);
      setIsFavourite(false);
    } finally {
      setChecking(false);
    }
  };

  const handleToggle = async (e) => {
    e.stopPropagation();
    
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      if (isFavourite) {
        await api.delete(`/favourites/${productId}`);
        setIsFavourite(false);
      } else {
        await api.post('/favourites', { product_id: productId });
        setIsFavourite(true);
      }
    } catch (error) {
      console.error('Error toggling favourite:', error);
      alert(error.response?.data?.message || 'Failed to update favourite');
    } finally {
      setLoading(false);
    }
  };

  if (!user || checking) {
    return null;
  }

  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  return (
    <motion.button
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-full transition-all ${
        isFavourite
          ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
          : 'bg-background/80 backdrop-blur-sm text-muted-foreground hover:bg-red-500/20 hover:text-red-500'
      }`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Heart 
        className={`${iconSize} ${isFavourite ? 'fill-current' : ''}`}
      />
    </motion.button>
  );
}




