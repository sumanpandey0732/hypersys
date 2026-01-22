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
    <div className="relative group my-4 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1d24] border-b border-border/30">
        <span className="text-xs font-mono text-muted-foreground">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: '#0d1117',
          fontSize: '0.875rem',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

export default function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.23, 1, 0.32, 1]
      }}
      className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <motion.div 
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Sparkles className="w-5 h-5 text-primary" />
        </motion.div>
      )}
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={`
          max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4
          ${isUser 
            ? 'message-user rounded-br-sm' 
            : 'message-assistant rounded-bl-sm'
          }
        `}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none transition-all duration-200">
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
                          className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-sm font-mono" 
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
                    return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="mb-3 ml-4 space-y-1 list-disc marker:text-primary/60">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="mb-3 ml-4 space-y-1 list-decimal marker:text-primary/60">{children}</ol>;
                  },
                  li({ children }) {
                    return <li className="leading-relaxed">{children}</li>;
                  },
                  h1({ children }) {
                    return <h1 className="text-xl font-display font-bold mb-3 mt-4 first:mt-0 gradient-text">{children}</h1>;
                  },
                  h2({ children }) {
                    return <h2 className="text-lg font-display font-semibold mb-2 mt-4 first:mt-0 text-foreground">{children}</h2>;
                  },
                  h3({ children }) {
                    return <h3 className="text-base font-display font-semibold mb-2 mt-3 first:mt-0 text-foreground/90">{children}</h3>;
                  },
                  strong({ children }) {
                    return <strong className="font-semibold text-foreground">{children}</strong>;
                  },
                  em({ children }) {
                    return <em className="italic text-foreground/90">{children}</em>;
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-2 border-primary/50 pl-4 my-3 italic text-muted-foreground">
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
                        className="text-primary hover:underline"
                      >
                        {children}
                      </a>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-3">
                        <table className="w-full border-collapse border border-border/50 rounded-lg overflow-hidden">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="bg-secondary/50 px-4 py-2 text-left font-semibold border border-border/30">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="px-4 py-2 border border-border/30">
                        {children}
                      </td>
                    );
                  },
                  hr() {
                    return <hr className="my-4 border-border/50" />;
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            ) : isStreaming ? (
              <div className="typing-indicator flex gap-1.5 py-2">
                <motion.span 
                  className="w-2.5 h-2.5 rounded-full bg-primary/60"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.span 
                  className="w-2.5 h-2.5 rounded-full bg-primary/60"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.span 
                  className="w-2.5 h-2.5 rounded-full bg-primary/60"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            ) : null}
          </div>
        )}
      </motion.div>

      {isUser && (
        <motion.div 
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center border border-border/50"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <User className="w-5 h-5 text-foreground/70" />
        </motion.div>
      )}
    </motion.div>
  );
}
