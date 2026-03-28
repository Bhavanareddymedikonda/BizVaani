import { create } from "zustand";

export interface VoiceResponse {
  text: string;
  why?: string;
  what?: string;
  rupeesImpact?: number;
}

export interface ChatMessage {
  id:        string;
  role:      "user" | "assistant";
  text:      string;
  why?:      string;
  what?:     string;
  rupeesImpact?: number;
  timestamp: number;
}

interface VoiceState {
  /* Connection state */
  isListening:  boolean;
  isProcessing: boolean;
  error:        string | null;

  /* Current turn */
  transcript:   string;
  response:     VoiceResponse | null;

  /* Persistent session history (all turns in this session) */
  messages:     ChatMessage[];
  sessionId:    string | null;

  /* Actions */
  setListening:   (v: boolean) => void;
  setTranscript:  (text: string) => void;
  setProcessing:  (v: boolean) => void;
  setResponse:    (r: VoiceResponse | null) => void;
  setError:       (e: string | null) => void;
  setSessionId:   (id: string) => void;
  addUserMessage: (text: string) => string;          // returns message id
  addAssistantMessage: (msg: Omit<ChatMessage, "id" | "role" | "timestamp">) => void;
  updateAssistantMessage: (id: string, patch: Partial<ChatMessage>) => void;
  clearSession:   () => void;
  reset:          () => void;          // resets current turn, keeps history
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  isListening:  false,
  isProcessing: false,
  error:        null,
  transcript:   "",
  response:     null,
  messages:     [],
  sessionId:    null,

  setListening:  (v)    => set({ isListening: v }),
  setTranscript: (text) => set({ transcript: text }),
  setProcessing: (v)    => set({ isProcessing: v }),
  setResponse:   (r)    => set({ response: r, isProcessing: false }),
  setError:      (e)    => set({ error: e, isProcessing: false, isListening: false }),
  setSessionId:  (id)   => set({ sessionId: id }),

  addUserMessage: (text) => {
    const id = uid();
    set((s) => ({
      messages: [...s.messages, { id, role: "user", text, timestamp: Date.now() }],
    }));
    return id;
  },

  addAssistantMessage: (msg) => {
    const id = uid();
    set((s) => ({
      messages: [...s.messages, { id, role: "assistant", timestamp: Date.now(), ...msg }],
      isProcessing: false,
    }));
  },

  updateAssistantMessage: (id, patch) => {
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  },

  clearSession: () =>
    set({ messages: [], sessionId: null, transcript: "", response: null, error: null }),

  reset: () =>
    set({ isListening: false, isProcessing: false, transcript: "", response: null, error: null }),
}));
