import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSend = message.trim() && !isLoading && !disabled;

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-gradient-to-t from-background via-background/95 to-transparent safe-area-inset-bottom">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <motion.div
          initial={false}
          animate={{ 
            scale: isFocused ? 1.002 : 1,
          }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`
            relative overflow-hidden rounded-2xl sm:rounded-[20px]
            transition-all duration-300 ease-out
            ${isFocused 
              ? 'shadow-[0_0_0_1px_hsl(var(--primary)/0.3),0_4px_24px_-4px_hsl(var(--primary)/0.2),0_12px_48px_-8px_hsl(var(--primary)/0.15)]' 
              : 'shadow-[0_2px_12px_-2px_hsl(var(--foreground)/0.08),0_4px_24px_-4px_hsl(var(--foreground)/0.04)]'
            }
          `}
        >
          {/* Premium glass background */}
          <div className={`
            absolute inset-0 transition-all duration-300
            ${isFocused 
              ? 'bg-gradient-to-br from-secondary/80 via-secondary/60 to-primary/5' 
              : 'bg-secondary/50'
            }
          `} />
          <div className="absolute inset-0 backdrop-blur-xl" />
          
          {/* Subtle glow effect on focus */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: isFocused ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Border overlay */}
          <div className={`
            absolute inset-0 rounded-2xl sm:rounded-[20px] pointer-events-none
            border transition-all duration-300
            ${isFocused 
              ? 'border-primary/30' 
              : 'border-border/30'
            }
          `} />

          <div className="relative flex items-end gap-2 sm:gap-3 p-3 sm:p-4">
            {/* AI Indicator - Premium style */}
            <motion.div 
              className="hidden sm:flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0 mb-0.5 relative overflow-hidden"
              animate={isLoading ? { 
                scale: [1, 1.05, 1],
              } : {}}
              transition={{ duration: 2, repeat: isLoading ? Infinity : 0, ease: "easeInOut" }}
            >
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
              <div className="absolute inset-0 border border-primary/20 rounded-xl" />
              
              {/* Animated ring on loading */}
              {isLoading && (
                <motion.div 
                  className="absolute inset-0 rounded-xl border-2 border-primary/40"
                  animate={{ 
                    scale: [1, 1.15, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              
              <Sparkles className={`w-5 h-5 relative z-10 transition-colors duration-300 ${isLoading ? 'text-primary' : 'text-primary/50'}`} />
            </motion.div>
            
            {/* Input Area */}
            <div className="flex-1 relative min-w-0">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Message Hypermid..."
                disabled={disabled}
                rows={1}
                aria-label="Message input"
                className="w-full bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground/40 py-3 px-1 max-h-[200px] scrollbar-thin text-sm sm:text-[15px] leading-relaxed font-medium"
              />
            </div>
            
            {/* Send Button - Premium style */}
            <div className="flex items-center flex-shrink-0 mb-0.5">
              <motion.button
                type="submit"
                disabled={!canSend}
                aria-label={isLoading ? "Sending message..." : "Send message"}
                className={`
                  relative w-11 h-11 rounded-xl flex items-center justify-center
                  transition-all duration-300 overflow-hidden
                  ${canSend 
                    ? 'bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25' 
                    : 'bg-muted/60 text-muted-foreground/40 cursor-not-allowed'
                  }
                `}
                whileHover={canSend ? { scale: 1.05, y: -1 } : {}}
                whileTap={canSend ? { scale: 0.95 } : {}}
              >
                {/* Shine effect */}
                {canSend && (
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                  />
                )}
                
                {/* Border */}
                <div className={`absolute inset-0 rounded-xl border ${canSend ? 'border-primary/50' : 'border-border/20'}`} />
                
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                ) : (
                  <Send className="w-[18px] h-[18px] relative z-10" />
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
        
        <motion.p 
          className="text-[10px] sm:text-xs text-muted-foreground/30 text-center mt-3 px-2 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Hypermid AI can make mistakes. Check important info.
        </motion.p>
      </form>
    </div>
  );
}
