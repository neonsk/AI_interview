import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { logToFile } from '../utils/logger';

const PrivacyPolicyPage: React.FC = () => {
  React.useEffect(() => {
    logToFile('page_view', { page: 'PrivacyPolicyPage' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              トップページに戻る
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. 個人情報の取り扱いについて</h2>
              <p className="text-gray-600 mb-4">
                当サービスは、ユーザーの個人情報を適切に取り扱い、保護することが社会的責務であると考え、
                以下の方針に基づき個人情報の保護に努めます。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. 収集する情報</h2>
              <p className="text-gray-600 mb-4">
                当サービスは、以下の情報を収集する場合があります：
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>メールアドレス</li>
                <li>利用履歴</li>
                <li>デバイス情報</li>
                <li>音声データ</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. 情報の利用目的</h2>
              <p className="text-gray-600 mb-4">
                収集した情報は、以下の目的で利用されます：
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>サービスの提供・維持・改善</li>
                <li>ユーザーサポート</li>
                <li>利用状況の分析</li>
                <li>新機能の開発</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. 情報の管理</h2>
              <p className="text-gray-600 mb-4">
                当サービスは、収集した情報の漏洩、紛失、改ざんなどを防ぐため、適切な安全対策を実施します。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. お問い合わせ</h2>
              <p className="text-gray-600">
                本プライバシーポリシーに関するお問い合わせは、以下のメールアドレスまでご連絡ください：
                <br />
                <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-800">
                  support@example.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;