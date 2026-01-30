import { motion } from 'framer-motion';
import { User, Sparkles, Copy, Check } from 'lucide-react';
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
    <div className="relative group my-4 rounded-xl overflow-hidden border border-primary/20 shadow-lg shadow-primary/5">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#1a1d24] to-[#0d1117] border-b border-primary/10">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs font-mono text-primary/70 uppercase tracking-wider ml-2">{language || 'code'}</span>
        </div>
        <motion.button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2.5 py-1.5 rounded-lg hover:bg-primary/10"
          whileTap={{ scale: 0.95 }}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 hidden sm:inline font-medium">Copied!</span>
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
            padding: '1.25rem',
            background: 'linear-gradient(180deg, #0d1117 0%, #0a0c10 100%)',
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className={`flex gap-3 sm:gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      role="article"
      aria-label={`${isUser ? 'Your' : 'AI'} message`}
    >
      {/* Avatar */}
      <motion.div 
        className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg ${
          isUser 
            ? 'bg-gradient-to-br from-secondary via-secondary/80 to-secondary/60 border border-border/50 shadow-secondary/20' 
            : 'bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 border border-primary/30 shadow-primary/20'
        }`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {isUser ? (
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-foreground/80" />
        ) : (
          <motion.div
            animate={isStreaming ? { rotate: [0, 360] } : {}}
            transition={isStreaming ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </motion.div>
        )}
      </motion.div>
      
      {/* Message Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={`
          flex-1 min-w-0 max-w-[calc(100%-3.5rem)] sm:max-w-[calc(100%-4rem)] rounded-2xl px-4 sm:px-5 py-3 sm:py-4
          ${isUser 
            ? 'bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/30 rounded-tr-md ml-auto max-w-[85%] sm:max-w-[75%] shadow-lg shadow-primary/10' 
            : 'bg-gradient-to-br from-secondary/90 via-secondary/70 to-secondary/50 border border-border/50 rounded-tl-md shadow-xl shadow-black/10'
          }
        `}
      >
        {isUser ? (
          <p className="text-sm sm:text-[15px] leading-relaxed break-words text-foreground/95 font-medium">{content}</p>
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
                          className="bg-primary/20 text-primary px-2 py-1 rounded-lg text-xs sm:text-sm font-mono font-medium break-all border border-primary/20" 
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
                    return <p className="mb-4 last:mb-0 leading-[1.75] text-sm sm:text-[15px] text-foreground/90">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="mb-4 ml-1 space-y-2 list-none">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="mb-4 ml-1 space-y-2 list-none counter-reset-item">{children}</ol>;
                  },
                  li({ children }) {
                    return (
                      <li className="leading-relaxed text-sm sm:text-[15px] text-foreground/90 flex items-start gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2.5" />
                        <span className="flex-1">{children}</span>
                      </li>
                    );
                  },
                  h1({ children }) {
                    return (
                      <h1 className="text-xl sm:text-2xl font-display font-bold mb-4 mt-6 first:mt-0 text-foreground flex items-center gap-3">
                        <span className="w-1 h-7 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                        <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">{children}</span>
                      </h1>
                    );
                  },
                  h2({ children }) {
                    return (
                      <h2 className="text-lg sm:text-xl font-display font-semibold mb-3 mt-5 first:mt-0 text-foreground flex items-center gap-2.5">
                        <span className="w-1 h-5 bg-gradient-to-b from-primary/80 to-primary/40 rounded-full" />
                        {children}
                      </h2>
                    );
                  },
                  h3({ children }) {
                    return <h3 className="text-base sm:text-lg font-display font-semibold mb-2.5 mt-4 first:mt-0 text-foreground/95">{children}</h3>;
                  },
                  strong({ children }) {
                    return <strong className="font-semibold text-foreground">{children}</strong>;
                  },
                  em({ children }) {
                    return <em className="italic text-primary/90">{children}</em>;
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-3 border-primary/60 pl-4 sm:pl-5 my-4 py-2 bg-gradient-to-r from-primary/10 to-transparent rounded-r-xl text-foreground/80 text-sm sm:text-[15px]">
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
                        className="text-primary hover:text-primary/80 underline underline-offset-4 decoration-primary/50 hover:decoration-primary transition-colors break-all font-medium"
                      >
                        {children}
                      </a>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-5 -mx-4 sm:mx-0 rounded-xl border border-border/50 shadow-lg">
                        <table className="w-full min-w-[400px] border-collapse text-sm">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  thead({ children }) {
                    return <thead className="bg-gradient-to-r from-secondary/80 to-secondary/60">{children}</thead>;
                  },
                  th({ children }) {
                    return (
                      <th className="px-4 sm:px-5 py-3 text-left font-semibold border-b border-border/40 text-xs sm:text-sm text-foreground">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="px-4 sm:px-5 py-3 border-b border-border/20 text-xs sm:text-sm text-foreground/80">
                        {children}
                      </td>
                    );
                  },
                  hr() {
                    return <hr className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />;
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            ) : isStreaming ? (
              <div className="flex items-center gap-3 py-1">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span 
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ 
                        scale: [1, 1.4, 1],
                        opacity: [0.4, 1, 0.4]
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
                <span className="text-sm text-primary/80 font-medium">Thinking...</span>
              </div>
            ) : null}
          </div>
        )}
      </motion.div>
    </motion.article>
  );
}
