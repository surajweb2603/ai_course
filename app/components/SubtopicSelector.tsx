'use client';

import { useState, useRef, useEffect } from 'react';
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

export default function SubtopicSelector({
  selectedSubtopics,
  onSubtopicsChange,
  disabled = false
}: SubtopicSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSubtopics, setFilteredSubtopics] = useState<Subtopic[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customSubtopic, setCustomSubtopic] = useState('');
  const [customSubtopics, setCustomSubtopics] = useState<Subtopic[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Filter subtopics based on search query
  useEffect(() => {
    const allSubtopics = [...PREDEFINED_SUBTOPICS, ...customSubtopics];
    
    if (!searchQuery.trim()) {
      setFilteredSubtopics(allSubtopics.slice(0, 20)); // Show first 20 by default
    } else {
      const filtered = allSubtopics.filter(subtopic =>
        subtopic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subtopic.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSubtopics(filtered);
    }
  }, [searchQuery, customSubtopics]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubtopicToggle = (subtopicName: string) => {
    if (selectedSubtopics.includes(subtopicName)) {
      onSubtopicsChange(selectedSubtopics.filter(s => s !== subtopicName));
    } else {
      // Validate count (max 5 subtopics)
      if (selectedSubtopics.length >= 5) {
        alert('You can only select up to 5 subtopics. Please remove one before adding another.');
        return;
      }
      
      // Validate total combined length (max 300 characters)
      const totalLength = [...selectedSubtopics, subtopicName].join(', ').length;
      if (totalLength > 300) {
        alert('The combined length of all subtopics is too long. Please use shorter subtopic names or select fewer subtopics.');
        return;
      }
      
      onSubtopicsChange([...selectedSubtopics, subtopicName]);
    }
  };

  const handleRemoveSubtopic = (subtopicName: string) => {
    onSubtopicsChange(selectedSubtopics.filter(s => s !== subtopicName));
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleAddCustomSubtopic = () => {
    const trimmedSubtopic = customSubtopic.trim();
    
    if (!trimmedSubtopic) {
      return;
    }
    
    // Validate length (max 100 characters per subtopic)
    if (trimmedSubtopic.length > 100) {
      alert('Subtopic name is too long. Please keep it under 100 characters.');
      return;
    }
    
    // Validate count (max 5 subtopics)
    if (selectedSubtopics.length >= 5) {
      alert('You can only select up to 5 subtopics. Please remove one before adding another.');
      return;
    }
    
    // Validate total combined length (max 300 characters)
    const totalLength = [...selectedSubtopics, trimmedSubtopic].join(', ').length;
    if (totalLength > 300) {
      alert('The combined length of all subtopics is too long. Please use shorter subtopic names or select fewer subtopics.');
      return;
    }
    
    if (!selectedSubtopics.includes(trimmedSubtopic)) {
      const newCustomSubtopic: Subtopic = {
        id: `custom-${Date.now()}`,
        name: trimmedSubtopic,
        category: 'Custom'
      };
      
      setCustomSubtopics(prev => [...prev, newCustomSubtopic]);
      onSubtopicsChange([...selectedSubtopics, trimmedSubtopic]);
      setCustomSubtopic('');
      setShowCustomInput(false);
    }
  };

  const handleCustomInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomSubtopic();
    } else if (e.key === 'Escape') {
      setShowCustomInput(false);
      setCustomSubtopic('');
    }
  };

  const handleShowCustomInput = () => {
    // Pre-fill with search query if available
    if (searchQuery.trim()) {
      setCustomSubtopic(searchQuery.trim());
    }
    setShowCustomInput(true);
    setTimeout(() => {
      customInputRef.current?.focus();
    }, 100);
  };

  const handleCancelCustomInput = () => {
    setShowCustomInput(false);
    setCustomSubtopic('');
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Technology': 'bg-blue-100 text-blue-700 border-blue-300',
      'Business': 'bg-green-100 text-green-700 border-green-300',
      'Creative': 'bg-purple-100 text-purple-700 border-purple-300',
      'Health': 'bg-red-100 text-red-700 border-red-300',
      'Language': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Academic': 'bg-indigo-100 text-indigo-700 border-indigo-300',
      'Custom': 'bg-orange-100 text-orange-700 border-orange-300',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <div className="space-y-4">
      {/* Selected Subtopics */}
      {selectedSubtopics.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Subtopics ({selectedSubtopics.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedSubtopics.map((subtopic) => (
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
                  onClick={() => handleRemoveSubtopic(subtopic)}
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
      )}

      {/* Search Input */}
      <div className="relative z-10">
        <label
          htmlFor="subtopic-search"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Add Subtopics <span className="text-gray-500">(Optional, max 5)</span>
          {selectedSubtopics.length > 0 && (
            <span className="ml-2 text-xs text-purple-600">
              ({selectedSubtopics.length}/5)
            </span>
          )}
        </label>
        <input
          ref={inputRef}
          type="text"
          id="subtopic-search"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder="Search for subtopics..."
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          disabled={disabled}
        />
        
        {/* Search Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-[9999] w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-64 overflow-y-auto"
              style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}
            >
              {filteredSubtopics.length > 0 ? (
                <div className="p-2">
                  {filteredSubtopics.map((subtopic) => (
                    <button
                      key={subtopic.id}
                      type="button"
                      onClick={() => handleSubtopicToggle(subtopic.name)}
                      disabled={disabled || (!selectedSubtopics.includes(subtopic.name) && selectedSubtopics.length >= 5)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between mb-1 ${
                        selectedSubtopics.includes(subtopic.name)
                          ? 'bg-purple-100 text-purple-700'
                          : disabled || (!selectedSubtopics.includes(subtopic.name) && selectedSubtopics.length >= 5)
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
                      {selectedSubtopics.includes(subtopic.name) && (
                        <svg className="w-4 h-4 text-purple-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                  
                  {/* Add Custom Subtopic Button */}
                  {!showCustomInput && (
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button
                        type="button"
                        onClick={handleShowCustomInput}
                        disabled={disabled || selectedSubtopics.length >= 5}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                          disabled || selectedSubtopics.length >= 5
                            ? 'opacity-50 cursor-not-allowed text-gray-400'
                            : 'hover:bg-gray-50 text-gray-900'
                        }`}
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-sm font-medium">Add custom subtopic</span>
                      </button>
                    </div>
                  )}
                  
                  {/* Custom Subtopic Input */}
                  {showCustomInput && (
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <div className="flex gap-2 mb-2">
                        <input
                          ref={customInputRef}
                          type="text"
                          value={customSubtopic}
                          onChange={(e) => setCustomSubtopic(e.target.value)}
                          onKeyDown={handleCustomInputKeyPress}
                          placeholder="Enter custom subtopic..."
                          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          disabled={disabled}
                          maxLength={100}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomSubtopic}
                          disabled={disabled || !customSubtopic.trim()}
                          className="px-3 py-2 bg-purple-600 text-white border border-purple-600 rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelCustomInput}
                          disabled={disabled}
                          className="px-3 py-2 bg-gray-200 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-300 transition-all flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Press Enter to add or Escape to cancel
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4">
                  <div className="text-center text-gray-600 text-sm mb-3">
                    No subtopics found for "{searchQuery}"
                  </div>
                  
                  {/* Add Custom Subtopic Button when no results */}
                  {!showCustomInput && (
                    <button
                      type="button"
                      onClick={handleShowCustomInput}
                      disabled={disabled || selectedSubtopics.length >= 5}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all border border-gray-300 flex items-center gap-2 ${
                        disabled || selectedSubtopics.length >= 5
                          ? 'opacity-50 cursor-not-allowed text-gray-400'
                          : 'hover:bg-gray-50 text-gray-900'
                      }`}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-sm font-medium truncate">Add "{searchQuery}" as custom subtopic</span>
                    </button>
                  )}
                  
                  {/* Custom Subtopic Input when no results */}
                  {showCustomInput && (
                    <div>
                      <div className="flex gap-2 mb-2">
                        <input
                          ref={customInputRef}
                          type="text"
                          value={customSubtopic}
                          onChange={(e) => setCustomSubtopic(e.target.value)}
                          onKeyDown={handleCustomInputKeyPress}
                          placeholder="Enter custom subtopic..."
                          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          disabled={disabled}
                          maxLength={100}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomSubtopic}
                          disabled={disabled || !customSubtopic.trim()}
                          className="px-3 py-2 bg-purple-600 text-white border border-purple-600 rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelCustomInput}
                          disabled={disabled}
                          className="px-3 py-2 bg-gray-200 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-300 transition-all flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Press Enter to add or Escape to cancel
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Help Text */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500">
          Search and select relevant subtopics to customize your course content. You can also add custom subtopics if needed.
        </p>
        <p className="text-xs text-amber-600">
          {selectedSubtopics.length >= 4 && '⚠️ Maximum 5 subtopics allowed. '}
          {selectedSubtopics.length > 0 && selectedSubtopics.join(', ').length > 250 && '⚠️ Subtopics are getting long. Keep combined length under 300 characters.'}
        </p>
      </div>
    </div>
  );
}
