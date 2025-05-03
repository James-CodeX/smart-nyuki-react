import logo from "@/assets/images/logo.svg";
import { Button } from "@/components/ui/button";
import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useInView, useAnimation, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";
import { Link } from "react-router-dom";

const features = [
  {
    title: "Apiary Management",
    description: "Create and manage multiple apiaries with detailed location and environmental tracking.",
    icon: "🌍",
  },
  {
    title: "Hive Tracking",
    description: "Maintain detailed records for each beehive, including queen and health status.",
    icon: "🐝",
  },
  {
    title: "Inspections",
    description: "Record comprehensive inspection data, treatments, and attach images.",
    icon: "🔍",
  },
  {
    title: "Real-time Monitoring",
    description: "Live metrics for temperature, humidity, sound, and weight with automated alerts.",
    icon: "📈",
  },
  {
    title: "Production Tracking",
    description: "Track honey and product harvests, analyze efficiency and quality.",
    icon: "🍯",
  },
  {
    title: "Weather Integration",
    description: "Local weather forecasts and data correlation with hive performance.",
    icon: "☀️",
  },
];

const techStack = [
  "React", "TypeScript", "Tailwind CSS", "Supabase", "Framer Motion", "Recharts", "Tremor"
];

export default function Landing() {
  // Theme context
  const { theme } = useTheme();
  
  // Refs for smooth scroll
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const techRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  // Refs for scroll animations
  const featuresHeaderRef = useRef<HTMLHeadingElement>(null);
  const techHeaderRef = useRef<HTMLHeadingElement>(null);
  const aboutHeaderRef = useRef<HTMLHeadingElement>(null);
  
  // InView states for animations
  const featuresInView = useInView(featuresHeaderRef, { once: false, amount: 0.5 });
  const techInView = useInView(techHeaderRef, { once: false, amount: 0.5 });
  const aboutInView = useInView(aboutHeaderRef, { once: false, amount: 0.5 });
  
  // Animation controls
  const featuresControls = useAnimation();
  const techControls = useAnimation();
  const aboutControls = useAnimation();

  // Scroll progress for parallax effects
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -50]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.5]);
  
  // Animate sections when they come into view
  useEffect(() => {
    if (featuresInView) {
      featuresControls.start("visible");
    } else {
      featuresControls.start("hidden");
    }
  }, [featuresInView, featuresControls]);
  
  useEffect(() => {
    if (techInView) {
      techControls.start("visible");
    } else {
      techControls.start("hidden");
    }
  }, [techInView, techControls]);
  
  useEffect(() => {
    if (aboutInView) {
      aboutControls.start("visible");
    } else {
      aboutControls.start("hidden");
    }
  }, [aboutInView, aboutControls]);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const navItemVariants = {
    hover: { scale: 1.05, color: "#92400e" }
  };
  
  const featureCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5
      }
    },
    hover: { 
      scale: 1.05, 
      boxShadow: "0 10px 25px -5px rgba(251, 191, 36, 0.2), 0 8px 10px -6px rgba(251, 191, 36, 0.1)",
      transition: {
        duration: 0.2
      }
    }
  };
  
  const techBadgeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3
      }
    },
    hover: { 
      scale: 1.1, 
      backgroundColor: "#fbbf24",
      color: "#ffffff",
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-amber-900 text-white' : 'bg-gradient-to-br from-yellow-50 via-white to-amber-100'}`}>
      {/* Navigation Bar */}
      <motion.nav 
        className={`fixed top-0 left-0 w-full z-50 ${theme === 'dark' ? 'bg-gray-900/80 backdrop-blur border-b border-amber-900/50' : 'bg-white/80 backdrop-blur shadow-sm border-b border-amber-100'}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30 
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <motion.div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => scrollTo(heroRef)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.img 
              src={logo} 
              alt="Smart Nyuki Logo" 
              className="w-10 h-10" 
              animate={{ rotate: [0, 10, 0] }}
              transition={{ 
                repeat: Infinity, 
                repeatType: "reverse", 
                duration: 5,
                ease: "easeInOut"
              }}
            />
            <span className={`font-bold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'} text-xl`}>Smart Nyuki</span>
          </motion.div>
          <div className="hidden md:flex items-center gap-8">
            <div className={`flex gap-8 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'} font-semibold text-base`}>
              <motion.button 
                onClick={() => scrollTo(heroRef)} 
                className={`${theme === 'dark' ? 'hover:text-amber-300' : 'hover:text-amber-900'} transition`}
                variants={navItemVariants}
                whileHover="hover"
              >
                Home
              </motion.button>
              <motion.button 
                onClick={() => scrollTo(featuresRef)} 
                className={`${theme === 'dark' ? 'hover:text-amber-300' : 'hover:text-amber-900'} transition`}
                variants={navItemVariants}
                whileHover="hover"
              >
                Features
              </motion.button>
              <motion.button 
                onClick={() => scrollTo(techRef)} 
                className={`${theme === 'dark' ? 'hover:text-amber-300' : 'hover:text-amber-900'} transition`}
                variants={navItemVariants}
                whileHover="hover"
              >
                Technology
              </motion.button>
              <motion.button 
                onClick={() => scrollTo(aboutRef)} 
                className={`${theme === 'dark' ? 'hover:text-amber-300' : 'hover:text-amber-900'} transition`}
                variants={navItemVariants}
                whileHover="hover"
              >
                About
              </motion.button>
              <motion.button 
                onClick={() => scrollTo(contactRef)} 
                className={`${theme === 'dark' ? 'hover:text-amber-300' : 'hover:text-amber-900'} transition`}
                variants={navItemVariants}
                whileHover="hover"
              >
                Contact
              </motion.button>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/dashboard">
                  <Button 
                    className={`${theme === 'dark' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-amber-600 hover:bg-amber-700'} text-white px-4 py-2 rounded-full`}
                  >
                    Sign In
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        ref={heroRef} 
        className={`relative flex flex-col items-center justify-center min-h-screen w-full px-4 pt-28 md:pt-32 pb-12 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-amber-900' : 'bg-gradient-to-br from-yellow-50 via-amber-100 to-white'} overflow-hidden`}
        style={{ y: heroY, opacity: heroOpacity }}
      >
        {/* Soft background shape */}
        <motion.div 
          className={`absolute -top-32 -left-32 w-[500px] h-[500px] ${theme === 'dark' ? 'bg-amber-900' : 'bg-amber-100'} rounded-full opacity-30 blur-3xl z-0`}
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 10, 0]
          }}
          transition={{ 
            repeat: Infinity, 
            repeatType: "reverse", 
            duration: 15,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className={`absolute bottom-0 right-0 w-[400px] h-[400px] ${theme === 'dark' ? 'bg-amber-700' : 'bg-yellow-200'} rounded-full opacity-20 blur-2xl z-0`}
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, -10, 0]
          }}
          transition={{ 
            repeat: Infinity, 
            repeatType: "reverse", 
            duration: 20,
            ease: "easeInOut"
          }}
        />
        {/* Tagline */}
        <motion.span 
          className={`z-10 ${theme === 'dark' ? 'text-amber-400 bg-gray-800' : 'text-amber-600 bg-amber-50'} font-semibold text-lg md:text-xl mb-2 tracking-wide uppercase px-4 py-1 rounded-full shadow-sm`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Empowering Modern Beekeepers
        </motion.span>
        {/* Headline */}
        <motion.h1 
          className={`z-10 text-5xl md:text-7xl font-extrabold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'} text-center leading-tight ${theme === 'dark' ? 'drop-shadow-[0_8px_32px_rgba(251,191,36,0.2)]' : 'drop-shadow-[0_8px_32px_rgba(251,191,36,0.3)]'} mb-4`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Smart Nyuki
        </motion.h1>
        {/* Subheadline */}
        <motion.p 
          className={`z-10 text-xl md:text-2xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} text-center max-w-2xl mb-8 font-medium`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          The all-in-one platform for tracking, monitoring, and optimizing your apiaries, hives, and honey production.
        </motion.p>
        {/* CTA */}
        <motion.div 
          className="z-10 flex gap-4 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/dashboard">
              <Button size="lg" className={`${theme === 'dark' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-amber-600 hover:bg-amber-700'} text-white shadow-xl text-lg md:text-xl px-8 py-4 rounded-full font-bold transition-transform hover:scale-105 focus:ring-4 focus:ring-amber-200`}>
                Get Started
              </Button>
            </Link>
          </motion.div>
          <motion.button 
            onClick={() => scrollTo(featuresRef)} 
            className={`inline-flex items-center ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'} font-semibold hover:underline text-lg md:text-xl transition-transform hover:scale-105`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Learn More
          </motion.button>
        </motion.div>
        {/* Custom SVG Illustration */}
        <motion.div 
          className="z-10 w-full flex justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 1,
            duration: 0.8,
            type: "spring",
            stiffness: 100
          }}
        >
          <motion.svg 
            className="w-[320px] md:w-[420px] h-auto" 
            viewBox="0 0 420 320" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            animate={{ 
              y: [0, -10, 0],
            }}
            transition={{ 
              repeat: Infinity, 
              repeatType: "reverse", 
              duration: 3,
              ease: "easeInOut"
            }}
          >
            <ellipse cx="210" cy="260" rx="180" ry="40" fill="#fde68a" opacity="0.4" />
            <rect x="120" y="120" width="180" height="100" rx="30" fill="#fbbf24" stroke="#f59e42" strokeWidth="6" />
            <ellipse cx="210" cy="120" rx="60" ry="40" fill="#fffbe8" stroke="#fbbf24" strokeWidth="4" />
            <circle cx="210" cy="120" r="18" fill="#fbbf24" stroke="#f59e42" strokeWidth="3" />
            <rect x="180" y="200" width="60" height="30" rx="15" fill="#fffbe8" stroke="#fbbf24" strokeWidth="3" />
            {/* Bee */}
            <motion.g
              animate={{ 
                x: [0, 10, 0, -10, 0],
                y: [0, 5, 0, 5, 0],
              }}
              transition={{ 
                repeat: Infinity, 
                repeatType: "loop", 
                duration: 5,
                ease: "easeInOut"
              }}
            >
              <ellipse cx="210" cy="90" rx="18" ry="10" fill="#fff" stroke="#fbbf24" strokeWidth="3" />
              <ellipse cx="210" cy="90" rx="8" ry="5" fill="#fbbf24" />
              <ellipse cx="202" cy="88" rx="2.5" ry="2" fill="#222" />
              <ellipse cx="218" cy="88" rx="2.5" ry="2" fill="#222" />
              <rect x="206" y="95" width="8" height="4" rx="2" fill="#f59e42" />
              <rect x="208" y="99" width="4" height="8" rx="2" fill="#f59e42" />
            </motion.g>
          </motion.svg>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section ref={featuresRef} id="features" className={`w-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} py-20 px-4`}>
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            ref={featuresHeaderRef}
            className={`text-3xl md:text-4xl font-bold text-center ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'} mb-10`}
            variants={fadeInUp}
            initial="hidden"
            animate={featuresControls}
          >
            Features
          </motion.h2>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            animate={featuresControls}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={feature.title} 
                className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-amber-50'} rounded-xl shadow-md p-8 flex flex-col items-center text-center`}
                variants={featureCardVariants}
                whileHover="hover"
                custom={index}
                transition={{
                  delay: index * 0.1
                }}
              >
                <motion.span 
                  className="text-5xl mb-4"
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    repeatType: "reverse", 
                    duration: 2 + index * 0.5,
                    ease: "easeInOut"
                  }}
                >
                  {feature.icon}
                </motion.span>
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-800'} mb-2`}>{feature.title}</h3>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section ref={techRef} className={`w-full py-20 px-4 ${theme === 'dark' ? 'bg-gradient-to-r from-gray-800 to-amber-900/50' : 'bg-gradient-to-r from-amber-100 to-yellow-50'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            ref={techHeaderRef}
            className={`text-2xl md:text-3xl font-bold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'} mb-6`}
            variants={fadeInUp}
            initial="hidden"
            animate={techControls}
          >
            Built with Modern Technologies
          </motion.h2>
          <motion.div 
            className="flex flex-wrap justify-center gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate={techControls}
          >
            {techStack.map((tech, index) => (
              <motion.span 
                key={tech} 
                className={`${theme === 'dark' ? 'bg-gray-800 border-amber-800' : 'bg-white border-amber-200'} border rounded-full px-6 py-2 text-lg font-medium ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'} shadow-sm`}
                variants={techBadgeVariants}
                whileHover="hover"
                custom={index}
                transition={{
                  delay: index * 0.1
                }}
              >
                {tech}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section ref={aboutRef} className={`w-full py-20 px-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            ref={aboutHeaderRef}
            className={`text-3xl md:text-4xl font-bold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'} mb-6`}
            variants={fadeInUp}
            initial="hidden"
            animate={aboutControls}
          >
            About Smart Nyuki
          </motion.h2>
          <motion.p 
            className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-4`}
            variants={fadeInUp}
            initial="hidden"
            animate={aboutControls}
            transition={{ delay: 0.1 }}
          >
            Smart Nyuki is more than just a beekeeping app—it's a complete ecosystem designed to empower beekeepers of all experience levels. Our mission is to modernize beekeeping through technology, making it easier to monitor hive health, optimize honey production, and ensure the sustainability of bee populations.
          </motion.p>
          <motion.p 
            className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-4`}
            variants={fadeInUp}
            initial="hidden"
            animate={aboutControls}
            transition={{ delay: 0.2 }}
          >
            With real-time data, powerful analytics, and intuitive management tools, Smart Nyuki helps you make informed decisions, prevent losses, and maximize your apiary's potential. Whether you manage a single hive or a large operation, Smart Nyuki adapts to your needs.
          </motion.p>
          <motion.div 
            className="flex flex-col md:flex-row gap-6 justify-center mt-8"
            variants={staggerContainer}
            initial="hidden"
            animate={aboutControls}
            transition={{ delay: 0.3 }}
          >
            <motion.div 
              className={`flex-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-amber-50'} rounded-xl p-6 shadow text-left`}
              variants={featureCardVariants}
              whileHover="hover"
            >
              <h3 className={`font-bold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-800'} text-xl mb-2`}>Our Vision</h3>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>To be the leading digital platform for sustainable, data-driven beekeeping worldwide.</p>
            </motion.div>
            <motion.div 
              className={`flex-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-amber-50'} rounded-xl p-6 shadow text-left`}
              variants={featureCardVariants}
              whileHover="hover"
              transition={{ delay: 0.1 }}
            >
              <h3 className={`font-bold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-800'} text-xl mb-2`}>Our Values</h3>
              <ul className={`list-disc list-inside ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <li>Innovation in agriculture</li>
                <li>Empowering beekeepers</li>
                <li>Data-driven sustainability</li>
                <li>Community and collaboration</li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <motion.section 
        className="w-full py-20 px-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: false, amount: 0.3 }}
      >
        <motion.div 
          className={`max-w-2xl mx-auto ${theme === 'dark' ? 'bg-amber-700' : 'bg-amber-600'} rounded-2xl shadow-xl p-10 flex flex-col items-center text-center`}
          whileHover={{ 
            boxShadow: `0 25px 50px -12px ${theme === 'dark' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.4)'}`,
            y: -5
          }}
          transition={{ duration: 0.3 }}
        >
          <motion.h2 
            className="text-3xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            viewport={{ once: false, amount: 0.8 }}
          >
            Ready to transform your beekeeping?
          </motion.h2>
          <motion.p 
            className="text-lg text-amber-100 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            viewport={{ once: false, amount: 0.8 }}
          >
            Join Smart Nyuki and take your apiary management to the next level with real-time insights, powerful analytics, and seamless tracking.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            viewport={{ once: false, amount: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/dashboard">
              <Button size="lg" className={`${theme === 'dark' ? 'bg-gray-900 text-amber-400 hover:bg-gray-800' : 'bg-white text-amber-600 hover:bg-amber-50'} text-lg px-8 py-6 rounded-full font-bold shadow-lg`}>
                Start Free Trial
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Contact Section */}
      <motion.section 
        ref={contactRef} 
        className={`w-full py-20 px-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: false, amount: 0.3 }}
      >
        <div className="max-w-3xl mx-auto">
          <motion.h2 
            className={`text-3xl md:text-4xl font-bold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'} mb-6 text-center`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            viewport={{ once: false, amount: 0.8 }}
          >
            Contact Us
          </motion.h2>
          <motion.form 
            className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-amber-50'} rounded-xl shadow-md p-8 flex flex-col gap-4`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            viewport={{ once: false, amount: 0.8 }}
            whileHover={{ 
              boxShadow: `0 15px 30px -10px ${theme === 'dark' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.2)'}`,
              y: -3
            }}
          >
            <div className="flex flex-col md:flex-row gap-4">
              <motion.input 
                type="text" 
                placeholder="Your Name" 
                className={`flex-1 px-4 py-3 rounded border ${theme === 'dark' ? 'bg-gray-700 border-amber-800 text-white placeholder:text-gray-400' : 'border-amber-200 focus:ring-amber-400'} focus:outline-none focus:ring-2`} 
                required 
                whileFocus={{ scale: 1.01, borderColor: theme === 'dark' ? "#f59e0b" : "#f59e0b" }}
                transition={{ duration: 0.2 }}
              />
              <motion.input 
                type="email" 
                placeholder="Your Email" 
                className={`flex-1 px-4 py-3 rounded border ${theme === 'dark' ? 'bg-gray-700 border-amber-800 text-white placeholder:text-gray-400' : 'border-amber-200 focus:ring-amber-400'} focus:outline-none focus:ring-2`} 
                required 
                whileFocus={{ scale: 1.01, borderColor: theme === 'dark' ? "#f59e0b" : "#f59e0b" }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <motion.textarea 
              placeholder="Your Message" 
              rows={4} 
              className={`px-4 py-3 rounded border ${theme === 'dark' ? 'bg-gray-700 border-amber-800 text-white placeholder:text-gray-400' : 'border-amber-200 focus:ring-amber-400'} focus:outline-none focus:ring-2`} 
              required 
              whileFocus={{ scale: 1.01, borderColor: theme === 'dark' ? "#f59e0b" : "#f59e0b" }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              className="self-end"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                type="submit" 
                className={`${theme === 'dark' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-600 hover:bg-amber-700'} text-white font-semibold px-8 py-3 rounded-full`}
              >
                Send Message
              </Button>
            </motion.div>
          </motion.form>
          <motion.div 
            className={`text-center mt-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            viewport={{ once: false, amount: 0.8 }}
          >
            <p>Email: <motion.a 
              href="mailto:james.nyakairu@students.jkuat.ac.ke" 
              className={`underline ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`}
              whileHover={{ color: theme === 'dark' ? "#fcd34d" : "#92400e" }}
              >james.nyakairu@students.jkuat.ac.ke</motion.a></p>
            <p className="mt-2">&copy; {new Date().getFullYear()} James-CodeX. All rights reserved.</p>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}