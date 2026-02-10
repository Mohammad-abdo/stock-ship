import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/stockship/employee/dashboard');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center min-h-screen bg-gray-50 p-4"
    >
      <div className="text-center max-w-md w-full">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="mb-8"
        >
          <div className="text-9xl font-bold text-gray-200 mb-4">404</div>
          <AlertCircle className="w-24 h-24 text-gray-400 mx-auto mb-6" />
        </motion.div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('error.404.title') || 'Page Not Found'}
        </h1>
        <p className="text-gray-600 mb-8">
          {t('error.404.description') || "The page you're looking for doesn't exist or has been moved."}
        </p>
        {location.pathname && (
          <p className="text-sm text-gray-500 mb-8 font-mono">
            {location.pathname}
          </p>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('error.404.goBack') || 'Go Back'}
          </Button>
          <Button
            onClick={() => navigate('/stockship/employee/dashboard')}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            {t('error.404.goHome') || 'Go to Dashboard'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default NotFound;
