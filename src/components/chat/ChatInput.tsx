import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
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
    <div className="p-3 sm:p-4 border-t border-border/50 bg-background/90 backdrop-blur-xl safe-area-inset-bottom">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <motion.div
          initial={false}
          animate={{ 
            scale: message.trim() ? 1.005 : 1,
            boxShadow: message.trim() 
              ? '0 0 30px hsla(172, 66%, 50%, 0.15)' 
              : '0 0 0px transparent'
          }}
          className="relative flex items-end gap-2 sm:gap-3 bg-secondary/50 rounded-xl sm:rounded-2xl border border-border/50 p-1.5 sm:p-2 transition-all duration-300 focus-within:border-primary/40 focus-within:bg-secondary/70"
        >
          {/* AI indicator */}
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-transparent">
            <Sparkles className="w-4 h-4 text-primary/60" />
          </div>
          
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Hypermid anything..."
            disabled={disabled}
            rows={1}
            aria-label="Message input"
            className="flex-1 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground py-2.5 sm:py-3 px-2 sm:px-3 max-h-[160px] scrollbar-thin text-sm sm:text-base leading-relaxed"
          />
          
          <Button
            type="submit"
            disabled={!message.trim() || isLoading || disabled}
            aria-label={isLoading ? "Sending message..." : "Send message"}
            className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-primary/20"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>
        </motion.div>
        
        <p className="text-[10px] sm:text-xs text-muted-foreground/60 text-center mt-2 sm:mt-3 px-2">
          Hypermid AI can make mistakes. Verify important information.
        </p>
      </form>
    </div>
  );
}
