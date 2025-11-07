'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chat } from '@/lib/api';
import { Bot } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AITeacherChatProps {
  courseId: string;
  courseTitle: string;
  moduleTitle?: string;
  lessonTitle?: string;
  lessonContent?: string;
  language?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AITeacherChat(props: AITeacherChatProps) {
  const chatState = useAITeacherChatState(props);

  return (
    <AnimatePresence>
      {props.isOpen && (
        <>
          <ChatBackdrop onClose={props.onClose} />
          <ChatPanel {...props} chatState={chatState} />
        </>
      )}
    </AnimatePresence>
  );
}

interface ChatState {
  messages: ChatMessage[];
  inputMessage: string;
  setInputMessage: (value: string) => void;
  sendMessage: () => Promise<void>;
  isLoading: boolean;
  clearChat: () => void;
  handleKeyPress: (event: React.KeyboardEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

function useAITeacherChatState({
  courseId,
  courseTitle,
  moduleTitle,
  lessonTitle,
  language = 'en',
  isOpen,
}: AITeacherChatProps): ChatState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen || messages.length > 0) {
      return;
    }

    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: `Hello! I'm your AI tutor for "${courseTitle}". I'm here to help you understand the concepts, answer questions, and guide your learning. What would you like to know?`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [isOpen, courseId, courseTitle, messages.length]);

  const sendMessage = async () => {
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date(),
    };

    const conversationHistory = [...messages, userMessage];
    setMessages(conversationHistory);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chat.sendMessage({
        message: trimmedMessage,
        courseId,
        moduleTitle,
        lessonTitle,
        conversationHistory,
        language,
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(response.data.timestamp),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, I encountered an error. Please try again in a moment.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return {
    messages,
    inputMessage,
    setInputMessage,
    sendMessage,
    isLoading,
    clearChat,
    handleKeyPress,
    messagesEndRef,
  };
}

function ChatBackdrop({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
      onClick={onClose}
    />
  );
}

function ChatPanel({
  courseTitle,
  isOpen,
  onClose,
  chatState,
}: AITeacherChatProps & { chatState: ChatState }) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-full w-96 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/40 border-l border-gray-200 z-50 flex flex-col shadow-2xl"
    >
      <ChatPanelBackground />
      <ChatHeader
        courseTitle={courseTitle}
        onClose={onClose}
        onClear={chatState.clearChat}
      />
      <ChatMessages
        messages={chatState.messages}
        isLoading={chatState.isLoading}
        endRef={chatState.messagesEndRef}
      />
      <ChatInput
        inputMessage={chatState.inputMessage}
        setInputMessage={chatState.setInputMessage}
        sendMessage={chatState.sendMessage}
        handleKeyPress={chatState.handleKeyPress}
        isLoading={chatState.isLoading}
      />
    </motion.div>
  );
}

function ChatPanelBackground() {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full blur-[120px] opacity-10 animate-pulse" />
        <div
          className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-blue-300 rounded-full blur-[140px] opacity-10 animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none" />
    </>
  );
}

function ChatHeader({
  courseTitle,
  onClose,
  onClear,
}: {
  courseTitle: string;
  onClose: () => void;
  onClear: () => void;
}) {
  return (
    <div className="relative z-10 p-4 sm:p-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-purple-100 shadow-sm">
            <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-purple-700" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">AI Tutor</h3>
            <p className="text-sm text-gray-600 font-medium">{courseTitle}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ChatHeaderButton onClick={onClear} title="Clear chat" label="🗑️" />
          <ChatHeaderButton onClick={onClose} title="Close chat" label="✕" />
        </div>
      </div>
    </div>
  );
}

function ChatHeaderButton({
  onClick,
  title,
  label,
}: {
  onClick: () => void;
  title: string;
  label: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="p-2 rounded-lg transition-colors text-gray-600 hover:text-purple-600 hover:bg-purple-50"
      title={title}
    >
      {label}
    </motion.button>
  );
}

function ChatMessages({
  messages,
  isLoading,
  endRef,
}: {
  messages: ChatMessage[];
  isLoading: boolean;
  endRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-transparent">
      {messages.map((message, index) => (
        <ChatMessageBubble key={index} message={message} index={index} />
      ))}

      {isLoading && <ChatTypingIndicator />}

      <div ref={endRef} />
    </div>
  );
}

function ChatMessageBubble({
  message,
  index,
}: {
  message: ChatMessage;
  index: number;
}) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <motion.div
        className={`max-w-[80%] p-3 sm:p-4 rounded-xl shadow-sm ${
          isUser
            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
            : 'bg-white border border-gray-200 text-gray-900'
        }`}
        whileHover={{ scale: 1.02 }}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {message.content}
        </p>
        <p
          className={`text-xs mt-2 ${isUser ? 'text-white/80' : 'text-gray-500'}`}
        >
          {message.timestamp.toLocaleTimeString()}
        </p>
      </motion.div>
    </motion.div>
  );
}

function ChatTypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="p-3 sm:p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 rounded-full animate-bounce bg-purple-600" />
            <div
              className="w-2 h-2 rounded-full animate-bounce bg-purple-600"
              style={{ animationDelay: '0.1s' }}
            />
            <div
              className="w-2 h-2 rounded-full animate-bounce bg-purple-600"
              style={{ animationDelay: '0.2s' }}
            />
          </div>
          <span className="text-sm text-gray-600 font-medium">
            AI is thinking...
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function ChatInput({
  inputMessage,
  setInputMessage,
  sendMessage,
  handleKeyPress,
  isLoading,
}: {
  inputMessage: string;
  setInputMessage: (value: string) => void;
  sendMessage: () => Promise<void>;
  handleKeyPress: (event: React.KeyboardEvent) => void;
  isLoading: boolean;
}) {
  const canSend = inputMessage.trim().length > 0 && !isLoading;

  return (
    <div className="relative z-10 p-4 sm:p-6 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="flex space-x-2 mb-2">
        <textarea
          value={inputMessage}
          onChange={(event) => setInputMessage(event.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask your AI tutor anything..."
          className="flex-1 p-3 rounded-xl resize-none focus:outline-none transition-all bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-purple-300 focus:ring-2 focus:ring-purple-200 shadow-sm"
          rows={2}
          disabled={isLoading}
        />
        <motion.button
          onClick={() => void sendMessage()}
          disabled={!canSend}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 sm:px-6 py-2 sm:py-3 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 hover:shadow-lg hover:shadow-purple-500/40 shadow-sm"
        >
          Send
        </motion.button>
      </div>
      <p className="text-xs text-gray-500 font-medium">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
