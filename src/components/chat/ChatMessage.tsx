import { motion } from 'framer-motion';
import { User, Sparkles, Copy, Check, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

function CodeBlock({ language, children }: { language: string; children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-border/30">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[#1a1d24] border-b border-border/30">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wide">{language || 'code'}</span>
        <motion.button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-white/5"
          whileTap={{ scale: 0.95 }}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </motion.button>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language || 'text'}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: '#0d1117',
            fontSize: '0.8125rem',
          }}
          wrapLongLines
        >
          {children}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.23, 1, 0.32, 1]
      }}
      className={`flex gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      role="article"
      aria-label={`${isUser ? 'Your' : 'AI'} message`}
    >
      {/* Avatar */}
      <motion.div 
        className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${
          isUser 
            ? 'bg-gradient-to-br from-secondary to-secondary/50 border border-border/50' 
            : 'bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20'
        }`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {isUser ? (
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-foreground/70" />
        ) : (
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        )}
      </motion.div>
      
      {/* Message Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={`
          flex-1 min-w-0 max-w-[calc(100%-3rem)] sm:max-w-[calc(100%-4rem)] rounded-2xl px-3 sm:px-4 py-3 sm:py-4
          ${isUser 
            ? 'message-user rounded-tr-sm ml-auto max-w-[85%] sm:max-w-[75%]' 
            : 'message-assistant rounded-tl-sm'
          }
        `}
      >
        {isUser ? (
          <p className="text-sm sm:text-base leading-relaxed break-words">{content}</p>
        ) : (
          <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
            {content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !className;
                    
                    if (isInline) {
                      return (
                        <code 
                          className="bg-primary/15 text-primary px-1.5 py-0.5 rounded-md text-xs sm:text-sm font-mono break-all" 
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    
                    return (
                      <CodeBlock language={match?.[1] || ''}>
                        {String(children).replace(/\n$/, '')}
                      </CodeBlock>
                    );
                  },
                  p({ children }) {
                    return <p className="mb-3 last:mb-0 leading-relaxed text-sm sm:text-base">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="mb-3 ml-4 sm:ml-5 space-y-1.5 list-disc marker:text-primary/60">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="mb-3 ml-4 sm:ml-5 space-y-1.5 list-decimal marker:text-primary/60">{children}</ol>;
                  },
                  li({ children }) {
                    return <li className="leading-relaxed text-sm sm:text-base">{children}</li>;
                  },
                  h1({ children }) {
                    return (
                      <h1 className="text-lg sm:text-xl font-display font-bold mb-3 mt-5 first:mt-0 gradient-text flex items-center gap-2">
                        <span className="w-1 h-5 bg-primary rounded-full" />
                        {children}
                      </h1>
                    );
                  },
                  h2({ children }) {
                    return (
                      <h2 className="text-base sm:text-lg font-display font-semibold mb-2 mt-4 first:mt-0 text-foreground flex items-center gap-2">
                        <span className="w-1 h-4 bg-primary/60 rounded-full" />
                        {children}
                      </h2>
                    );
                  },
                  h3({ children }) {
                    return <h3 className="text-sm sm:text-base font-display font-semibold mb-2 mt-3 first:mt-0 text-foreground/90">{children}</h3>;
                  },
                  strong({ children }) {
                    return <strong className="font-semibold text-foreground">{children}</strong>;
                  },
                  em({ children }) {
                    return <em className="italic text-foreground/90">{children}</em>;
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-2 border-primary/50 pl-3 sm:pl-4 my-3 py-1 bg-primary/5 rounded-r-lg italic text-muted-foreground text-sm sm:text-base">
                        {children}
                      </blockquote>
                    );
                  },
                  a({ href, children }) {
                    return (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline underline-offset-2 break-all"
                      >
                        {children}
                      </a>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-4 -mx-3 sm:mx-0">
                        <table className="w-full min-w-[400px] border-collapse border border-border/50 rounded-lg overflow-hidden text-sm">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  thead({ children }) {
                    return <thead className="bg-secondary/50">{children}</thead>;
                  },
                  th({ children }) {
                    return (
                      <th className="px-3 sm:px-4 py-2 text-left font-semibold border border-border/30 text-xs sm:text-sm">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="px-3 sm:px-4 py-2 border border-border/30 text-xs sm:text-sm">
                        {children}
                      </td>
                    );
                  },
                  hr() {
                    return <hr className="my-4 sm:my-6 border-border/50" />;
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            ) : isStreaming ? (
              <div className="flex items-center gap-3 py-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span 
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary/60"
                      animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">Thinking...</span>
              </div>
            ) : null}
          </div>
        )}
      </motion.div>
    </motion.article>
  );
}
