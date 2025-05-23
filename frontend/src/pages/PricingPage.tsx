import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import PreorderForm from '../components/PreorderForm';
import { logToFile } from '../utils/logger';

const PricingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentLang = i18n.language;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'Plus' | 'Pro'>('Plus');

  React.useEffect(() => {
    window.scrollTo(0, 0);
    logToFile('page_view', { page: 'PricingPage' });
  }, []);

  const handleOpenForm = (plan: 'Plus' | 'Pro') => {
    logToFile('click_preorder_button', { page: 'PricingPage', plan });
    setSelectedPlan(plan);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <Button
            variant="outline"
            size="small"
            onClick={() => navigate('/feedback')}
            leftIcon={<ArrowLeft size={18} />}
          >
            {currentLang === 'ja' ? 'フィードバックに戻る' : 'Back to Feedback'}
          </Button>
        </div>

        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            {currentLang === 'ja' ? '料金プラン' : 'Subscription Plans'}
          </motion.h1>
        </div>
        
        <div className="text-center mb-12">
          <p
            className="text-lg text-gray-700 bg-blue-50 border border-blue-100 rounded-lg px-6 py-4 inline-block"
          >
            {t('feedback.pricingNotice')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-8">
              <div className="mb-6">
                <span className="text-2xl font-bold text-gray-800">Free</span>
              </div>
              <div className="flex items-end mb-2">
                <span className="text-5xl font-bold text-gray-900">$0</span>
                <span className="text-lg text-gray-700 ml-2">{currentLang === 'ja' ? '/月' : '/mo'}</span>
              </div>
              <div className="h-4 mb-2" />
              <ul className="space-y-4">
                <PricingItem 
                  text={currentLang === 'ja' ? '経歴・職種設定' : 'Background & position settings'}
                  included={true}
                />
                <PricingItem 
                  text={currentLang === 'ja' ? '面接時間3分まで' : 'Up to 3 minutes interview'}
                  included={true}
                />
                <PricingItem 
                  text={currentLang === 'ja' ? 'QAフィードバック2問分' : '2 Q&A feedback session'}
                  included={true}
                />
                <PricingItem 
                  text={currentLang === 'ja' ? '過去QA履歴による質問精度向上' : 'Question improvement from history'}
                  included={false}
                />
                <PricingItem 
                  text={currentLang === 'ja' ? 'AIアバター面接' : 'AI avatar interview'}
                  included={false}
                />
              </ul>
            </div>
          </motion.div>

          {/* Lite Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-8">
              <div className="mb-6">
                <span className="text-2xl font-bold text-gray-800">Lite</span>
              </div>
              <div className="flex items-end mb-2">
                <span className="text-5xl font-bold text-gray-900">$9</span>
                <span className="text-lg text-gray-700 ml-2">{currentLang === 'ja' ? '/月' : '/mo'}</span>
              </div>
              <div className="h-4 mb-2" />
              <ul className="space-y-4">
                <PricingItem 
                  text={currentLang === 'ja' ? '経歴・職種設定' : 'Background & position settings'}
                  included={true}
                />
                <PricingItem 
                  text={currentLang === 'ja' ? '面接時間30分まで' : 'Up to 30 minutes interview'}
                  included={true}
                />
                <PricingItem 
                  text={currentLang === 'ja' ? 'QAフィードバック無制限' : 'Unlimited Q&A feedback'}
                  included={true}
                />
                <PricingItem 
                  text={currentLang === 'ja' ? '過去QA履歴による質問精度向上' : 'Question improvement from history'}
                  included={true}
                />
                <PricingItem 
                  text={currentLang === 'ja' ? 'AIアバター面接' : 'AI avatar interview'}
                  included={false}
                />
                <p className="text-gray-500">
                  <span className="w-2 inline-block"></span>
                   {currentLang === 'ja' ? '(今後機能拡充予定)' : '(Feature Expansion Planned)'}
                </p>
              </ul>
            </div>
            <div className="px-8 pb-8">
              <Button
                variant="primary"
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={() => handleOpenForm('Plus')}
              >
                {currentLang === 'ja' ? '先行予約' : 'Pre-order'}
              </Button>
            </div>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-8">
              <div className="mb-6">
                <span className="text-2xl font-bold text-gray-800">Pro</span>
              </div>
              <div className="flex items-end mb-2">
                <span className="text-5xl font-bold text-gray-900">$19</span>
                <span className="text-lg text-gray-700 ml-2">{currentLang === 'ja' ? '/月' : '/mo'}</span>
              </div>
              <div className="h-4 mb-2" />
              <ul className="space-y-4">
                <PricingItem 
                  text={currentLang === 'ja' ? '経歴・職種設定' : 'Background & position settings'}
                  included={true}
                />
                <PricingItem 
                  text={currentLang === 'ja' ? '面接時間30分まで' : 'Up to 30 minutes interview'}
                  included={true}
                />
                <PricingItem 
                  text={currentLang === 'ja' ? 'QAフィードバック無制限' : 'Unlimited Q&A feedback'}
                  included={true}
                />
                <PricingItem 
                  text={currentLang === 'ja' ? '過去QA履歴による質問精度向上' : 'Question improvement from history'}
                  included={true}
                />
                <PricingItem 
                  text={currentLang === 'ja' ? 'AIアバター面接' : 'AI avatar interview'}
                  included={true}
                />
                <p className="text-gray-500">
                  <span className="w-2 inline-block"></span>
                   {currentLang === 'ja' ? '(今後機能拡充予定)' : '(Feature Expansion Planned)'}
                </p>
              </ul>
            </div>
            <div className="px-8 pb-8">
              <Button
                variant="primary"
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={() => handleOpenForm('Pro')}
              >
                {currentLang === 'ja' ? '先行予約' : 'Pre-order'}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <PreorderForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        selectedPlan={selectedPlan}
      />
    </div>
  );
};

const PricingItem: React.FC<{ text: string; included: boolean }> = ({ text, included }) => (
  <li className="flex items-start">
    {included ? (
      <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
    ) : (
      <X className="w-5 h-5 text-gray-300 mt-0.5 mr-3 flex-shrink-0" />
    )}
    <span className={included ? 'text-gray-700' : 'text-gray-500'}>{text}</span>
  </li>
);

export default PricingPage;