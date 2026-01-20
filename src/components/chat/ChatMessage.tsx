import { motion } from 'framer-motion';
import { User, Sparkles } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export default function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
      )}
      
      <div
        className={`
          max-w-[80%] md:max-w-[70%] rounded-2xl px-5 py-4
          ${isUser 
            ? 'message-user rounded-br-sm' 
            : 'message-assistant rounded-bl-sm'
          }
        `}
      >
        <div className="prose prose-invert prose-sm max-w-none">
          {content.split('\n').map((line, i) => (
            <p key={i} className={`${i > 0 ? 'mt-2' : ''} text-sm leading-relaxed`}>
              {line || <br />}
            </p>
          ))}
          {isStreaming && !content && (
            <div className="typing-indicator flex gap-1">
              <span className="w-2 h-2 rounded-full bg-primary/60" />
              <span className="w-2 h-2 rounded-full bg-primary/60" />
              <span className="w-2 h-2 rounded-full bg-primary/60" />
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <User className="w-5 h-5 text-foreground/70" />
        </div>
      )}
    </motion.div>
  );
}
