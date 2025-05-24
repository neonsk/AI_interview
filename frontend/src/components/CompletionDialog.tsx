import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import checkIcon from '../assets/interview_finished.png';

interface CompletionDialogProps {
  isOpen: boolean;
  onViewFeedback: () => void;
}

const CompletionDialog: React.FC<CompletionDialogProps> = ({
  isOpen,
  onViewFeedback,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <img
          src={checkIcon}
          alt="完了"
          className="mx-auto mb-4 w-20 h-20"
        />
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('dialog.complete.title')}</h3>
        <p className="text-gray-600 mb-6">
          {t('dialog.complete.message')}
        </p>
        <div className="flex justify-end gap-4">
          <Button
            variant="primary"
            onClick={onViewFeedback}
          >
            {t('common.viewFeedback')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompletionDialog;