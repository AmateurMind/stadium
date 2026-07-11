/**
 * FanAssistant — Chat interface for multilingual fan assistance.
 *
 * Features:
 *   - Real-time chat with AI-powered responses
 *   - Language selector for multilingual support
 *   - Category quick-select buttons
 *   - Suggested follow-up actions
 *   - Full accessibility support
 */

import { useState, useRef, useEffect } from 'react';
import { useStadiumStore } from '../../store/stadiumStore';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { getLanguageName } from '../../utils/formatters';
import type { Language, QueryCategory } from '../../types';

const LANGUAGES: Language[] = ['en', 'es', 'fr', 'ar', 'pt', 'de', 'ja', 'ko', 'zh', 'hi'];

const CATEGORIES: { value: QueryCategory; label: string; icon: string }[] = [
  { value: 'navigation', label: 'Navigation', icon: '🧭' },
  { value: 'amenities', label: 'Amenities', icon: '🚻' },
  { value: 'transport', label: 'Transport', icon: '🚌' },
  { value: 'accessibility', label: 'Accessibility', icon: '♿' },
  { value: 'schedule', label: 'Schedule', icon: '📅' },
  { value: 'safety', label: 'Safety', icon: '🛡️' },
  { value: 'general', label: 'General', icon: '💬' },
];

export const FanAssistant = () => {
  const chatMessages = useStadiumStore(s => s.chatMessages);
  const isLoadingChat = useStadiumStore(s => s.isLoadingChat);
  const language = useStadiumStore(s => s.language);
  const error = useStadiumStore(s => s.error);
  const groundsList = useStadiumStore(s => s.groundsList);
  const stadiumId = useStadiumStore(s => s.stadiumId);
  const sendMessage = useStadiumStore(s => s.sendMessage);
  const setLanguage = useStadiumStore(s => s.setLanguage);
  const setStadiumId = useStadiumStore(s => s.setStadiumId);
  const fetchGroundsList = useStadiumStore(s => s.fetchGroundsList);
  const clearChat = useStadiumStore(s => s.clearChat);

  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<QueryCategory>('general');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGroundsList();
  }, [fetchGroundsList]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoadingChat) return;

    const msg = inputValue.trim();
    setInputValue('');
    await sendMessage(msg, selectedCategory);
  };

  const handleSuggestedAction = async (action: string) => {
    if (isLoadingChat) return;
    await sendMessage(action, selectedCategory);
  };

  return (
    <section aria-label="Fan Assistant" className="flex flex-col h-full">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="stadium-select" className="text-sm font-medium text-gray-600">
              Stadium:
            </label>
            <select
              id="stadium-select"
              value={stadiumId}
              onChange={e => setStadiumId(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {groundsList.length === 0 ? (
                <option value="metlife">MetLife Stadium (New Jersey)</option>
              ) : (
                groundsList.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.locale.city})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="language-select" className="text-sm font-medium text-gray-600">
              Language:
            </label>
            <select
              id="language-select"
              value={language}
              onChange={e => setLanguage(e.target.value as Language)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-describedby="language-help"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>
                  {getLanguageName(lang)}
                </option>
              ))}
            </select>
            <span id="language-help" className="sr-only">
              Select your preferred language for assistant responses
            </span>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="text-sm text-gray-500 hover:text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Clear chat history"
        >
          Clear Chat
        </button>
      </div>

      {/* Category quick-select */}
      <fieldset className="mb-4">
        <legend className="text-sm font-medium text-gray-600 mb-2">Topic:</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Query category">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              type="button"
              role="radio"
              aria-checked={selectedCategory === cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
                ${
                  selectedCategory === cat.value
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <span aria-hidden="true">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Chat messages */}
      <div
        className="flex-1 overflow-y-auto bg-gray-50 rounded-2xl border border-gray-100 p-4 mb-4 min-h-[300px] max-h-[500px]"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {chatMessages.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3" aria-hidden="true">🏟️</div>
            <p className="text-sm font-medium">Welcome to StadiumSync!</p>
            <p className="text-xs mt-1">
              Ask me anything about the stadium — navigation, amenities, transport, or accessibility.
            </p>
          </div>
        )}

        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex mb-3 ${msg.role === 'fan' ? 'justify-end' : 'justify-start'}`}
            role="article"
            aria-label={`${msg.role === 'fan' ? 'Your message' : 'Assistant response'}`}
          >
            <div
              className={`
                max-w-[80%] rounded-2xl px-4 py-3 text-sm animate-fade-in
                ${
                  msg.role === 'fan'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm'
                }
              `}
            >
              <p>{msg.content}</p>
              {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100/30">
                  <p className="text-xs font-medium mb-1 opacity-70">Suggested:</p>
                  <div className="flex flex-wrap gap-1">
                    {msg.suggested_actions.map((action, actionIdx) => (
                      <button
                        key={actionIdx}
                        onClick={() => handleSuggestedAction(action)}
                        disabled={isLoadingChat}
                        className="text-xs px-2 py-1 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoadingChat && (
          <div className="flex justify-start mb-3">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <LoadingSpinner label="Thinking..." size="sm" />
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Ask the stadium assistant
        </label>
        <input
          ref={inputRef}
          id="chat-input"
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Ask about navigation, amenities, transport..."
          disabled={isLoadingChat}
          maxLength={1000}
          className="
            flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white
            text-sm placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-150
          "
          aria-describedby="chat-input-help"
        />
        <span id="chat-input-help" className="sr-only">
          Type your question and press Enter or click Send
        </span>
        <button
          type="submit"
          disabled={isLoadingChat || !inputValue.trim()}
          aria-busy={isLoadingChat}
          className="
            px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm
            hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500
            focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          Send
        </button>
      </form>
    </section>
  );
};
