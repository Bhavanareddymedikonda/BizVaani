import { create } from "zustand";

export interface ChatAction {
  kind: string;
  status: string;
  requires_confirmation?: boolean;
  summary?: string;
  payload?: Record<string, unknown>;
  inventory?: Array<Record<string, unknown>>;
  transactions?: Array<Record<string, unknown>>;
}

export interface VoiceResponse {
  text: string;
  why?: string;
  what?: string;
  rupeesImpact?: number;
  action?: ChatAction;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  why?: string;
  what?: string;
  rupeesImpact?: number;
  action?: ChatAction;
  timestamp: number;
}

interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  error: string | null;
  transcript: string;
  response: VoiceResponse | null;
  messages: ChatMessage[];
  sessionId: string | null;
  setListening: (v: boolean) => void;
  setTranscript: (text: string) => void;
  setProcessing: (v: boolean) => void;
  setResponse: (r: VoiceResponse | null) => void;
  setError: (e: string | null) => void;
  setSessionId: (id: string) => void;
  addUserMessage: (text: string) => string;
  addAssistantMessage: (msg: Omit<ChatMessage, "role" | "timestamp">) => void;
  updateAssistantMessage: (id: string, patch: Partial<ChatMessage>) => void;
  clearSession: () => void;
  reset: () => void;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isListening: false,
  isProcessing: false,
  error: null,
  transcript: "",
  response: null,
  messages: [],
  sessionId: null,

  setListening: (v) => set({ isListening: v }),
  setTranscript: (text) => set({ transcript: text }),
  setProcessing: (v) => set({ isProcessing: v }),
  setResponse: (r) => set({ response: r, isProcessing: false }),
  setError: (e) => set({ error: e, isProcessing: false, isListening: false }),
  setSessionId: (id) => set({ sessionId: id }),

  addUserMessage: (text) => {
    const id = uid();
    set((s) => ({
      messages: [...s.messages, { id, role: "user", text, timestamp: Date.now() }],
    }));
    return id;
  },

  addAssistantMessage: (msg) => {
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: msg.id || uid(),
          role: "assistant",
          text: msg.text,
          why: msg.why,
          what: msg.what,
          rupeesImpact: msg.rupeesImpact,
          action: msg.action,
          timestamp: Date.now(),
        },
      ],
      isProcessing: false,
    }));
  },

  updateAssistantMessage: (id, patch) => {
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  },

  clearSession: () => set({ messages: [], sessionId: null, transcript: "", response: null, error: null }),
  reset: () => set({ isListening: false, isProcessing: false, transcript: "", response: null, error: null }),
}));
