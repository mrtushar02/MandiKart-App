/**
 * MandiKart Farmer App — Text-to-Speech (TTS) Service
 *
 * Provides cross-platform voice narration for Kisan AI Saathi responses.
 * Supports vernacular Indian languages: English, Hindi, Odia, Telugu, and Bengali.
 * Utilizes Web Speech API (window.speechSynthesis) on Web / Mobile Web,
 * with clean fallback handling.
 */

import { Platform } from 'react-native';

export type SupportedLanguage = 'en' | 'hi' | 'or' | 'te' | 'bn';

export interface TtsOptions {
  language?: SupportedLanguage;
  rate?: number; // 0.5 to 2.0 (default 0.95 for clear Indian accent pronunciation)
  pitch?: number; // 0.5 to 2.0 (default 1.0)
  onStart?: () => void;
  onDone?: () => void;
  onError?: (err: any) => void;
}

const LANGUAGE_CODES: Record<SupportedLanguage, string[]> = {
  en: ['en-IN', 'en-US', 'en-GB'],
  hi: ['hi-IN', 'hi'],
  or: ['or-IN', 'ory-IN', 'hi-IN'], // Odia fallback to Indian English/Hindi if native Odia synth unavailable
  te: ['te-IN', 'te'],
  bn: ['bn-IN', 'bn-BD', 'bn'],
};

class TtsService {
  private isSpeakingState = false;
  private currentUtterance: any = null;
  private stateListeners: Array<(speaking: boolean) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }

  public subscribe(listener: (speaking: boolean) => void): () => void {
    this.stateListeners.push(listener);
    listener(this.isSpeakingState);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  private notify(speaking: boolean) {
    this.isSpeakingState = speaking;
    this.stateListeners.forEach((l) => l(speaking));
  }

  public isSpeaking(): boolean {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.speaking;
    }
    return this.isSpeakingState;
  }

  /**
   * Speak the given text in the requested Indian vernacular language
   */
  public speak(text: string, options: TtsOptions = {}): void {
    const cleanText = text
      .replace(/[#*_`~[\]()]/g, '') // strip markdown
      .replace(/₹/g, 'Rupees ')
      .trim();

    if (!cleanText) return;

    // Stop any ongoing speech first
    this.stop();

    const lang = options.language || 'hi';
    const rate = options.rate || 0.95;
    const pitch = options.pitch || 1.0;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = rate;
        utterance.pitch = pitch;

        // Find best matching voice
        const voices = window.speechSynthesis.getVoices();
        const preferredLangs = LANGUAGE_CODES[lang] || ['en-IN'];

        let selectedVoice = null;
        for (const code of preferredLangs) {
          selectedVoice = voices.find(
            (v) => v.lang.toLowerCase() === code.toLowerCase() || v.lang.toLowerCase().startsWith(code.toLowerCase())
          );
          if (selectedVoice) break;
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
        } else {
          utterance.lang = preferredLangs[0] || 'en-IN';
        }

        utterance.onstart = () => {
          this.notify(true);
          options.onStart?.();
        };

        utterance.onend = () => {
          this.notify(false);
          this.currentUtterance = null;
          options.onDone?.();
        };

        utterance.onerror = (e) => {
          this.notify(false);
          this.currentUtterance = null;
          options.onError?.(e);
        };

        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('[TtsService] Speech synthesis failed:', err);
        this.notify(false);
        options.onError?.(err);
      }
    } else {
      this.notify(true);
      options.onStart?.();
      const approxDuration = Math.min(Math.max((cleanText.length / 15) * 1000, 2000), 12000);
      setTimeout(() => {
        this.notify(false);
        options.onDone?.();
      }, approxDuration);
    }
  }

  /**
   * Stop any current speech playback
   */
  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    this.notify(false);
  }

  /**
   * Pause speech
   */
  public pause(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  }

  /**
   * Resume speech
   */
  public resume(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }
}

export const ttsService = new TtsService();
