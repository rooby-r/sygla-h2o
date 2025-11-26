import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'md', color = 'primary' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colorClasses = {
    primary: 'border-primary-500',
    secondary: 'border-secondary-500',
    white: 'border-white',
    gray: 'border-gray-500',
  };

  return (
    <div className="flex items-center justify-center">
      <motion.div
        className={`
          ${sizeClasses[size]} 
          border-2 border-transparent 
          ${colorClasses[color]} 
          border-t-transparent 
          rounded-full
        `}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

// Spinner pleine page
export const FullPageSpinner = () => {
  return (
    <motion.div
      className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <motion.p
          className="mt-4 text-dark-300 text-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Chargement...
        </motion.p>
      </div>
    </motion.div>
  );
};

// Spinner avec overlay
export const OverlaySpinner = ({ message = 'Chargement...' }) => {
  return (
    <motion.div
      className="absolute inset-0 bg-dark-900/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-3 text-dark-300">{message}</p>
      </div>
    </motion.div>
  );
};

// Spinner inline
export const InlineSpinner = ({ size = 'sm', className = '' }) => {
  return (
    <LoadingSpinner size={size} className={`inline-block ${className}`} />
  );
};

export default LoadingSpinner;