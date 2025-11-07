'use client';

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  type KeyboardEvent,
  type RefObject,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Subtopic {
  id: string;
  name: string;
  category?: string;
}

interface SubtopicSelectorProps {
  selectedSubtopics: string[];
  onSubtopicsChange: (subtopics: string[]) => void;
  disabled?: boolean;
}

// Predefined subtopics for common course topics
const PREDEFINED_SUBTOPICS: Subtopic[] = [
  // Technology & Programming
  { id: 'web-development', name: 'Web Development', category: 'Technology' },
  { id: 'mobile-development', name: 'Mobile Development', category: 'Technology' },
  { id: 'data-science', name: 'Data Science', category: 'Technology' },
  { id: 'machine-learning', name: 'Machine Learning', category: 'Technology' },
  { id: 'artificial-intelligence', name: 'Artificial Intelligence', category: 'Technology' },
  { id: 'cybersecurity', name: 'Cybersecurity', category: 'Technology' },
  { id: 'cloud-computing', name: 'Cloud Computing', category: 'Technology' },
  { id: 'blockchain', name: 'Blockchain', category: 'Technology' },
  { id: 'devops', name: 'DevOps', category: 'Technology' },
  { id: 'ui-ux-design', name: 'UI/UX Design', category: 'Technology' },
  
  // Business & Finance
  { id: 'digital-marketing', name: 'Digital Marketing', category: 'Business' },
  { id: 'project-management', name: 'Project Management', category: 'Business' },
  { id: 'entrepreneurship', name: 'Entrepreneurship', category: 'Business' },
  { id: 'financial-analysis', name: 'Financial Analysis', category: 'Business' },
  { id: 'leadership', name: 'Leadership', category: 'Business' },
  { id: 'sales', name: 'Sales', category: 'Business' },
  { id: 'strategy', name: 'Strategy', category: 'Business' },
  
  // Creative & Arts
  { id: 'graphic-design', name: 'Graphic Design', category: 'Creative' },
  { id: 'photography', name: 'Photography', category: 'Creative' },
  { id: 'video-editing', name: 'Video Editing', category: 'Creative' },
  { id: 'music-production', name: 'Music Production', category: 'Creative' },
  { id: 'writing', name: 'Writing', category: 'Creative' },
  { id: 'drawing', name: 'Drawing', category: 'Creative' },
  
  // Health & Wellness
  { id: 'fitness', name: 'Fitness', category: 'Health' },
  { id: 'nutrition', name: 'Nutrition', category: 'Health' },
  { id: 'mental-health', name: 'Mental Health', category: 'Health' },
  { id: 'yoga', name: 'Yoga', category: 'Health' },
  { id: 'meditation', name: 'Meditation', category: 'Health' },
  
  // Languages
  { id: 'spanish', name: 'Spanish', category: 'Language' },
  { id: 'french', name: 'French', category: 'Language' },
  { id: 'german', name: 'German', category: 'Language' },
  { id: 'chinese', name: 'Chinese', category: 'Language' },
  { id: 'japanese', name: 'Japanese', category: 'Language' },
  { id: 'english', name: 'English', category: 'Language' },
  
  // Academic Subjects
  { id: 'mathematics', name: 'Mathematics', category: 'Academic' },
  { id: 'physics', name: 'Physics', category: 'Academic' },
  { id: 'chemistry', name: 'Chemistry', category: 'Academic' },
  { id: 'biology', name: 'Biology', category: 'Academic' },
  { id: 'history', name: 'History', category: 'Academic' },
  { id: 'psychology', name: 'Psychology', category: 'Academic' },
  { id: 'philosophy', name: 'Philosophy', category: 'Academic' },
];

const MAX_SUBTOPICS = 5;
const MAX_TOTAL_LENGTH = 300;
const MAX_SUBTOPIC_LENGTH = 100;

function validateSubtopicAddition(subtopicName: string, selectedSubtopics: string[]): string | null {
  if (selectedSubtopics.includes(subtopicName)) {
    return null;
  }

  if (selectedSubtopics.length >= MAX_SUBTOPICS) {
    return `You can only select up to ${MAX_SUBTOPICS} subtopics. Please remove one before adding another.`;
  }

  const totalLength = [...selectedSubtopics, subtopicName].join(', ').length;
  if (totalLength > MAX_TOTAL_LENGTH) {
    return 'The combined length of all subtopics is too long. Please use shorter names or select fewer subtopics.';
  }

  return null;
}

function getCategoryColor(category: string): string {
  const colors = {
    Technology: 'bg-blue-100 text-blue-700 border-blue-300',
    Business: 'bg-green-100 text-green-700 border-green-300',
    Creative: 'bg-purple-100 text-purple-700 border-purple-300',
    Health: 'bg-red-100 text-red-700 border-red-300',
    Language: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    Academic: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    Custom: 'bg-orange-100 text-orange-700 border-orange-300',
  } as const;
  return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-300';
}

function SelectedSubtopicsList({
  subtopics,
  onRemove,
  disabled,
}: {
  subtopics: string[];
  onRemove: (name: string) => void;
  disabled: boolean;
}): JSX.Element | null {
  if (subtopics.length === 0) {
    return null;
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Selected Subtopics ({subtopics.length})
      </label>
      <div className="flex flex-wrap gap-2">
        {subtopics.map(subtopic => (
          <motion.span
            key={subtopic}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 border border-purple-300 rounded-lg text-sm"
          >
            {subtopic}
            <button
              type="button"
              onClick={() => onRemove(subtopic)}
              disabled={disabled}
              className="hover:text-purple-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.span>
        ))}
      </div>
    </div>
  );
}

function SubtopicHelpText({
  selectedSubtopics,
}: {
  selectedSubtopics: string[];
}): JSX.Element {
  const combinedLength = selectedSubtopics.join(', ').length;

  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">
        Search and select relevant subtopics to customize your course content. You can also add custom subtopics if needed.
      </p>
      <p className="text-xs text-amber-600">
        {selectedSubtopics.length >= MAX_SUBTOPICS - 1 && '⚠️ Maximum 5 subtopics allowed. '}
        {combinedLength > MAX_TOTAL_LENGTH - 50 && '⚠️ Subtopics are getting long. Keep combined length under 300 characters.'}
      </p>
    </div>
  );
}

function CustomSubtopicInput({
  customSubtopic,
  onChange,
  onSubmit,
  onCancel,
  disabled,
  inputRef,
  onKeyDown,
}: {
  customSubtopic: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  disabled: boolean;
  inputRef: RefObject<HTMLInputElement>;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}): JSX.Element {
  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          ref={inputRef}
          type="text"
          value={customSubtopic}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Enter custom subtopic..."
          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          disabled={disabled}
          maxLength={MAX_SUBTOPIC_LENGTH}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || !customSubtopic.trim()}
          className="px-3 py-2 bg-purple-600 text-white border border-purple-600 rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="px-3 py-2 bg-gray-200 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-300 transition-all flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-gray-500">Press Enter to add or Escape to cancel</p>
    </div>
  );
}

function AddCustomButton({
  disabled,
  onClick,
  label,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
        disabled ? 'opacity-50 cursor-not-allowed text-gray-400' : 'hover:bg-gray-50 text-gray-900'
      }`}
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span className="text-sm font-medium truncate">{label}</span>
    </button>
  );
}

function SubtopicList({
  subtopics,
  selectedSubtopics,
  disabled,
  onToggle,
}: {
  subtopics: Subtopic[];
  selectedSubtopics: string[];
  disabled: boolean;
  onToggle: (name: string) => void;
}): JSX.Element {
  return (
    <div className="p-2">
      {subtopics.map(subtopic => {
        const isSelected = selectedSubtopics.includes(subtopic.name);
        const isDisabled = disabled || (!isSelected && selectedSubtopics.length >= MAX_SUBTOPICS);

        return (
          <button
            key={subtopic.id}
            type="button"
            onClick={() => onToggle(subtopic.name)}
            disabled={isDisabled}
            className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between mb-1 ${
              isSelected
                ? 'bg-purple-100 text-purple-700'
                : isDisabled
                ? 'opacity-50 cursor-not-allowed text-gray-400'
                : 'hover:bg-gray-50 text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-sm font-medium truncate">{subtopic.name}</span>
              {subtopic.category && (
                <span className={`px-2 py-0.5 text-xs rounded border flex-shrink-0 ${getCategoryColor(subtopic.category)}`}>
                  {subtopic.category}
                </span>
              )}
            </div>
            {isSelected && (
              <svg className="w-4 h-4 text-purple-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}

function SubtopicDropdownContent({
  dropdownRef,
  filteredSubtopics,
  selectedSubtopics,
  disabled,
  onToggleSubtopic,
  showCustomInput,
  onShowCustomInput,
  customSubtopic,
  setCustomSubtopic,
  customInputRef,
  onCustomInputKeyDown,
  onAddCustomSubtopic,
  onCancelCustomInput,
  searchQuery,
}: {
  dropdownRef: RefObject<HTMLDivElement>;
  filteredSubtopics: Subtopic[];
  selectedSubtopics: string[];
  disabled: boolean;
  onToggleSubtopic: (name: string) => void;
  showCustomInput: boolean;
  onShowCustomInput: () => void;
  customSubtopic: string;
  setCustomSubtopic: (value: string) => void;
  customInputRef: RefObject<HTMLInputElement>;
  onCustomInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onAddCustomSubtopic: () => void;
  onCancelCustomInput: () => void;
  searchQuery: string;
}): JSX.Element {
  return (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute z-[9999] w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-64 overflow-y-auto"
      style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}
    >
      {filteredSubtopics.length > 0 ? (
        <div className="pb-2">
          <SubtopicList
            subtopics={filteredSubtopics}
            selectedSubtopics={selectedSubtopics}
            disabled={disabled}
            onToggle={onToggleSubtopic}
          />
          {showCustomInput ? (
            <div className="border-t border-gray-200 mt-2 pt-2 px-2">
              <CustomSubtopicInput
                customSubtopic={customSubtopic}
                onChange={setCustomSubtopic}
                onSubmit={onAddCustomSubtopic}
                onCancel={onCancelCustomInput}
                disabled={disabled}
                inputRef={customInputRef}
                onKeyDown={onCustomInputKeyDown}
              />
            </div>
          ) : (
            <div className="border-t border-gray-200 mt-2 pt-2 px-2">
              <AddCustomButton
                disabled={disabled || selectedSubtopics.length >= MAX_SUBTOPICS}
                onClick={onShowCustomInput}
                label="Add custom subtopic"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="p-4">
          <div className="text-center text-gray-600 text-sm mb-3">
            No subtopics found for "{searchQuery}"
          </div>
          {showCustomInput ? (
            <CustomSubtopicInput
              customSubtopic={customSubtopic}
              onChange={setCustomSubtopic}
              onSubmit={onAddCustomSubtopic}
              onCancel={onCancelCustomInput}
              disabled={disabled}
              inputRef={customInputRef}
              onKeyDown={onCustomInputKeyDown}
            />
          ) : (
            <AddCustomButton
              disabled={disabled || selectedSubtopics.length >= MAX_SUBTOPICS}
              onClick={onShowCustomInput}
              label={`Add "${searchQuery}" as custom subtopic`}
            />
          )}
        </div>
      )}
    </motion.div>
  );
}

function useSubtopicData(customSubtopics: Subtopic[], searchQuery: string) {
  const allSubtopics = useMemo(
    () => [...PREDEFINED_SUBTOPICS, ...customSubtopics],
    [customSubtopics]
  );

  const filteredSubtopics = useMemo(() => {
    if (!searchQuery.trim()) {
      return allSubtopics.slice(0, 20);
    }

    const query = searchQuery.toLowerCase();
    return allSubtopics.filter(subtopic =>
      subtopic.name.toLowerCase().includes(query) ||
      subtopic.category?.toLowerCase().includes(query)
    );
  }, [allSubtopics, searchQuery]);

  return { filteredSubtopics };
}

function useDropdownCloseOnOutsideClick({
  dropdownRef,
  inputRef,
  onClose,
}: {
  dropdownRef: RefObject<HTMLDivElement>;
  inputRef: RefObject<HTMLInputElement>;
  onClose: () => void;
}): void {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef, inputRef, onClose]);
}

function useSubtopicSelectionHandlers(
  selectedSubtopics: string[],
  onSubtopicsChange: (subtopics: string[]) => void,
  setSearchQuery: (value: string) => void,
  closeDropdown: () => void
) {
  const removeSubtopic = useCallback(
    (subtopicName: string) => {
      onSubtopicsChange(selectedSubtopics.filter(s => s !== subtopicName));
    },
    [onSubtopicsChange, selectedSubtopics]
  );

  const toggleSubtopic = useCallback(
    (subtopicName: string) => {
      if (selectedSubtopics.includes(subtopicName)) {
        removeSubtopic(subtopicName);
        return;
      }

      const validationError = validateSubtopicAddition(subtopicName, selectedSubtopics);
      if (validationError) {
        alert(validationError);
        return;
      }

      onSubtopicsChange([...selectedSubtopics, subtopicName]);
      setSearchQuery('');
      closeDropdown();
    },
    [closeDropdown, onSubtopicsChange, removeSubtopic, selectedSubtopics, setSearchQuery]
  );

  return { removeSubtopic, toggleSubtopic };
}

function useCustomSubtopicHandlers({
  customSubtopic,
  setCustomSubtopic,
  selectedSubtopics,
  onSubtopicsChange,
  setCustomSubtopics,
  closeDropdown,
  searchQuery,
  setShowCustomInput,
  customInputRef,
}: {
  customSubtopic: string;
  setCustomSubtopic: (value: string) => void;
  selectedSubtopics: string[];
  onSubtopicsChange: (subtopics: string[]) => void;
  setCustomSubtopics: Dispatch<SetStateAction<Subtopic[]>>;
  closeDropdown: () => void;
  searchQuery: string;
  setShowCustomInput: (value: boolean) => void;
  customInputRef: RefObject<HTMLInputElement>;
}) {
  const addCustomSubtopic = useCallback(() => {
    const trimmed = customSubtopic.trim();
    if (!trimmed) {
      return;
    }

    if (trimmed.length > MAX_SUBTOPIC_LENGTH) {
      alert(`Subtopic name is too long. Please keep it under ${MAX_SUBTOPIC_LENGTH} characters.`);
      return;
    }

    const validationError = validateSubtopicAddition(trimmed, selectedSubtopics);
    if (validationError) {
      alert(validationError);
      return;
    }

    if (!selectedSubtopics.includes(trimmed)) {
      const newCustomSubtopic: Subtopic = {
        id: `custom-${Date.now()}`,
        name: trimmed,
        category: 'Custom',
      };

      setCustomSubtopics(prev => [...prev, newCustomSubtopic]);
      onSubtopicsChange([...selectedSubtopics, trimmed]);
    }

    setCustomSubtopic('');
    closeDropdown();
  }, [closeDropdown, customSubtopic, onSubtopicsChange, selectedSubtopics, setCustomSubtopics, setCustomSubtopic]);

  const handleCustomInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addCustomSubtopic();
      }

      if (event.key === 'Escape') {
        setShowCustomInput(false);
        setCustomSubtopic('');
      }
    },
    [addCustomSubtopic, setCustomSubtopic, setShowCustomInput]
  );

  const showCustomInputField = useCallback(() => {
    if (searchQuery.trim()) {
      setCustomSubtopic(searchQuery.trim());
    }
    setShowCustomInput(true);
    setTimeout(() => customInputRef.current?.focus(), 100);
  }, [customInputRef, searchQuery, setCustomSubtopic, setShowCustomInput]);

  const cancelCustomInput = useCallback(() => {
    setShowCustomInput(false);
    setCustomSubtopic('');
  }, [setCustomSubtopic, setShowCustomInput]);

  return {
    addCustomSubtopic,
    handleCustomInputKeyDown,
    showCustomInputField,
    cancelCustomInput,
  };
}

function useSubtopicSelectorState(
  selectedSubtopics: string[],
  onSubtopicsChange: (subtopics: string[]) => void
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customSubtopic, setCustomSubtopic] = useState('');
  const [customSubtopics, setCustomSubtopics] = useState<Subtopic[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  const { filteredSubtopics } = useSubtopicData(customSubtopics, searchQuery);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setShowCustomInput(false);
  }, [setIsOpen, setShowCustomInput]);

  useDropdownCloseOnOutsideClick({ dropdownRef, inputRef, onClose: closeDropdown });

  const { removeSubtopic, toggleSubtopic } = useSubtopicSelectionHandlers(selectedSubtopics, onSubtopicsChange, setSearchQuery, closeDropdown);
  const { addCustomSubtopic, handleCustomInputKeyDown, showCustomInputField, cancelCustomInput } = useCustomSubtopicHandlers({
    customSubtopic,
    setCustomSubtopic,
    selectedSubtopics,
    onSubtopicsChange,
    setCustomSubtopics,
    closeDropdown,
    searchQuery,
    setShowCustomInput,
    customInputRef,
  });

  return {
    searchQuery,
    setSearchQuery,
    isOpen,
    setIsOpen,
    showCustomInput,
    customSubtopic,
    setCustomSubtopic,
    filteredSubtopics,
    inputRef,
    dropdownRef,
    customInputRef,
    toggleSubtopic,
    removeSubtopic,
    addCustomSubtopic,
    handleCustomInputKeyDown,
    showCustomInputField,
    cancelCustomInput,
    closeDropdown,
  };
}

function SubtopicSearchPanel({
  searchQuery,
  onSearchChange,
  onFocus,
  inputRef,
  disabled,
  isOpen,
  setIsOpen,
  dropdownRef,
  filteredSubtopics,
  selectedSubtopics,
  onToggleSubtopic,
  showCustomInput,
  onShowCustomInput,
  customSubtopic,
  setCustomSubtopic,
  customInputRef,
  onCustomInputKeyDown,
  onAddCustomSubtopic,
  onCancelCustomInput,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onFocus: () => void;
  inputRef: RefObject<HTMLInputElement>;
  disabled: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  dropdownRef: RefObject<HTMLDivElement>;
  filteredSubtopics: Subtopic[];
  selectedSubtopics: string[];
  onToggleSubtopic: (name: string) => void;
  showCustomInput: boolean;
  onShowCustomInput: () => void;
  customSubtopic: string;
  setCustomSubtopic: (value: string) => void;
  customInputRef: RefObject<HTMLInputElement>;
  onCustomInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onAddCustomSubtopic: () => void;
  onCancelCustomInput: () => void;
}): JSX.Element {
  return (
    <div className="relative z-10">
      <label htmlFor="subtopic-search" className="block text-sm font-medium text-gray-700 mb-2">
        Add Subtopics <span className="text-gray-500">(Optional, max {MAX_SUBTOPICS})</span>
        {selectedSubtopics.length > 0 && (
          <span className="ml-2 text-xs text-purple-600">({selectedSubtopics.length}/{MAX_SUBTOPICS})</span>
        )}
      </label>
      <input
        ref={inputRef}
        type="text"
        id="subtopic-search"
        value={searchQuery}
        onChange={(e) => {
          onSearchChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          onFocus();
          setIsOpen(true);
        }}
        placeholder="Search for subtopics..."
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        disabled={disabled}
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <AnimatePresence>
        {isOpen && (
          <SubtopicDropdownContent
            dropdownRef={dropdownRef}
            filteredSubtopics={filteredSubtopics}
            selectedSubtopics={selectedSubtopics}
            disabled={disabled}
            onToggleSubtopic={onToggleSubtopic}
            showCustomInput={showCustomInput}
            onShowCustomInput={onShowCustomInput}
            customSubtopic={customSubtopic}
            setCustomSubtopic={setCustomSubtopic}
            customInputRef={customInputRef}
            onCustomInputKeyDown={onCustomInputKeyDown}
            onAddCustomSubtopic={onAddCustomSubtopic}
            onCancelCustomInput={onCancelCustomInput}
            searchQuery={searchQuery}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SubtopicSelector({
  selectedSubtopics,
  onSubtopicsChange,
  disabled = false,
}: SubtopicSelectorProps) {
  const {
    searchQuery,
    setSearchQuery,
    isOpen,
    setIsOpen,
    showCustomInput,
    customSubtopic,
    setCustomSubtopic,
    filteredSubtopics,
    inputRef,
    dropdownRef,
    customInputRef,
    toggleSubtopic,
    removeSubtopic,
    addCustomSubtopic,
    handleCustomInputKeyDown,
    showCustomInputField,
    cancelCustomInput,
  } = useSubtopicSelectorState(selectedSubtopics, onSubtopicsChange);

  return (
    <div className="space-y-4">
      <SelectedSubtopicsList
        subtopics={selectedSubtopics}
        onRemove={removeSubtopic}
        disabled={disabled}
      />

      <SubtopicSearchPanel
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFocus={() => setIsOpen(true)}
        inputRef={inputRef}
        disabled={disabled}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        dropdownRef={dropdownRef}
        filteredSubtopics={filteredSubtopics}
        selectedSubtopics={selectedSubtopics}
        onToggleSubtopic={toggleSubtopic}
        showCustomInput={showCustomInput}
        onShowCustomInput={showCustomInputField}
        customSubtopic={customSubtopic}
        setCustomSubtopic={setCustomSubtopic}
        customInputRef={customInputRef}
        onCustomInputKeyDown={handleCustomInputKeyDown}
        onAddCustomSubtopic={addCustomSubtopic}
        onCancelCustomInput={cancelCustomInput}
      />

      <SubtopicHelpText selectedSubtopics={selectedSubtopics} />
    </div>
  );
}
