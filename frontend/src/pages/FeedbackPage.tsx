import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Lock, HelpCircle } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useInterview, FeedbackData } from '../context/InterviewContext';
import Button from '../components/Button';
import { interviewApi } from '../services/api';
import { feedbackConfig } from '../config/interview';

const FeedbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { feedback, messages, updateFeedback } = useInterview();
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary');
  const [initialized, setInitialized] = useState(false);
  const apiCallsInProgress = useRef({
    evaluation: false,
    detailedFeedback: false
  });

  // 評価APIを呼び出す条件を判定する関数
  const shouldFetchEvaluation = () => {
    if (!feedback || !messages.length) return false;
    
    return (
      messages.length > 0 && 
      !feedback.evaluation && 
      !feedback.isEvaluating && 
      !apiCallsInProgress.current.evaluation
    );
  };
  
  // 詳細フィードバックAPIを呼び出す条件を判定する関数
  const shouldFetchDetailedFeedback = () => {
    if (!feedback || !feedback.detailedFeedback?.length) return false;
    
    return (
      feedback.detailedFeedback.length > 0 && 
      !feedback.isLoadingDetailedFeedback && 
      (!feedback.detailedFeedback[0].englishFeedback || 
       !feedback.detailedFeedback[0].interviewFeedback || 
       !feedback.detailedFeedback[0].idealAnswer) && 
      !apiCallsInProgress.current.detailedFeedback
    );
  };
  
  // 評価APIを実行する関数
  const executeEvaluationApi = async () => {
    if (!shouldFetchEvaluation()) return;
    
    apiCallsInProgress.current.evaluation = true;
    try {
      await fetchEvaluation();
    } finally {
      apiCallsInProgress.current.evaluation = false;
    }
  };
  
  // 詳細フィードバックAPIを実行する関数
  const executeDetailedFeedbackApi = async () => {
    if (!shouldFetchDetailedFeedback()) return;
    
    apiCallsInProgress.current.detailedFeedback = true;
    try {
      await fetchDetailedFeedback();
    } finally {
      apiCallsInProgress.current.detailedFeedback = false;
    }
  };

  // 初期化処理を行う関数
  const initializeFeedbackData = async () => {
    if (!feedback) return;
    
    // 初期化済みフラグを設定
    setInitialized(true);
    
    // 両方のAPIを必要に応じて呼び出し
    await Promise.all([
      executeEvaluationApi(),
      executeDetailedFeedbackApi()
    ]);
  };

  // 結果画面遷移時に実行される初期化処理（コンポーネントマウント時に1回だけ実行）
  useEffect(() => {
    if (!feedback) {
      navigate('/');
      return;
    }
    
    if (initialized) return;
    
    initializeFeedbackData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 依存配列を空にして初回マウント時のみ実行

  // タブ切り替え時のAPIリクエスト処理
  useEffect(() => {
    if (!feedback || !initialized) return;
    
    const handleTabChange = async () => {
      if (activeTab === 'summary') {
        await executeEvaluationApi();
      } else if (activeTab === 'details') {
        await executeDetailedFeedbackApi();
      }
    };
    
    handleTabChange();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, initialized]);

  // feedback または messages が変更された場合に、再初期化が必要かチェック
  useEffect(() => {
    if (!initialized || !feedback) return;
    
    // 状態が変わった場合に必要に応じてAPIを呼び出す
    const checkAndFetchData = async () => {
      await Promise.all([
        executeEvaluationApi(),
        executeDetailedFeedbackApi()
      ]);
    };
    
    checkAndFetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback, messages, initialized]);

  const fetchEvaluation = async () => {
    if (!messages.length) {
      console.error('メッセージが空のため評価できません');
      return;
    }
    
    try {
      console.log('fetchEvaluation開始');
      
      // 評価中フラグをセット
      updateFeedback({ isEvaluating: true });
      
      // 現在の言語設定を取得
      const currentLanguage = i18n.language;
      
      // メッセージを評価APIに送信
      const messageHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // APIリクエスト送信
      console.log('evaluateInterview APIリクエスト送信');
      const evaluation = await interviewApi.evaluateInterview(messageHistory, currentLanguage);
      console.log('evaluateInterview APIレスポンス受信', evaluation);
      
      // 評価結果を保存
      updateFeedback({ 
        evaluation,
        isEvaluating: false 
      });
      
      console.log('評価結果保存完了');
    } catch (error) {
      console.error('評価取得エラー:', error);
      updateFeedback({ isEvaluating: false });
    }
  };

  const fetchDetailedFeedback = async () => {
    console.log('fetchDetailedFeedback start');
    try {
      // feedbackがnullの場合は処理をスキップ
      if (!feedback) return;

      // フィードバック取得中フラグをセット
      updateFeedback({ isLoadingDetailedFeedback: true });
      
      // 現在の言語設定を取得
      const currentLanguage = i18n.language;
      
      // QAリストの準備
      const qaList = feedback.detailedFeedback.map(item => ({
        question: item.question,
        answer: item.answer
      }));
      
      // フィードバック取得API呼び出し（設定ファイルの値を使用）
      const detailedFeedbackResponse = await interviewApi.getDetailedFeedback(
        qaList,
        feedbackConfig.freeDetailedFeedbackCount,
        currentLanguage
      );

      // 取得したフィードバックを既存のdetailedFeedbackにマージ
      const updatedDetailedFeedback = feedback.detailedFeedback.map((item, index) => {
        const newFeedback = detailedFeedbackResponse.feedbacks[index];
        if (newFeedback) {
          return {
            ...item,
            englishFeedback: newFeedback.englishFeedback,
            interviewFeedback: newFeedback.interviewFeedback,
            idealAnswer: newFeedback.idealAnswer
          };
        }
        return item;
      });
      
      // フィードバック更新
      updateFeedback({ 
        detailedFeedback: updatedDetailedFeedback,
        isLoadingDetailedFeedback: false 
      });
    } catch (error) {
      console.error('詳細フィードバック取得エラー:', error);
      updateFeedback({ isLoadingDetailedFeedback: false });
    }
  };

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

  // 評価中の場合はローディング表示
  if (feedback.isEvaluating) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700">{t('feedback.evaluating')}</p>
        <p className="text-sm text-gray-500 mt-2">{t('feedback.evaluatingDescription')}</p>
      </div>
    );
  }

  // 新しい評価APIのデータがある場合
  if (feedback.evaluation) {
    const { englishSkill, interviewSkill, summary } = feedback.evaluation;
    
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t('feedback.performance.english')}</h2>
              <div className="flex items-center gap-3">
                {renderStars(englishSkill.overall)}
                <span className="text-2xl font-bold text-blue-600">{englishSkill.overall.toFixed(1)}</span>
              </div>
            </div>
            <div className="space-y-4">
              <ScoreBreakdown
                title={t('feedback.performance.vocabulary.title')}
                tooltip={t('feedback.performance.vocabulary.description')}
                score={englishSkill.vocabulary}
                color="blue"
              />
              <ScoreBreakdown
                title={t('feedback.performance.grammar.title')}
                tooltip={t('feedback.performance.grammar.description')}
                score={englishSkill.grammar}
                color="blue"
              />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t('feedback.performance.interview')}</h2>
              <div className="flex items-center gap-3">
                {renderStars(interviewSkill.overall)}
                <span className="text-2xl font-bold text-green-600">{interviewSkill.overall.toFixed(1)}</span>
              </div>
            </div>
            <div className="space-y-4">
              <ScoreBreakdown
                title={t('feedback.performance.structure.title')}
                tooltip={t('feedback.performance.structure.description')}
                score={interviewSkill.logicalStructure}
                color="green"
              />
              <ScoreBreakdown
                title={t('feedback.performance.logic.title')}
                tooltip={t('feedback.performance.logic.description')}
                score={interviewSkill.dataSupport}
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
            items={summary.strengths.split('\n').filter(line => line.trim().length > 0)}
            icon="+"
            color="green"
          />
          <FeedbackSection
            title={t('feedback.improvements')}
            items={summary.improvements.split('\n').filter(line => line.trim().length > 0)}
            icon="△"
            color="orange"
          />
          <FeedbackSection
            title={t('feedback.actionItems')}
            items={summary.actions.split('\n').filter(line => line.trim().length > 0)}
            icon="→"
            color="blue"
          />
        </div>
      </div>
    );
  }

  // 旧データ形式を使用
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

const DetailsTab: React.FC<{ feedback: FeedbackData }> = ({ feedback }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { updateFeedback } = useInterview();
  
  // ローディング中または各QAの評価データが空の場合のローディング表示
  if (feedback.isLoadingDetailedFeedback || (feedback.detailedFeedback?.length > 0 && 
      !feedback.detailedFeedback[0].englishFeedback)) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700">{t('feedback.evaluatingDetailed')}</p>
        <p className="text-sm text-gray-500 mt-2">{t('feedback.evaluatingDetailedDescription')}</p>
      </div>
    );
  }

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
            {index < feedbackConfig.freeDetailedFeedbackCount && item.englishFeedback ? (
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
                      <p className="text-gray-700">{item.englishFeedback || t('feedback.evaluatingDetailed')}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-green-800 mb-2">{t('feedback.interviewFeedback')}</h4>
                      <p className="text-gray-700">{item.interviewFeedback || t('feedback.evaluatingDetailed')}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{t('feedback.idealAnswer')}</h4>
                    <p className="text-gray-700 italic">{item.idealAnswer || t('feedback.evaluatingDetailed')}</p>
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