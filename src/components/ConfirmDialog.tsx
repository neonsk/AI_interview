import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('dialog.confirm.title')}</h3>
        <p className="text-gray-600 mb-6">
          {t('dialog.confirm.message')}
        </p>
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={onClose}
          >
            {t('dialog.confirm.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
          >
            {t('dialog.confirm.end')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;