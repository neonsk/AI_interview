import React, { useState, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { logToFile } from '../utils/logger';

interface PreorderFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan?: 'Plus' | 'Pro';
}

const PreorderForm: React.FC<PreorderFormProps> = ({
  isOpen,
  onClose,
  selectedPlan = 'Plus',
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

  if (!isOpen) return null;

  // メールアドレスが有効かどうかを確認する関数
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (!emailTouched) setEmailTouched(true);
  };

  // メールフィードバック状態の計算
  const getEmailStatus = () => {
    if (!emailTouched || email === '') return null;
    return isValidEmail(email) ? 'valid' : 'invalid';
  };

  const emailStatus = getEmailStatus();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    logToFile('submit_preorder_form', { page: 'PricingPage', plan: selectedPlan });
    setSubmitting(true);
    setError(null);

    // メールアドレスチェックを再度行い、無効な場合は送信しない
    if (!isValidEmail(email)) {
      setError(currentLang === 'ja' 
        ? '有効なメールアドレスを入力してください' 
        : 'Please enter a valid email address');
      setSubmitting(false);
      return;
    }

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      
      const response = await fetch('https://formspree.io/f/mdkgbgpq', {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });
      
      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        const errorMsg = currentLang === 'ja' 
          ? 'エラーが発生しました。後でもう一度お試しください。' 
          : 'An error occurred. Please try again later.';
        setError(data.error || errorMsg);
      }
    } catch (err) {
      setError(currentLang === 'ja' 
        ? 'エラーが発生しました。後でもう一度お試しください。' 
        : 'An error occurred. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={24} />
        </button>
        
        {submitted ? (
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {currentLang === 'ja' ? 'ありがとうございます！' : 'Thank you!'}
            </h3>
            <p className="text-gray-600 mb-6">
              {currentLang === 'ja' 
                ? 'ご予約を受け付けました。リリース前に詳細情報をお送りします。' 
                : 'Your pre-order has been received. We will contact you with more details before launch.'}
            </p>
            <Button variant="primary" onClick={onClose}>
              {currentLang === 'ja' ? '閉じる' : 'Close'}
            </Button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {currentLang === 'ja' ? '先行予約フォーム' : 'Pre-order Form'}
            </h3>
            
            <div className="mb-6 text-gray-600 bg-blue-50 p-4 rounded-lg text-sm">
              <p className="mb-2">
                {currentLang === 'ja' 
                  ? '先行予約フォームでの登録に費用はかかりません。'
                  : 'There is NO COST for registering with this pre-order form.'}
              </p>
              <p>
                {currentLang === 'ja' 
                  ? 'ご登録後、有料プランがリリースされ次第、詳細をご連絡します。' 
                  : 'After registration, we will contact you with details after the release.'}
              </p>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  {currentLang === 'ja' ? 'お名前' : 'Name'}*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {currentLang === 'ja' ? 'メールアドレス' : 'Email'}*
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={handleEmailChange}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      emailStatus === 'invalid' ? 'border-red-500 pr-10' : 
                      emailStatus === 'valid' ? 'border-green-500 pr-10' : 
                      'border-gray-300'
                    }`}
                  />
                  {emailStatus === 'valid' && (
                    <CheckCircle size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                  )}
                  {emailStatus === 'invalid' && (
                    <AlertCircle size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" />
                  )}
                </div>
                {emailStatus === 'invalid' && (
                  <p className="mt-1 text-sm text-red-600">
                    {currentLang === 'ja' 
                      ? '有効なメールアドレスを入力してください' 
                      : 'Please enter a valid email address'}
                  </p>
                )}
                {emailStatus === 'valid' && (
                  <p className="mt-1 text-sm text-green-600">
                    {currentLang === 'ja' 
                      ? '有効なメールアドレスです' 
                      : 'Valid email address'}
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  {currentLang === 'ja' ? '国' : 'Country'}*
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-1">
                  {currentLang === 'ja' ? 'プラン' : 'Plan'}*
                </label>
                <select
                  id="plan"
                  name="plan"
                  required
                  defaultValue={selectedPlan}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Plus">Plus</option>
                  <option value="Pro">Pro</option>
                </select>
              </div>
              
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={submitting}
                disabled={emailStatus === 'invalid'}
              >
                {currentLang === 'ja' ? '予約を確定する' : 'Confirm Pre-order'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default PreorderForm; 