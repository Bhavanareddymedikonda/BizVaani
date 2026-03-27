import { create } from "zustand";

interface VoiceResponse {
  why_text: string;
  what_text: string;
  rupees_impact: number;
}

interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  response: VoiceResponse | null;
  startListening: () => void;
  stopListening: () => void;
  setTranscript: (text: string) => void;
  setProcessing: (processing: boolean) => void;
  setResponse: (r: VoiceResponse) => void;
  reset: () => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isListening: false,
  isProcessing: false,
  transcript: "",
  response: null,

  startListening: () => set({ isListening: true, transcript: "", response: null }),
  stopListening: () => set({ isListening: false }),
  setTranscript: (text) => set({ transcript: text }),
  setProcessing: (processing) => set({ isProcessing: processing }),
  setResponse: (r) => set({ response: r, isProcessing: false }),
  reset: () => set({ isListening: false, isProcessing: false, transcript: "", response: null }),
}));
