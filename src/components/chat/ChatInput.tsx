import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <motion.div
          initial={false}
          animate={{ scale: message.trim() ? 1.01 : 1 }}
          className="relative flex items-end gap-3 bg-secondary/50 rounded-2xl border border-border/50 p-2 transition-all duration-200 focus-within:border-primary/30 focus-within:shadow-lg focus-within:shadow-primary/5"
        >
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Hypermid anything..."
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground py-3 px-3 max-h-[200px] scrollbar-thin"
          />
          
          <Button
            type="submit"
            disabled={!message.trim() || isLoading || disabled}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </motion.div>
        
        <p className="text-xs text-muted-foreground text-center mt-3">
          Hypermid AI can make mistakes. Verify important information.
        </p>
      </form>
    </div>
  );
}
