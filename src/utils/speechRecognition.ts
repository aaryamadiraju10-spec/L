import { useState, useEffect, useRef, useCallback } from 'react';

// Window speech recognition types for browser compatibility
type SpeechRecognitionType = any;

// Helper to convert spoken colloquial math words to mathematical formula notation
export function formatSpokenMath(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();

  // Common spoken replacements
  const replacements: [RegExp, string][] = [
    [/\bplus\b/gi, '+'],
    [/\bminus\b/gi, '-'],
    [/\btimes\b/gi, '*'],
    [/\bmultiplied by\b/gi, '*'],
    [/\bdivided by\b/gi, '/'],
    [/\bover\b/gi, '/'],
    [/\bequals?\b/gi, '='],
    [/\bequal to\b/gi, '='],
    [/\bis equal to\b/gi, '='],
    [/\bsquared\b/gi, '^2'],
    [/\bcubed\b/gi, '^3'],
    [/\bto the power of (\d+)\b/gi, '^$1'],
    [/\bto the (\d+)(st|nd|rd|th) power\b/gi, '^$1'],
    [/\bsquare root of\b/gi, 'sqrt'],
    [/\bcube root of\b/gi, 'cbrt'],
    [/\bpi\b/gi, 'pi'],
    [/\btheta\b/gi, 'theta'],
    [/\bgamma\b/gi, 'gamma'],
    [/\bdelta\b/gi, 'delta'],
    [/\balpha\b/gi, 'alpha'],
    [/\bbeta\b/gi, 'beta'],
    [/\bderivative of\b/gi, 'd/dx'],
    [/\bintegral of\b/gi, 'int'],
    // Worded numbers to digits if isolated
    [/\bzero\b/gi, '0'],
    [/\bone\b/gi, '1'],
    [/\btwo\b/gi, '2'],
    [/\bthree\b/gi, '3'],
    [/\bfour\b/gi, '4'],
    [/\bfive\b/gi, '5'],
    [/\bsix\b/gi, '6'],
    [/\bseven\b/gi, '7'],
    [/\beight\b/gi, '8'],
    [/\bnine\b/gi, '9'],
    [/\bten\b/gi, '10'],
  ];

  for (const [pattern, repl] of replacements) {
    cleaned = cleaned.replace(pattern, repl);
  }

  // Auto insert multiplication between number and variable, e.g. "5 x" -> "5*x"
  cleaned = cleaned.replace(/(\d+)\s*([a-zA-Z])/g, '$1*$2');

  return cleaned;
}

export function useSpeechRecognition({
  onResult,
  formatMath = false,
}: {
  onResult?: (finalText: string) => void;
  formatMath?: boolean;
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0].transcript;
          if (item.isFinal) {
            currentFinal += text;
          } else {
            currentInterim += text;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        if (currentFinal) {
          const processed = formatMath ? formatSpokenMath(currentFinal) : currentFinal;
          setTranscript((prev) => (prev ? prev + ' ' + processed : processed));
          setInterimTranscript('');
          if (onResult) {
            onResult(processed);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setError('Microphone access was denied. Please allow microphone permission in your browser.');
        } else if (event.error === 'no-speech') {
          setError('No speech detected. Please speak into your microphone.');
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Speech recognition init error:', err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [formatMath, onResult]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    try {
      recognitionRef.current.start();
    } catch (err: any) {
      console.warn('Start listening error:', err);
      try {
        recognitionRef.current.abort();
        setTimeout(() => {
          recognitionRef.current?.start();
        }, 100);
      } catch {}
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
