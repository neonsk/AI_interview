import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, UserCircle } from 'lucide-react';
import Button from '../components/Button';

const InterviewSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'general' | 'personalized'>('general');
  const [background, setBackground] = useState('');
  const [position, setPosition] = useState('');

  const handleStartInterview = () => {
    if (mode === 'personalized' && (!background.trim() || !position.trim())) {
      return;
    }
    navigate('/interview');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {t('settings.title')}
          </h1>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-4 block">
                {t('settings.mode.label')}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('general')}
                  className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                    mode === 'general'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className={`w-6 h-6 ${
                    mode === 'general' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <span className={`mt-2 font-medium ${
                    mode === 'general' ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {t('settings.mode.general')}
                  </span>
                </button>

                <button
                  onClick={() => setMode('personalized')}
                  className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                    mode === 'personalized'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <UserCircle className={`w-6 h-6 ${
                    mode === 'personalized' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <span className={`mt-2 font-medium ${
                    mode === 'personalized' ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {t('settings.mode.personalized')}
                  </span>
                </button>
              </div>
            </div>

            <div className="h-px bg-gray-200" />

            {mode === 'general' ? (
              <div className="py-4">
                <p className="text-gray-600">
                  {t('settings.mode.generalDescription')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="background" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('settings.background.label')}
                  </label>
                  <textarea
                    id="background"
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-4"
                    placeholder={t('settings.background.placeholder')}
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('settings.position.label')}
                  </label>
                  <textarea
                    id="position"
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-4"
                    placeholder={t('settings.position.placeholder')}
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="pt-6">
              <Button
                variant="primary"
                onClick={handleStartInterview}
                className="w-full"
                disabled={mode === 'personalized' && (!background.trim() || !position.trim())}
              >
                {t('settings.startButton')}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InterviewSettingsPage;