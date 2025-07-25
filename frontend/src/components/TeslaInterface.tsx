import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PremiumInterface: React.FC = () => {
  const [activeSection, setActiveSection] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sections = [
    {
      title: "Mon Atelier IA",
      subtitle: "Révolutionnez votre développement avec l'IA révolutionnaire",
      description: "Transformez vos idées en applications web magnifiques grâce à notre Agent Développeur IA. Preview automatique, streaming temps réel, et éditeur Monaco intégré pour une expérience de développement sans précédent.",
      cta: "Démarrer la révolution",
      background: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
      video: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&h=1080&auto=format&fit=crop"
    },
    {
      title: "Agent Développeur IA",
      subtitle: "L'agent IA le plus avancé au monde",
      description: "Architecture modulaire, TypeScript strict, composants React modernes avec hooks, CSS révolutionnaire et optimisations techniques avancées. Un seul agent qui maîtrise tout l'écosystème de développement moderne avec un raisonnement structuré unique.",
      cta: "Expérimenter le futur",
      background: "linear-gradient(135deg, #1a1a1a 0%, #000000 100%)",
      video: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=1920&h=1080&auto=format&fit=crop"
    },
    {
      title: "Interface Premium",
      subtitle: "Expérience utilisateur révolutionnaire",
      description: "Workflow streaming en temps réel, preview automatique intelligente, éditeur Monaco professionnel, file explorer intégré et interface moderne premium. Basculement automatique vers la preview, détection de type de projet, et messages personnalisés pour une productivité maximale.",
      cta: "Découvrir l'interface",
      background: "linear-gradient(135deg, #000000 0%, #2a2a2a 100%)",
      video: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1920&h=1080&auto=format&fit=crop"
    }
  ];

  return (
    <div className="tesla-app">
      {/* Navigation Premium-style */}
      <motion.nav 
        className="fixed top-0 w-full z-50 backdrop-blur-md"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        style={{
          background: scrollY > 50 ? 'rgba(0, 0, 0, 0.9)' : 'transparent',
          transition: 'background 0.3s ease'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div 
            className="text-white text-2xl font-light tracking-wider"
            whileHover={{ scale: 1.05 }}
          >
            ATELIER IA
          </motion.div>
          
          <div className="hidden md:flex space-x-8">
            {[
              { name: 'Agents', id: 'agents-section' },
              { name: 'Workflow', id: 'workflow-section' },
              { name: 'Projets', id: 'projects-section' },
              { name: 'À propos', id: 'about-section' }
            ].map((item) => (
              <motion.button
                key={item.name}
                className="text-white hover:text-red-500 transition-colors duration-300 font-light"
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                onClick={() => scrollToSection(item.id)}
              >
                {item.name}
              </motion.button>
            ))}
          </div>

          <motion.button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <div className={`h-0.5 bg-white transition-transform ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <div className={`h-0.5 bg-white transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`} />
              <div className={`h-0.5 bg-white transition-transform ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black bg-opacity-95 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center justify-center h-full space-y-8">
              {[
                { name: 'Agents', id: 'agents-section' },
                { name: 'Workflow', id: 'workflow-section' },
                { name: 'Projets', id: 'projects-section' },
                { name: 'À propos', id: 'about-section' }
              ].map((item, index) => (
                <motion.button
                  key={item.name}
                  className="text-white text-2xl font-light hover:text-red-500 transition-colors"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => scrollToSection(item.id)}
                >
                  {item.name}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Sections */}
      {sections.map((section, index) => (
        <section
          key={index}
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
          style={{ background: section.background }}
        >
          {/* Background Video/Image */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              transform: `translateY(${scrollY * 0.5}px)`,
              backgroundImage: `url(${section.video})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          {/* Content */}
          <motion.div
            className="relative z-10 text-center max-w-4xl px-6"
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.h1 
              className="text-5xl md:text-7xl font-thin text-white mb-6 tracking-wide"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              {section.title}
            </motion.h1>
            
            <motion.h2 
              className="text-xl md:text-2xl font-light text-gray-300 mb-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              {section.subtitle}
            </motion.h2>
            
            <motion.p 
              className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              {section.description}
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              <motion.button
                className="tesla-btn-primary px-8 py-4 bg-transparent border border-white text-white font-light tracking-wide transition-all duration-300 hover:bg-white hover:text-black"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(255,255,255,0.2)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Navigation vers l'interface de chat
                  window.location.hash = '#chat';
                }}
              >
                {section.cta}
              </motion.button>
              
              {index === 0 && (
                <motion.button
                  className="tesla-btn-secondary px-8 py-4 bg-transparent border border-gray-600 text-gray-300 font-light tracking-wide transition-all duration-300 hover:border-red-500 hover:text-red-500"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollToSection('agents-section')}
                >
                  En savoir plus
                </motion.button>
              )}
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          {index === 0 && (
            <motion.div
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
                <div className="w-1 h-3 bg-white rounded-full mt-2" />
              </div>
            </motion.div>
          )}
        </section>
      ))}

      {/* Agents Section */}
      <section id="agents-section" className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)" }}>
        {/* Background subtle pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-thin text-white mb-6">
              Agent Développeur IA
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              L'agent IA révolutionnaire qui révolutionne le développement web moderne
            </p>
          </motion.div>

          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                name: "Agent Développeur IA",
                role: "Agent IA Révolutionnaire",
                description: "L'agent principal qui maîtrise l'ensemble du stack de développement moderne. Analyse, architecture, implémentation et optimisation dans un processus unifié avec raisonnement structuré et génération de code révolutionnaire.",
                specialties: ["React", "TypeScript", "Architecture", "CSS Moderne", "Optimisation", "Raisonnement IA"],
                icon: "⚛️",
                color: "from-blue-600 to-purple-600"
              },
              {
                name: "Ultra Designer",
                role: "Designer Révolutionnaire",
                description: "Spécialiste du design CSS ultra-moderne avec variables, animations, gradients et micro-interactions. Crée des designs qui révolutionnent l'industrie avec accessibilité totale et responsive design parfait.",
                specialties: ["CSS Moderne", "Animations", "Responsive", "Accessibilité", "Micro-interactions", "Design System"],
                icon: "🎨",
                color: "from-pink-600 to-red-600"
              },
              {
                name: "Code Architect",
                role: "Architecte de Code",
                description: "Expert en architecture et structure de code parfaite. Patterns modernes, best practices, documentation claire et performance optimale pour des applications maintenables et scalables.",
                specialties: ["Architecture", "Patterns", "Best Practices", "Performance", "Documentation", "Maintenabilité"],
                icon: "🏗️",
                color: "from-green-600 to-teal-600"
              }
            ].map((agent, index) => (
              <motion.div
                key={index}
                className="bg-white bg-opacity-5 backdrop-blur-sm rounded-lg border border-white border-opacity-10 overflow-hidden group hover:bg-opacity-10 hover:border-opacity-20 transition-all duration-300"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <div className={`h-2 bg-gradient-to-r ${agent.color}`} />
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-4xl mr-4 group-hover:scale-110 transition-transform duration-300">
                      {agent.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{agent.name}</h3>
                      <p className="text-sm text-gray-300">{agent.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {agent.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {agent.specialties.map((specialty, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-white bg-opacity-10 text-gray-300 text-xs rounded-full border border-white border-opacity-20"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #000000 100%)" }}>
        {/* Background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-600 rounded-full filter blur-3xl" />
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-600 rounded-full filter blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-thin text-white mb-6">
              Révolution Technologique
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              L'alliance parfaite entre GPT-4o et innovation moderne pour une expérience révolutionnaire
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: "Agent Développeur IA GPT-4o",
                description: "Agent IA révolutionnaire alimenté par GPT-4o avec raisonnement structuré. Maîtrise complète de React, TypeScript, architecture moderne et optimisations avancées dans un seul agent unifié.",
                icon: "🧠"
              },
              {
                title: "Streaming WebSocket Temps Réel", 
                description: "Workflow streaming instantané avec feedback live, preview automatique intelligente et basculement seamless. Expérience de développement immersive avec file explorer intégré.",
                icon: "🌊"
              },
              {
                title: "Interface Premium Premium",
                description: "Design révolutionnaire inspiré de Premium avec animations fluides, preview automatique, Monaco Editor professionnel et détection intelligente de projet pour une productivité maximale.",
                icon: "🚗"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="text-center group"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -10 }}
              >
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-light text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Process Section */}
      <section id="workflow-section" className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #000000 0%, #2a2a2a 100%)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-thin text-white mb-6">
              Workflow Simplifié
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Un processus révolutionnaire en 4 étapes pour créer votre application avec l'Agent Développeur IA
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Éveil Quantique",
                description: "Le Agent Développeur IA analyse votre demande avec un raisonnement structuré et définit l'architecture optimale de votre projet.",
                icon: "🧠",
                delay: 0
              },
              {
                step: "02", 
                title: "Architecture Premium",
                description: "Conception de la structure technique révolutionnaire avec patterns modernes, TypeScript strict et composants React optimisés.",
                icon: "⚡",
                delay: 0.2
              },
              {
                step: "03",
                title: "Implémentation Streaming",
                description: "Génération de code en temps réel avec streaming WebSocket, preview automatique et file explorer intégré.",
                icon: "🌊",
                delay: 0.4
              },
              {
                step: "04",
                title: "Preview Quantique",
                description: "Basculement automatique vers la preview intelligente avec détection de type de projet et message personnalisé.",
                icon: "🎬",
                delay: 0.6
              }
            ].map((phase, index) => (
              <motion.div
                key={index}
                className="text-center group"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: phase.delay }}
                whileHover={{ y: -10 }}
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto bg-red-600 rounded-full flex items-center justify-center text-3xl group-hover:bg-red-500 transition-colors duration-300">
                    {phase.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center text-sm font-bold">
                    {phase.step}
                  </div>
                </div>
                <h3 className="text-xl font-light text-white mb-4 group-hover:text-red-400 transition-colors duration-300">
                  {phase.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {phase.description}
                </p>
                {index < 3 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-red-600 to-transparent transform translate-x-4" />
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
          >
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="text-green-400 text-2xl mb-3">🌊</div>
                <h4 className="text-white font-semibold mb-1">Streaming Temps Réel</h4>
                <p className="text-gray-400 text-sm">
                  Suivi instantané du workflow via WebSocket
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="text-blue-400 text-2xl mb-3">🎬</div>
                <h4 className="text-white font-semibold mb-1">Preview Automatique</h4>
                <p className="text-gray-400 text-sm">
                  Basculement intelligent vers la preview
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="text-purple-400 text-2xl mb-3">📁</div>
                <h4 className="text-white font-semibold mb-1">File Explorer</h4>
                <p className="text-gray-400 text-sm">
                  Accès complet à la structure du projet
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #000000 100%)" }}>
        <motion.div
          className="text-center max-w-4xl mx-auto px-6"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-thin text-white mb-8">
            Prêt à révolutionner votre développement ?
          </h2>
          <motion.button
            className="tesla-btn-primary px-12 py-4 bg-red-600 text-white font-normal tracking-wide transition-all duration-300 hover:bg-red-700"
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(220, 38, 38, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // Navigation vers l'interface de chat
              window.location.hash = '#chat';
              // Ou utilisation du routeur si configuré
            }}
          >
            Lancer l'Atelier IA
          </motion.button>
        </motion.div>
      </section>

      {/* Projects Section */}
      <section id="projects-section" className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #000000 0%, #2a2a2a 100%)" }}>
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '100px 100px'
          }} />
        </div>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-thin text-white mb-6">
              Nos Projets
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Découvrez quelques-unes des applications créées avec notre plateforme
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Restaurant App Quantique",
                description: "Application restaurant avec menu interactif, réservations et preview automatique. Généré avec streaming temps réel et architecture React moderne.",
                tech: ["React", "TypeScript", "CSS Moderne", "Premium"],
                image: "🍽️",
                category: "Restaurant"
              },
              {
                title: "Snake Game Premium",
                description: "Jeu Snake révolutionnaire avec contrôles fluides, animations Premium et logique de jeu optimisée. Preview instantanée avec file explorer complet.",
                tech: ["React", "Canvas", "Hooks", "Premium UI"],
                image: "🐍",
                category: "Gaming"
              },
              {
                title: "Todo App Révolutionnaire",
                description: "Gestionnaire de tâches avec interface Premium, localStorage intelligent et composants React optimisés. Architecture modulaire parfaite.",
                tech: ["React", "LocalStorage", "TypeScript", "Premium"],
                image: "✅",
                category: "Productivité"
              },
              {
                title: "Dashboard Premium",
                description: "Interface d'administration avec streaming temps réel, preview automatique et file explorer intégré. Expérience développeur révolutionnaire.",
                tech: ["React", "WebSocket", "Monaco", "GPT-4o"],
                image: "📊",
                category: "Analytics"
              },
              {
                title: "E-Commerce Premium Style",
                description: "Boutique en ligne avec design minimaliste Premium, animations fluides et preview automatique intelligente. Workflow streaming optimisé.",
                tech: ["React", "TypeScript", "Premium UI", "Premium"],
                image: "🛍️",
                category: "E-Commerce"
              },
              {
                title: "Portfolio Quantique",
                description: "Site portfolio avec interface Premium, animations révolutionnaires et preview automatique. Architecture React moderne avec file explorer.",
                tech: ["React", "Framer Motion", "Premium", "GPT-4o"],
                image: "🎨",
                category: "Portfolio"
              }
            ].map((project, index) => (
              <motion.div
                key={index}
                className="bg-white bg-opacity-5 backdrop-blur-sm rounded-lg border border-white border-opacity-10 overflow-hidden group hover:bg-opacity-10 hover:border-opacity-20 transition-all duration-300"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                      {project.image}
                    </div>
                    <span className="px-3 py-1 bg-red-600 bg-opacity-20 text-red-400 text-xs rounded-full font-medium border border-red-500 border-opacity-30">
                      {project.category}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {project.title}
                  </h3>
                  
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {project.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-white bg-opacity-10 text-gray-300 text-xs rounded border border-white border-opacity-20"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.button
              className="tesla-btn-primary px-8 py-4 bg-transparent text-white font-light tracking-wide border border-white hover:bg-white hover:text-black transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                window.location.hash = '#chat';
              }}
            >
              Créer votre projet
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about-section" className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #000000 100%)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-thin text-white mb-6">
              À propos de nous
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              L'innovation au cœur du développement web moderne
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="text-2xl font-light text-white mb-6">
                Notre Mission
              </h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                Mon Atelier IA révolutionne le développement web avec le Agent Développeur IA, l'agent IA le plus avancé 
                au monde. Notre interface Premium premium permet de créer des applications exceptionnelles avec streaming 
                temps réel, preview automatique et architecture React moderne.
              </p>
              <p className="text-gray-300 leading-relaxed mb-6">
                Nous avons simplifié l'expérience avec un seul agent révolutionnaire qui maîtrise tout l'écosystème 
                de développement moderne, alimenté par GPT-4o avec raisonnement structuré et optimisations premiums.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-300">Agent Développeur IA alimenté par GPT-4o disponible 24/7</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-300">Streaming WebSocket temps réel avec preview automatique</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-300">File explorer intégré et Monaco Editor professionnel</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-300">Interface Premium premium avec détection intelligente</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h4 className="text-white font-semibold mb-3 flex items-center">
                  <span className="text-2xl mr-3">🎯</span>
                  Vision
                </h4>
                <p className="text-gray-400">
                  Révolutionner le développement web avec le Agent Développeur IA et l'interface Premium premium. 
                  Preview automatique, streaming temps réel et architecture React moderne accessible à tous.
                </p>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h4 className="text-white font-semibold mb-3 flex items-center">
                  <span className="text-2xl mr-3">🚀</span>
                  Innovation
                </h4>
                <p className="text-gray-400">
                  GPT-4o avec raisonnement premium, streaming WebSocket, preview automatique intelligente, 
                  et interface Premium révolutionnaire pour une expérience de développement sans précédent.
                </p>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h4 className="text-white font-semibold mb-3 flex items-center">
                  <span className="text-2xl mr-3">⚡</span>
                  Performance
                </h4>
                <p className="text-gray-400">
                  File explorer intégré, Monaco Editor professionnel, détection de projet intelligente 
                  et messages personnalisés pour une productivité et performance maximales.
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="mt-20 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center space-x-8 bg-gray-900 rounded-lg p-8 border border-gray-800">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500 mb-2">1</div>
                <div className="text-gray-400 text-sm">Agent Développeur IA</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500 mb-2">⚡</div>
                <div className="text-gray-400 text-sm">Streaming Temps Réel</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500 mb-2">🎬</div>
                <div className="text-gray-400 text-sm">Preview Automatique</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer Premium-style */}
      <footer className="bg-black py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-white font-light text-xl mb-4 md:mb-0">
              ATELIER IA
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 Mon Atelier IA. Propulsé par l'intelligence artificielle.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PremiumInterface;