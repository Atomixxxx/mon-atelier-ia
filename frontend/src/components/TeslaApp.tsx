import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TeslaInterface from './TeslaInterface';
import TeslaWorkflowInterface from './TeslaWorkflowInterface';
import AuthProvider from './AuthProvider';

const TeslaApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'chat'>('home');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Écouter les changements de hash pour navigation
    const handleHashChange = () => {
      if (window.location.hash === '#chat') {
        navigateToChat();
      } else {
        setCurrentView('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Vérifier le hash initial
    if (window.location.hash === '#chat') {
      setCurrentView('chat');
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToChat = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView('chat');
      setIsTransitioning(false);
    }, 500);
  };

  const navigateToHome = () => {
    setIsTransitioning(true);
    window.location.hash = '';
    setTimeout(() => {
      setCurrentView('home');
      setIsTransitioning(false);
    }, 500);
  };

  return (
    <div className="tesla-main-app">
      {/* Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="text-white text-2xl font-light tracking-wider"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              ATELIER IA
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Views */}
      <AnimatePresence mode="wait">
        {currentView === 'home' ? (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <TeslaInterface />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-black"
          >
            {/* Navbar Tesla pour l'interface de chat */}
            <motion.nav 
              className="fixed top-0 w-full z-50 backdrop-blur-md bg-black bg-opacity-90"
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <motion.button
                  className="text-white text-xl font-light tracking-wider hover:text-red-500 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={navigateToHome}
                >
                  ← ATELIER IA
                </motion.button>
                
                <div className="text-white font-light">
                  Intelligence Artificielle Active
                </div>
                
                <motion.div 
                  className="w-3 h-3 bg-red-500 rounded-full"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity 
                  }}
                />
              </div>
            </motion.nav>

            {/* Interface de chat avec style Tesla */}
            <div className="pt-20">
              <AuthProvider>
                <TeslaWorkflowInterface />
              </AuthProvider>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeslaApp;