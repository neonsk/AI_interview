import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Lock, HelpCircle } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useInterview, FeedbackData } from '../context/InterviewContext';
import Button from '../components/Button';

const FeedbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { feedback } = useInterview();
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary');

  useEffect(() => {
    if (!feedback) {
      navigate('/');
    }
  }, [feedback, navigate]);

  if (!feedback) {
    return null;
  }

  const hasUserResponses = feedback.detailedFeedback?.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('feedback.title')}</h1>
        <div>
          <Button
            variant="outline"
            size="small"
            className="sm:size-medium whitespace-nowrap ml-auto"
            onClick={() => navigate('/settings')}
            leftIcon={<ArrowLeft size={18} />}
          >
            {t('feedback.practiceAgain')}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="flex border-b">
          <button
            className={`py-4 px-8 text-base font-medium flex-1 ${
              activeTab === 'summary'
                ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                : 'bg-gray-50 text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('summary')}
          >
            {t('feedback.tabs.summary')}
          </button>
          <button
            className={`py-4 px-8 text-base font-medium flex-1 ${
              activeTab === 'details'
                ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                : 'bg-gray-50 text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('details')}
          >
            {t('feedback.tabs.details')}
          </button>
        </div>

        <div className="p-6">
          {hasUserResponses ? (
            activeTab === 'summary' ? (
              <SummaryTab feedback={feedback} navigate={navigate} />
            ) : (
              <DetailsTab feedback={feedback} />
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t('feedback.noData')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const renderStars = (score: number) => {
  const stars = [];
  const fullStars = Math.floor(score);
  const hasHalfStar = score % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    } else if (i === fullStars && hasHalfStar) {
      stars.push(
        <div key={i} className="relative w-5 h-5">
          <svg className="w-5 h-5 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <div className="absolute inset-0 overflow-hidden w-[50%]">
            <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
      );
    } else {
      stars.push(
        <svg key={i} className="w-5 h-5 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
  }

  return <div className="flex space-x-1">{stars}</div>;
};

const SummaryTab: React.FC<{ feedback: FeedbackData; navigate: (path: string) => void }> = ({ feedback, navigate }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('feedback.performance.english')}</h2>
            <div className="flex items-center gap-3">
              {renderStars(feedback.englishScore.pronunciation)}
              <span className="text-2xl font-bold text-blue-600">{feedback.englishScore.pronunciation.toFixed(1)}</span>
            </div>
          </div>
          <div className="space-y-4">
            <ScoreBreakdown
              title={t('feedback.performance.vocabulary.title')}
              tooltip={t('feedback.performance.vocabulary.description')}
              score={feedback.englishScore.vocabulary}
              color="blue"
            />
            <ScoreBreakdown
              title={t('feedback.performance.grammar.title')}
              tooltip={t('feedback.performance.grammar.description')}
              score={feedback.englishScore.grammar}
              color="blue"
            />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('feedback.performance.interview')}</h2>
            <div className="flex items-center gap-3">
              {renderStars(feedback.interviewScore.structure)}
              <span className="text-2xl font-bold text-green-600">{feedback.interviewScore.structure.toFixed(1)}</span>
            </div>
          </div>
          <div className="space-y-4">
            <ScoreBreakdown
              title={t('feedback.performance.structure.title')}
              tooltip={t('feedback.performance.structure.description')}
              score={feedback.interviewScore.structure}
              color="green"
            />
            <ScoreBreakdown
              title={t('feedback.performance.logic.title')}
              tooltip={t('feedback.performance.logic.description')}
              score={feedback.interviewScore.logic}
              color="green"
            />
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-xl mx-auto px-4 py-4">
          <Button
            variant="primary"
            size="medium"
            onClick={() => navigate('/pricing')}
            className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-200"
          >
            <div className="flex flex-col items-center">
              <span>{t('feedback.viewPricingPlans')}</span>
              <span className="text-sm text-blue-100">{t('feedback.extendedInterviewNotice')}</span>
            </div>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeedbackSection
          title={t('feedback.strengths')}
          items={feedback.strengths}
          icon="+"
          color="green"
        />
        <FeedbackSection
          title={t('feedback.improvements')}
          items={feedback.improvements}
          icon="△"
          color="orange"
        />
        <FeedbackSection
          title={t('feedback.actionItems')}
          items={feedback.nextSteps}
          icon="→"
          color="blue"
        />
      </div>
    </div>
  );
};

const ScoreBreakdown: React.FC<{
  title: string;
  tooltip?: string;
  score: number;
  color: 'blue' | 'green';
}> = ({ title, tooltip, score, color }) => {
  const percentage = (score / 5) * 100;
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600'
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <span className="text-base font-semibold text-gray-800">{title}</span>
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                  <HelpCircle size={16} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-xs"
                  sideOffset={5}
                >
                  {tooltip}
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>
        <span className="text-sm font-medium text-gray-900">{score.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const FeedbackSection: React.FC<{
  title: string;
  items: string[];
  icon: string;
  color: 'green' | 'orange' | 'blue';
}> = ({ title, items, icon, color }) => {
  const colorClasses = {
    green: 'bg-green-50 border-green-100 text-green-600',
    orange: 'bg-orange-50 border-orange-100 text-orange-600',
    blue: 'bg-blue-50 border-blue-100 text-blue-600'
  };
  
  return (
    <div className={`rounded-xl p-6 ${colorClasses[color]} bg-opacity-50 border`}>
      <h3 className="font-semibold mb-4">{title}</h3>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-gray-700">
            <span className="mt-1">{icon}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const PerformanceCard: React.FC<{
  title: string;
  score: number;
  strengths: string[];
  improvements: string[];
  actionItems: string[];
}> = ({ title, score, strengths, improvements, actionItems }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <div className="flex items-center space-x-2">
            {renderStars(score)}
            <span className="text-lg font-semibold text-gray-900">{score.toFixed(1)}/5.0</span>
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-green-600 font-semibold mb-3">{t('feedback.strengths')}</h3>
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">+</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-orange-600 font-semibold mb-3">{t('feedback.improvements')}</h3>
            <ul className="space-y-2">
              {improvements.map((improvement, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-orange-500 mr-2">△</span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-blue-600 font-semibold mb-3">{t('feedback.actionItems')}</h3>
            <ul className="space-y-2">
              {actionItems.map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

const DetailsTab: React.FC<{ feedback: FeedbackData }> = ({ feedback }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 divide-y divide-gray-200">
      {feedback.detailedFeedback && feedback.detailedFeedback.length > 0 ? (
        feedback.detailedFeedback.map((item, index) => (
          <div key={index} className="pt-8 first:pt-0 pb-16">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900">{t('feedback.question', { number: index + 1 })}</h3>
              <p className="text-gray-700 mt-2">{item.question}</p>
            </div>            
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">{t('feedback.yourAnswer')}</h4>
              <p className="text-gray-700 p-4 bg-gray-50 rounded-lg">{item.answer}</p>
            </div>
            {index === 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">{t('feedback.englishFeedback')}</h4>
                    <p className="text-gray-700">{item.englishFeedback}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-green-800 mb-2">{t('feedback.interviewFeedback')}</h4>
                    <p className="text-gray-700">{item.interviewFeedback}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{t('feedback.idealAnswer')}</h4>
                  <p className="text-gray-700 italic">{item.idealAnswer}</p>
                </div>
              </>
            ) : (
              <div className="relative">
                <div className="filter blur-sm pointer-events-none">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-blue-800 mb-2">{t('feedback.englishFeedback')}</h4>
                      <p className="text-gray-700">{item.englishFeedback}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-green-800 mb-2">{t('feedback.interviewFeedback')}</h4>
                      <p className="text-gray-700">{item.interviewFeedback}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{t('feedback.idealAnswer')}</h4>
                    <p className="text-gray-700 italic">{item.idealAnswer}</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10">
                  <div className="text-center">
                    <p className="text-white text-lg mb-4">{t('feedback.premiumFeatureNotice')}</p>
                    <div className="flex justify-center px-4">
                      <Button
                        variant="primary"
                        onClick={() => navigate('/pricing')}
                        className="w-full max-w-sm bg-blue-500 hover:bg-blue-600 transition-all duration-200"
                      >
                        {t('feedback.viewPricingPlans')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">{t('feedback.noData')}</div>
      )}
    </div>
  );
};

export default FeedbackPage;