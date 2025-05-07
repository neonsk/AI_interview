import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Headset, Clock, Target, Brain, ArrowRight, PlayCircle, BarChart as ChartBar, UserCircle } from 'lucide-react';
import Button from '../components/Button';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" }
};

const staggerChildren = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: "-100px" },
};

const staggerItems = {
  initial: { opacity: 0, x: -20 },
  whileInView: { opacity: 1, x: 0 },
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const heroImage = "https://images.pexels.com/photos/5669619/pexels-photo-5669619.jpeg?auto=compress&cs=tinysrgb&w=1920";
  const [showFloatingButton, setShowFloatingButton] = useState(false);

  const startInterview = () => {
    navigate('/settings');
  };

  useEffect(() => {
    const handleScroll = () => {
      const heroButton = document.getElementById('hero-button');
      if (heroButton) {
        const rect = heroButton.getBoundingClientRect();
        setShowFloatingButton(rect.bottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div>
      <div className="relative h-[600px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/50" />
        
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-full flex items-center">
            <motion.div 
              className="max-w-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                {t('home.hero.title')}
              </h1>
              <p className="text-xl text-gray-200 mb-8 max-w-xl">
                {t('home.hero.subtitle')}
              </p>
              <div className="flex space-x-4">
                <Button
                  id="hero-button"
                  onClick={startInterview} 
                  variant="primary"
                  size="large"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="px-8 bg-blue-500 hover:bg-blue-600"
                >
                  {t('common.startPractice')}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {showFloatingButton && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={startInterview}
              variant="primary"
              size="large"
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="shadow-lg hover:shadow-xl bg-blue-500 hover:bg-blue-600"
            >
              {t('common.startPractice')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" {...fadeInUp}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.features.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('home.features.subtitle')}
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerChildren}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={staggerItems} custom={0} transition={{ delay: 0.1 }}>
              <FeatureCard 
                icon={<Clock className="w-6 h-6 text-blue-600" />}
                title={t('home.features.anytime.title')}
                description={t('home.features.anytime.description')}
              />
            </motion.div>
            <motion.div variants={staggerItems} custom={1} transition={{ delay: 0.2 }}>
              <FeatureCard 
                icon={<Target className="w-6 h-6 text-green-600" />}
                title={t('home.features.evaluation.title')}
                description={t('home.features.evaluation.description')}
              />
            </motion.div>
            <motion.div variants={staggerItems} custom={2} transition={{ delay: 0.3 }}>
              <FeatureCard 
                icon={<Brain className="w-6 h-6 text-purple-600" />}
                title={t('home.features.personalized.title')}
                description={t('home.features.personalized.description')}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Learning Method Section */}
      <div className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-12" {...fadeInUp}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.learning.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('home.learning.subtitle')}
            </p>
          </motion.div>
          
          <motion.div 
            className="max-w-4xl mx-auto space-y-12"
            variants={staggerChildren}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={staggerItems} custom={0} transition={{ delay: 0.1 }}>
              <LearningStepCard
                icon={<PlayCircle className="w-8 h-8 text-blue-600" />}
                step="1"
                title={t('home.learning.step1.title')}
                description={t('home.learning.step1.description')}
                imageUrl="https://images.pexels.com/photos/7516363/pexels-photo-7516363.jpeg?auto=compress&cs=tinysrgb&w=1280"
              />
            </motion.div>
            <motion.div variants={staggerItems} custom={1} transition={{ delay: 0.2 }}>
              <LearningStepCard
                icon={<ChartBar className="w-8 h-8 text-green-600" />}
                step="2"
                title={t('home.learning.step2.title')}
                description={t('home.learning.step2.description')}
                imageUrl="https://images.pexels.com/photos/7681091/pexels-photo-7681091.jpeg?auto=compress&cs=tinysrgb&w=1280"
              />
            </motion.div>
            <motion.div variants={staggerItems} custom={2} transition={{ delay: 0.3 }}>
              <LearningStepCard
                icon={<UserCircle className="w-8 h-8 text-purple-600" />}
                step="3"
                title={t('home.learning.step3.title')}
                description={t('home.learning.step3.description')}
                imageUrl="https://images.pexels.com/photos/7606074/pexels-photo-7606074.jpeg?auto=compress&cs=tinysrgb&w=1280"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const LearningStepCard: React.FC<{
  icon: React.ReactNode;
  step: string;
  title: string;
  description: string;
  imageUrl: string;
}> = ({
  icon,
  step,
  title,
  description,
  imageUrl
}) => {
  return (
    <div className="flex items-center gap-8 relative pl-12">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
        {step}
      </div>
      <div className="flex-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/2">
            <div className="h-48 rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="mb-4">
              {icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{ 
  icon: React.ReactNode;
  title: string; 
  description: string;
}> = ({ 
  icon,
  title, 
  description 
}) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-transform hover:scale-105">
      <div className="mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default HomePage;