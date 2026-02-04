import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Mic, MicOff, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  onStop?: () => void;
}

export default function ChatInput({ onSend, isLoading, disabled, onStop }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hasVoiceSupport, setHasVoiceSupport] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-focus and open keyboard on mount (for mobile)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (textareaRef.current && !disabled) {
        textareaRef.current.focus();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [disabled]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  // Setup speech recognition
  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      setHasVoiceSupport(true);
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      let finalTranscript = '';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            setMessage(prev => (prev + transcript + ' ').trim());
          } else {
            interimTranscript += transcript;
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.log('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        finalTranscript = '';
      };
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      // Blur textarea to close mobile keyboard instantly
      textareaRef.current?.blur();
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleStop = () => {
    if (onStop) {
      onStop();
    }
  };

  const canSend = message.trim() && !isLoading && !disabled;

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-gradient-to-t from-background via-background/98 to-transparent safe-area-inset-bottom">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {/* Futuristic rotating border container */}
        <div className="relative">
          {/* Animated gradient border - rotating colors */}
          <motion.div
            className="absolute -inset-[2px] rounded-2xl sm:rounded-3xl opacity-80"
            style={{
              background: isFocused 
                ? 'conic-gradient(from var(--angle), hsl(172 66% 50%), hsl(200 80% 50%), hsl(280 70% 50%), hsl(320 70% 50%), hsl(172 66% 50%))'
                : 'conic-gradient(from var(--angle), hsl(172 66% 50% / 0.3), hsl(200 80% 50% / 0.3), hsl(172 66% 50% / 0.3))',
            }}
            animate={{
              '--angle': ['0deg', '360deg'],
            } as never}
            transition={{
              duration: isFocused ? 3 : 8,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          
          {/* Blur glow effect */}
          <motion.div
            className="absolute -inset-[3px] rounded-2xl sm:rounded-3xl blur-md"
            style={{
              background: 'conic-gradient(from var(--angle), hsl(172 66% 50% / 0.4), hsl(200 80% 50% / 0.4), hsl(280 70% 50% / 0.4), hsl(320 70% 50% / 0.4), hsl(172 66% 50% / 0.4))',
            }}
            animate={{
              '--angle': ['0deg', '360deg'],
              opacity: isFocused ? [0.5, 0.8, 0.5] : [0.2, 0.3, 0.2],
            } as never}
            transition={{
              '--angle': { duration: 4, repeat: Infinity, ease: 'linear' },
              opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            }}
          />

          {/* Inner container */}
          <div className="relative bg-background rounded-2xl sm:rounded-3xl overflow-hidden">
            {/* Glass background */}
            <div className={`
              absolute inset-0 transition-all duration-500
              ${isFocused 
                ? 'bg-gradient-to-br from-secondary/90 via-secondary/70 to-primary/10' 
                : 'bg-secondary/60'
              }
            `} />
            <div className="absolute inset-0 backdrop-blur-2xl" />

            {/* Content */}
            <div className="relative flex items-end gap-2 sm:gap-3 p-3 sm:p-4">
              {/* AI Sparkle indicator */}
              <motion.div 
                className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 mb-0.5 relative overflow-hidden"
                animate={isLoading ? { 
                  scale: [1, 1.08, 1],
                } : {}}
                transition={{ duration: 1.5, repeat: isLoading ? Infinity : 0, ease: "easeInOut" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/15 to-transparent" />
                <div className="absolute inset-0 border border-primary/25 rounded-xl" />
                
                {isLoading && (
                  <motion.div 
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'conic-gradient(from var(--angle), transparent, hsl(172 66% 50% / 0.4), transparent)',
                    }}
                    animate={{ '--angle': ['0deg', '360deg'] } as never}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  />
                )}
                
                <Sparkles className={`w-5 h-5 relative z-10 transition-all duration-300 ${isLoading ? 'text-primary animate-pulse' : 'text-primary/60'}`} />
              </motion.div>
              
              {/* Input Area */}
              <div className="flex-1 relative min-w-0">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Ask Hypermid anything..."
                  disabled={disabled}
                  rows={1}
                  aria-label="Message input"
                  className="w-full bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground/50 py-2.5 sm:py-3 px-1 max-h-[150px] scrollbar-thin text-sm sm:text-[15px] leading-relaxed font-medium"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0 mb-0.5">
                {/* Voice button */}
                {hasVoiceSupport && (
                  <motion.button
                    type="button"
                    onClick={toggleVoice}
                    className={`
                      relative w-10 h-10 rounded-xl flex items-center justify-center
                      transition-all duration-300 overflow-hidden
                      ${isListening 
                        ? 'bg-destructive/20 text-destructive border border-destructive/30' 
                        : 'bg-secondary/60 text-muted-foreground/60 hover:text-foreground border border-border/30 hover:border-primary/30'
                      }
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={isListening ? "Stop listening" : "Start voice input"}
                  >
                    {isListening ? (
                      <>
                        <motion.div
                          className="absolute inset-0 bg-destructive/20"
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <MicOff className="w-[18px] h-[18px] relative z-10" />
                      </>
                    ) : (
                      <Mic className="w-[18px] h-[18px]" />
                    )}
                  </motion.button>
                )}

                {/* Send/Stop button */}
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.button
                      key="stop"
                      type="button"
                      onClick={handleStop}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="relative w-11 h-11 rounded-xl flex items-center justify-center bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30 transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Stop generating"
                    >
                      <Square className="w-4 h-4 fill-current" />
                    </motion.button>
                  ) : (
                    <motion.button
                      key="send"
                      type="submit"
                      disabled={!canSend}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      aria-label="Send message"
                      className={`
                        relative w-11 h-11 rounded-xl flex items-center justify-center
                        transition-all duration-300 overflow-hidden
                        ${canSend 
                          ? 'bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30' 
                          : 'bg-muted/50 text-muted-foreground/30 cursor-not-allowed'
                        }
                      `}
                      whileHover={canSend ? { scale: 1.08, y: -2 } : {}}
                      whileTap={canSend ? { scale: 0.92 } : {}}
                    >
                      {/* Animated shine */}
                      {canSend && (
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/20 to-transparent"
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                        />
                      )}
                      
                      <div className={`absolute inset-0 rounded-xl border ${canSend ? 'border-primary/50' : 'border-border/20'}`} />
                      
                      <Send className="w-[18px] h-[18px] relative z-10" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
