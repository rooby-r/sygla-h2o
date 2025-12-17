import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const baseClasses = 'btn';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white focus:ring-red-500 rounded-xl shadow-lg hover:shadow-xl',
    success: 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white focus:ring-green-500 rounded-xl shadow-lg hover:shadow-xl',
    warning: 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white focus:ring-yellow-500 rounded-xl shadow-lg hover:shadow-xl',
    info: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white focus:ring-blue-500 rounded-xl shadow-lg hover:shadow-xl',
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        {
          'opacity-50 cursor-not-allowed': isDisabled,
          'cursor-pointer': !isDisabled,
        },
        className
      )}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="spinner w-4 h-4" />
          <span>Chargement...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </div>
      )}
    </motion.button>
  );
};

// Variants spécialisés
export const IconButton = ({ icon: Icon, size = 'md', ...props }) => {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <Button
      className={clsx('!p-0', sizeClasses[size])}
      {...props}
    >
      <Icon className={iconSizes[size]} />
    </Button>
  );
};

export const FloatingActionButton = ({ icon: Icon, ...props }) => {
  return (
    <motion.button
      className="fixed bottom-6 right-6 bg-gradient-to-r from-primary-600 to-primary-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 z-40"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      <Icon className="w-6 h-6" />
    </motion.button>
  );
};

export default Button;