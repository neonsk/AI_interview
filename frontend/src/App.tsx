import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import HomePage from './pages/HomePage';
import InterviewPage from './pages/InterviewPage';
import InterviewSettingsPage from './pages/InterviewSettingsPage';
import FeedbackPage from './pages/FeedbackPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import PricingPage from './pages/PricingPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { InterviewProvider } from './context/InterviewContext';
import PageTransition from './components/PageTransition';
import { AudioStopperProvider } from './context/AudioStopperContext';
import AudioStopper from './components/AudioStopper';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition>
            <HomePage />
          </PageTransition>
        } />
        <Route path="/settings" element={
          <PageTransition>
            <InterviewSettingsPage />
          </PageTransition>
        } />
        <Route path="/interview" element={
          <PageTransition>
            <InterviewPage />
          </PageTransition>
        } />
        <Route path="/feedback" element={
          <PageTransition>
            <FeedbackPage />
          </PageTransition>
        } />
        <Route path="/privacy-policy" element={
          <PageTransition>
            <PrivacyPolicyPage />
          </PageTransition>
        } />
        <Route path="/pricing" element={
          <PageTransition>
            <PricingPage />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AudioStopperProvider>
      <InterviewProvider>
        <Router>
          <AudioStopper />
          <div className="min-h-screen flex flex-col pt-16">
            <Navbar />
            <main className="flex-1 flex flex-col">
              <AnimatedRoutes />
            </main>
            {location.pathname !== '/interview' && location.pathname !== '/settings' && (
              <Footer />
            )}
          </div>
        </Router>
      </InterviewProvider>
    </AudioStopperProvider>
  );
}

export default App;