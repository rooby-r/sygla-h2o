import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Check, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { rolePermissions } from '../../config/permissions';

const RoleInfo = () => {
  const { user } = useAuth();

  if (!user || !user.role || !rolePermissions[user.role]) {
    return null;
  }

  const roleInfo = rolePermissions[user.role];
  const permissions = roleInfo.canAccess;

  const renderPermission = (module, actions) => {
    if (typeof actions === 'boolean') {
      return (
        <div key={module} className="flex items-center justify-between py-2 border-b border-dark-700">
          <span className="text-dark-200 capitalize">{module}</span>
          {actions ? (
            <Check className="w-5 h-5 text-green-400" />
          ) : (
            <X className="w-5 h-5 text-red-400" />
          )}
        </div>
      );
    }

    if (typeof actions === 'object') {
      const allowedActions = Object.entries(actions)
        .filter(([_, allowed]) => allowed)
        .map(([action, _]) => action);
      
      if (allowedActions.length === 0) {
        return null;
      }

      return (
        <div key={module} className="py-2 border-b border-dark-700">
          <div className="flex items-center justify-between mb-1">
            <span className="text-dark-200 capitalize font-medium">{module}</span>
            <Check className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex flex-wrap gap-2 ml-4">
            {allowedActions.map(action => (
              <span
                key={action}
                className="px-2 py-1 text-xs rounded-full bg-primary-500/20 text-primary-400"
              >
                {action}
              </span>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <div className="flex items-center mb-4">
        <div className="p-3 rounded-lg bg-primary-500/20 mr-3">
          <Shield className="w-6 h-6 text-primary-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">{roleInfo.name}</h3>
          <p className="text-sm text-dark-400">{roleInfo.description}</p>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium text-dark-300 mb-3">Permissions:</h4>
        <div className="space-y-1">
          {Object.entries(permissions).map(([module, actions]) => 
            renderPermission(module, actions)
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RoleInfo;
