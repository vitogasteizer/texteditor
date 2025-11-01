
import React from 'react';

interface SpecialCharactersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (char: string) => void;
  t: (key: string) => string;
}

const specialCharacters = [
  '©', '®', '™', '§', '°', '•', '·',
  '–', '—', '‘', '’', '“', '”', '…',
  '€', '£', '¥', '¢', '₽', '₹', '₿',
  '←', '↑', '→', '↓', '↔', '↕', '↵',
  'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η',
  'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ',
  'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ',
  'ψ', 'ω', 'Α', 'Β', 'Γ', 'Δ', 'Ε',
  '∞', '≠', '≈', '≤', '≥', '±', '÷',
];


const SpecialCharactersModal: React.FC<SpecialCharactersModalProps> = ({ isOpen, onClose, onInsert, t }) => {
  if (!isOpen) return null;

  const handleWrapperClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const handleInsertChar = (char: string) => {
      onInsert(char);
      onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity"
      onClick={handleWrapperClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="special-chars-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 id="special-chars-title" className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('modals.specialChars.title')}</h3>
        <div className="grid grid-cols-7 gap-2">
          {specialCharacters.map(char => (
            <button
              key={char}
              onClick={() => handleInsertChar(char)}
              className="flex items-center justify-center p-2 text-xl bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={`Insert ${char}`}
            >
              {char}
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 border border-transparent rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {t('modals.specialChars.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpecialCharactersModal;