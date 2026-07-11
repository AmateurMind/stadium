/**
 * Zustand store for StadiumSync.
 *
 * State shape:
 *   chatMessages      - Array of ChatMessage objects for the assistant conversation
 *   crowdAnalysis     - Latest CrowdAnalysis from the API
 *   isLoadingChat     - True while /api/assistant is in-flight
 *   isLoadingCrowd    - True while /api/crowd is in-flight
 *   error             - User-facing error message or null
 *   view              - Current view: 'assistant' | 'dashboard' | 'zones'
 *   language          - Current language selection
 */

import { create } from 'zustand';
import { apiClient } from '../api/client';
import type {
  AppView,
  ChatMessage,
  CrowdAnalysis,
  Language,
  GroundSummary,
} from '../types';
import { getSessionId } from '../utils/formatters';
import { withLoadingState } from '../utils/storeHelpers';

interface StadiumState {
  chatMessages: ChatMessage[];
  crowdAnalysis: CrowdAnalysis | null;
  isLoadingChat: boolean;
  isLoadingCrowd: boolean;
  error: string | null;
  view: AppView;
  language: Language;
  stadiumId: string;
  groundsList: GroundSummary[];
  isLoadingGrounds: boolean;
  setView: (view: AppView) => void;
  setLanguage: (language: Language) => void;
  setStadiumId: (stadiumId: string) => void;
  sendMessage: (message: string, category?: string) => Promise<void>;
  fetchCrowdAnalysis: () => Promise<void>;
  fetchGroundsList: () => Promise<void>;
  clearChat: () => void;
  clearError: () => void;
}

export const useStadiumStore = create<StadiumState>((set, get) => ({
  chatMessages: [],
  crowdAnalysis: null,
  isLoadingChat: false,
  isLoadingCrowd: false,
  error: null,
  view: 'assistant',
  language: 'en',
  stadiumId: 'metlife',
  groundsList: [],
  isLoadingGrounds: false,

  setView: (view) => set({ view }),
  setLanguage: (language) => set({ language }),
  setStadiumId: (stadiumId) => set({ stadiumId }),

  sendMessage: async (message: string, category = 'general') => {
    const { language, stadiumId } = get();
    const sessionId = getSessionId();

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'fan',
      content: message,
      timestamp: new Date().toISOString(),
      category,
    };
    set((state) => ({
      chatMessages: [...state.chatMessages, userMessage],
      isLoadingChat: true,
      error: null,
    }));

    const response = await withLoadingState(
      set,
      () =>
        apiClient.askAssistant({
          message,
          language,
          stadium_id: stadiumId,
          session_id: sessionId,
          category: category as 'general',
        }),
      'isLoadingChat',
      'Failed to get response from assistant'
    );

    if (response) {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString(),
        category: response.category,
        suggested_actions: response.suggested_actions,
      };
      set((state) => ({
        chatMessages: [...state.chatMessages, assistantMessage],
      }));
    }
  },

  fetchCrowdAnalysis: async () => {
    const analysis = await withLoadingState(
      set,
      () => apiClient.getCrowdAnalysis(),
      'isLoadingCrowd',
      'Failed to load crowd analysis'
    );
    if (analysis) set({ crowdAnalysis: analysis });
  },

  fetchGroundsList: async () => {
    const res = await withLoadingState(
      set,
      () => apiClient.getGrounds(),
      'isLoadingGrounds',
      'Failed to load stadium grounds list'
    );
    if (res) set({ groundsList: res.grounds });
  },

  clearChat: () => set({ chatMessages: [], error: null }),
  clearError: () => set({ error: null }),
}));
