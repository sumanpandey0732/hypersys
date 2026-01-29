import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Sparkles, Image, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatInputProps {
  onSend: (message: string, images?: string[]) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || attachedImages.length > 0) && !isLoading && !disabled) {
      onSend(message.trim(), attachedImages.length > 0 ? attachedImages : undefined);
      setMessage('');
      setAttachedImages([]);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setAttachedImages(prev => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const canSend = (message.trim() || attachedImages.length > 0) && !isLoading && !disabled;

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-gradient-to-t from-background via-background/95 to-transparent safe-area-inset-bottom">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <motion.div
          initial={false}
          animate={{ 
            scale: isFocused ? 1.005 : 1,
          }}
          transition={{ duration: 0.2 }}
          className={`
            relative bg-secondary/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl 
            border transition-all duration-300
            ${isFocused 
              ? 'border-primary/40 shadow-[0_0_0_1px_hsla(172,66%,50%,0.2),0_8px_40px_-12px_hsla(172,66%,50%,0.3)]' 
              : 'border-border/40 shadow-lg shadow-black/5'
            }
          `}
        >
          {/* Attached Images Preview */}
          <AnimatePresence>
            {attachedImages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 border-b border-border/30 flex gap-2 flex-wrap"
              >
                {attachedImages.map((img, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group"
                  >
                    <img
                      src={img}
                      alt={`Attached ${index + 1}`}
                      className="h-16 w-16 object-cover rounded-xl border border-border/50"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2 p-2 sm:p-3">
            {/* AI Indicator */}
            <motion.div 
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex-shrink-0 mb-0.5"
              animate={isLoading ? { 
                scale: [1, 1.1, 1],
                opacity: [1, 0.7, 1]
              } : {}}
              transition={{ duration: 1.5, repeat: isLoading ? Infinity : 0 }}
            >
              <Sparkles className={`w-4 h-4 ${isLoading ? 'text-primary animate-pulse' : 'text-primary/60'}`} />
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
                className="w-full bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground/50 py-2.5 px-1 max-h-[200px] scrollbar-thin text-sm sm:text-base leading-relaxed"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 flex-shrink-0 mb-0.5">
              {/* Image Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || disabled}
                className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all disabled:opacity-30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Attach image"
              >
                <Image className="w-5 h-5" />
              </motion.button>

              {/* Send Button */}
              <motion.div
                whileHover={canSend ? { scale: 1.05 } : {}}
                whileTap={canSend ? { scale: 0.95 } : {}}
              >
                <Button
                  type="submit"
                  disabled={!canSend}
                  aria-label={isLoading ? "Sending message..." : "Send message"}
                  className={`
                    w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all duration-300
                    ${canSend 
                      ? 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 border border-primary/50' 
                      : 'bg-muted text-muted-foreground border border-border/30'
                    }
                  `}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        <motion.p 
          className="text-[10px] sm:text-xs text-muted-foreground/40 text-center mt-3 px-2"
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
