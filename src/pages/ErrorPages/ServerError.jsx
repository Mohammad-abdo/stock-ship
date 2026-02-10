import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ServerError = ({ error, resetError }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/stockship/employee/dashboard');
    }
  };

  const handleRefresh = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
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
          <div className="text-9xl font-bold text-red-200 mb-4">500</div>
          <AlertTriangle className="w-24 h-24 text-red-400 mx-auto mb-6" />
        </motion.div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('error.500.title') || 'Internal Server Error'}
        </h1>
        <p className="text-gray-600 mb-4">
          {t('error.500.description') || "Something went wrong on our end. We're working to fix it."}
        </p>
        {error && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              {t('error.500.showDetails') || 'Show Error Details'}
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-40">
              {error.toString()}
            </pre>
          </details>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t('error.500.refresh') || 'Refresh Page'}
          </Button>
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('error.500.goBack') || 'Go Back'}
          </Button>
          <Button
            onClick={() => navigate('/stockship/employee/dashboard')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            {t('error.500.goHome') || 'Go to Dashboard'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ServerError;
