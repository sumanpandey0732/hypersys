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
    <div className="relative group my-4 rounded-xl overflow-hidden border border-border/40 bg-card">
      {/* macOS-style header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/80 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-muted-foreground/60 font-mono ml-2">{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background/50 hover:bg-background text-xs text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-primary" />
              <span className="text-primary">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language || 'text'}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: '1rem 1.25rem',
            background: 'transparent',
            fontSize: '0.85rem',
            lineHeight: '1.6',
          }}
          showLineNumbers={children.split('\n').length > 3}
          lineNumberStyle={{ opacity: 0.4, minWidth: '2.5em' }}
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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`flex gap-3 sm:gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <motion.div
        className={`
          flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center
          ${isUser 
            ? 'bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30' 
            : 'bg-gradient-to-br from-primary/25 to-primary/10 border border-primary/30'
          }
        `}
        whileHover={{ scale: 1.05 }}
      >
        {isUser ? (
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
        ) : (
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        )}
      </motion.div>

      {/* Message Content */}
      <div className={`flex-1 min-w-0 max-w-[85%] sm:max-w-[80%] ${isUser ? 'flex justify-end' : ''}`}>
        {/* Role label */}
        <div className={`mb-1.5 ${isUser ? 'text-right' : ''}`}>
          <span className={`text-xs font-semibold tracking-wide ${isUser ? 'text-accent/80' : 'text-primary/80'}`}>
            {isUser ? 'YOU' : 'HYPERMID'}
          </span>
        </div>

        {/* Message bubble */}
        <div
          className={`
            relative rounded-2xl px-4 sm:px-5 py-3 sm:py-4 overflow-hidden
            ${isUser 
              ? 'bg-gradient-to-br from-accent/15 via-accent/10 to-accent/5 border border-accent/25 text-foreground' 
              : 'bg-gradient-to-br from-secondary/80 via-secondary/60 to-secondary/40 border border-border/40'
            }
          `}
        >
          {/* Subtle inner glow for AI messages */}
          {!isUser && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          )}

          {isUser ? (
            <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words font-medium">
              {content}
            </p>
          ) : (
            <div className="relative prose prose-sm sm:prose-base prose-invert max-w-none">
              {content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-xl sm:text-2xl font-bold mb-4 mt-6 first:mt-0 text-foreground flex items-center gap-2">
                        <span className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg sm:text-xl font-bold mb-3 mt-5 first:mt-0 text-foreground flex items-center gap-2">
                        <span className="w-1 h-5 bg-gradient-to-b from-primary/80 to-primary/30 rounded-full" />
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base sm:text-lg font-semibold mb-2 mt-4 first:mt-0 text-foreground/90">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-sm sm:text-[15px] leading-[1.8] mb-4 last:mb-0 text-foreground/90">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="space-y-2 my-4 pl-0">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="space-y-2 my-4 pl-0 list-none counter-reset-item">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="flex items-start gap-3 text-sm sm:text-[15px] leading-relaxed text-foreground/85">
                        <span className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent" />
                        <span className="flex-1">{children}</span>
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-primary">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-foreground/80">{children}</em>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="relative my-4 pl-4 py-2 border-l-2 border-primary/50 bg-primary/5 rounded-r-lg italic text-foreground/80">
                        {children}
                      </blockquote>
                    ),
                    code: ({ className, children }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match;
                      
                      if (isInline) {
                        return (
                          <code className="px-1.5 py-0.5 rounded-md bg-primary/15 text-primary font-mono text-[0.85em] border border-primary/20">
                            {children}
                          </code>
                        );
                      }
                      
                      return (
                        <CodeBlock language={match[1]}>
                          {String(children).replace(/\n$/, '')}
                        </CodeBlock>
                      );
                    },
                    pre: ({ children }) => <>{children}</>,
                    a: ({ href, children }) => (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                      >
                        {children}
                      </a>
                    ),
                    table: ({ children }) => (
                      <div className="my-4 overflow-x-auto rounded-lg border border-border/40">
                        <table className="w-full text-sm">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="px-4 py-2.5 text-left font-semibold bg-secondary/60 border-b border-border/40 text-foreground">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-4 py-2.5 border-b border-border/20 text-foreground/80">
                        {children}
                      </td>
                    ),
                    hr: () => (
                      <hr className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                    ),
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

              {/* Streaming cursor */}
              {isStreaming && content && (
                <motion.span
                  className="inline-block w-2 h-5 bg-primary rounded-sm ml-1 align-middle"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
