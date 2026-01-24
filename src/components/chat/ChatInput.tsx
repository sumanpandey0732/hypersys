import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Sparkles, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
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

  return (
    <div className="p-3 sm:p-4 lg:p-5 bg-gradient-to-t from-background via-background to-transparent safe-area-inset-bottom">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <motion.div
          initial={false}
          animate={{ 
            scale: isFocused ? 1.01 : 1,
            boxShadow: isFocused 
              ? '0 0 0 1px hsla(172, 66%, 50%, 0.3), 0 8px 40px -12px hsla(172, 66%, 50%, 0.25)' 
              : '0 0 0 1px hsla(var(--border), 0.5), 0 4px 20px -8px hsla(0, 0%, 0%, 0.3)'
          }}
          transition={{ duration: 0.2 }}
          className="relative flex items-end gap-2 sm:gap-3 bg-secondary/60 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-border/50 p-2 sm:p-3"
        >
          {/* AI indicator */}
          <motion.div 
            className="hidden sm:flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex-shrink-0"
            animate={isLoading ? { 
              scale: [1, 1.1, 1],
              opacity: [1, 0.7, 1]
            } : {}}
            transition={{ duration: 1.5, repeat: isLoading ? Infinity : 0 }}
          >
            <Sparkles className={`w-5 h-5 ${isLoading ? 'text-primary animate-pulse' : 'text-primary/60'}`} />
          </motion.div>
          
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask Hypermid anything..."
              disabled={disabled}
              rows={1}
              aria-label="Message input"
              className="w-full bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground/60 py-3 px-1 sm:px-2 max-h-[160px] scrollbar-thin text-sm sm:text-base leading-relaxed"
            />
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              type="submit"
              disabled={!message.trim() || isLoading || disabled}
              aria-label={isLoading ? "Sending message..." : "Send message"}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-primary/25 border border-primary/50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </motion.div>
        
        <motion.p 
          className="text-[10px] sm:text-xs text-muted-foreground/50 text-center mt-3 px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Hypermid AI is powered by advanced language models • Press Enter to send
        </motion.p>
      </form>
    </div>
  );
}
