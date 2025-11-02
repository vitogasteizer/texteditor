
import React from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => string;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, t }) => {
  if (!isOpen) return null;

  const handleWrapperClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const shortcuts = t('modals.about.shortcuts');

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity"
      onClick={handleWrapperClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <h3 id="about-title" className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('modals.about.title')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('modals.about.description')}</p>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex-grow overflow-y-auto">
            <h4 className="font-semibold text-md mb-3 text-gray-800 dark:text-gray-200">{t('modals.about.shortcutsTitle')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
                {Object.values(shortcuts).map((shortcut: any, index: number) => (
                    <p key={index}><span className="font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded-md">{shortcut.split(': ')[1]}</span> - {shortcut.split(': ')[0]}</p>
                ))}
            </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            type="button"
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('modals.about.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
