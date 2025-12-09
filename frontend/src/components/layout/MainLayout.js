import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTheme } from '../../contexts/ThemeContext';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const { theme } = useTheme();

  // Gérer le state responsive avec breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768; // < 768px = mobile
      const tablet = width >= 768 && width < 1024; // 768px-1023px = tablet
      const desktop = width >= 1024; // >= 1024px = desktop
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      setIsDesktop(desktop);
      setIsSidebarOpen(desktop); // Sidebar ouverte par défaut sur desktop
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-dark-900'}`}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        isDesktop={isDesktop}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      
      {/* Overlay pour mobile/tablet quand sidebar est ouverte */}
      {(isMobile || isTablet) && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Main content area */}
      <div className={`min-h-screen transition-all duration-300 ${
        isDesktop && isSidebarOpen ? 'lg:ml-80' : 'lg:ml-0'
      }`}>
        {/* Header */}
        <Header 
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          isMobile={isMobile}
        />
        
        {/* Page content - Padding responsive */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="p-3 sm:p-4 md:p-6"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};

export default MainLayout;