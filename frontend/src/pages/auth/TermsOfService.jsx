import React from 'react';
import { FaArrowLeft, FaShieldAlt, FaFileContract } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';

const TermsOfService = () => {
  const navigate = useNavigate();
  
  const particlesInit = async (main) => {
    await loadFull(main);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Particles Background */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          fullScreen: { enable: false },
          particles: {
            number: { value: 60, density: { enable: true, value_area: 800 } },
            color: { value: "#ffffff" },
            shape: { type: "circle" },
            opacity: { value: 0.3, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.2, width: 1 },
            move: {
              enable: true,
              speed: 2,
              direction: "none",
              random: true,
              straight: false,
              out_mode: "out",
              bounce: false,
              attract: { enable: false, rotateX: 600, rotateY: 1200 }
            }
          },
          interactivity: {
            detect_on: "canvas",
            events: {
              onhover: { enable: true, mode: "repulse" },
              onclick: { enable: true, mode: "push" },
              resize: true
            },
            modes: {
              repulse: { distance: 100, duration: 0.4 },
              push: { particles_nb: 4 }
            }
          },
          retina_detect: true
        }}
      />

      {/* Back Button */}
      <motion.button 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 z-50 flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-full shadow-xl backdrop-blur-sm transition-all duration-300 border border-white/20 hover:border-white/30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FaArrowLeft className="text-xl" />
        <span className="font-medium">Back</span>
      </motion.button>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/10"
      >
        {/* Glowing Accent Elements */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-r from-teal-500/20 to-emerald-600/20 rounded-full blur-3xl" />

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="inline-block mb-4"
          >
            <FaFileContract className="text-5xl text-blue-400/80" />
          </motion.div>
          <motion.h1 
            className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Terms of Service
          </motion.h1>
          <motion.p 
            className="text-white/70"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Last Updated: {new Date().toLocaleDateString()}
          </motion.p>
        </div>

        {/* Terms Content */}
        <div className="prose prose-invert max-w-none">
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-white/80 mb-4">
              By accessing or using the DeccanCare platform, you agree to be bound by these Terms of Service. 
              If you do not agree to all the terms, you may not access or use our services.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold text-white mb-4">2. Medical Disclaimer</h2>
            <p className="text-white/80 mb-4">
              The content provided through DeccanCare is for informational purposes only and does not constitute 
              medical advice. Always seek the advice of your physician or other qualified health provider with 
              any questions you may have regarding a medical condition.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Responsibilities</h2>
            <ul className="list-disc pl-6 text-white/80 space-y-2">
              <li>Provide accurate and complete information during registration</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Use the service only for lawful purposes</li>
            </ul>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold text-white mb-4">4. Modifications to Terms</h2>
            <p className="text-white/80 mb-4">
              We reserve the right to modify these terms at any time. We will notify users of significant changes 
              through the platform or via email. Continued use of the service after such changes constitutes your 
              acceptance of the new terms.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h2 className="text-2xl font-semibold text-white mb-4">5. Contact Information</h2>
            <p className="text-white/80">
              For any questions about these Terms of Service, please contact us at:
              <br />
              <a href="mailto:csgptclg@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors">
                csgptclg@gmail.com
              </a>
            </p>
          </motion.section>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsOfService;