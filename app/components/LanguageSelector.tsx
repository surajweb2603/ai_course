'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { translation } from '@/lib/api';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  onContentTranslate: (text: string, targetLanguage: string) => Promise<string>;
  className?: string;
}

export default function LanguageSelector({
  currentLanguage,
  onLanguageChange,
  onContentTranslate,
  className = ''
}: LanguageSelectorProps) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const response = await translation.getLanguages();
      setLanguages(response.data);
    } catch (error) {
      setError('Failed to load languages');
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    if (newLanguage === currentLanguage) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Translate the current content
      const currentContent = document.querySelector('.course-content')?.textContent || '';
      if (currentContent) {
        const translatedContent = await onContentTranslate(currentContent, newLanguage);
        // Update the content (this would be handled by the parent component)
      }
      
      onLanguageChange(newLanguage);
      setIsOpen(false);
    } catch (error) {
      setError('Translation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentLanguageInfo = languages.find(lang => lang.code === currentLanguage);

  return (
    <div className={`relative ${className}`}>
      <LanguageButton
        isOpen={isOpen}
        isLoading={isLoading}
        languageName={currentLanguageInfo?.nativeName || currentLanguage.toUpperCase()}
        onToggle={() => setIsOpen(!isOpen)}
      />
      <LanguageDropdown
        isOpen={isOpen}
        languages={languages}
        currentLanguage={currentLanguage}
        isLoading={isLoading}
        error={error}
        onLanguageChange={handleLanguageChange}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}

function LanguageButton({
  isOpen,
  isLoading,
  languageName,
  onToggle,
}: {
  isOpen: boolean;
  isLoading: boolean;
  languageName: string;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={isLoading}
      className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
    >
      <span className="text-lg">🌐</span>
      <span className="font-medium">{languageName}</span>
      <motion.span
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="text-gray-400"
      >
        ▼
      </motion.span>
    </button>
  );
}

function LanguageDropdown({
  isOpen,
  languages,
  currentLanguage,
  isLoading,
  error,
  onLanguageChange,
  onClose,
}: {
  isOpen: boolean;
  languages: Language[];
  currentLanguage: string;
  isLoading: boolean;
  error: string;
  onLanguageChange: (code: string) => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto"
          >
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Select Language
              </div>
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => onLanguageChange(language.code)}
                  disabled={isLoading}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    language.code === currentLanguage
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'hover:bg-gray-700 text-white'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{language.nativeName}</div>
                      <div className="text-sm text-gray-400">{language.name}</div>
                    </div>
                    {language.code === currentLanguage && (
                      <span className="text-yellow-400">✓</span>
                    )}
                  </div>
                </button>
              ))}
              {error && (
                <div className="px-3 py-2 text-red-400 text-sm">{error}</div>
              )}
              {isLoading && (
                <div className="px-3 py-2 text-yellow-400 text-sm flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Translating content...</span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
