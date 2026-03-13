import { motion } from 'framer-motion';
import { Sparkles, Copy, Check, Volume2, VolumeX, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import { useElevenLabsTTS } from '@/hooks/useElevenLabsTTS';
import { sanitizeAssistantText } from '@/lib/chat-format';

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
    <div className="relative group my-5 rounded-2xl overflow-hidden border border-border/40 bg-card shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-secondary/90 to-secondary/70 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-muted-foreground/70 font-mono ml-2 uppercase tracking-wider">{language || 'code'}</span>
        </div>
        <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/60 hover:bg-background text-xs text-muted-foreground hover:text-foreground transition-all border border-border/20">
          {copied ? <><Check className="w-3.5 h-3.5 text-primary" /><span className="text-primary font-medium">Copied!</span></> : <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>}
        </button>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language || 'text'}
          style={oneDark}
          customStyle={{ margin: 0, padding: '1.25rem 1.5rem', background: 'transparent', fontSize: '0.875rem', lineHeight: '1.7' }}
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
  const [copiedAll, setCopiedAll] = useState(false);
  const { speak, stop, isSpeaking, isLoading: isTTSLoading } = useElevenLabsTTS();

  const displayContent = isUser ? content : sanitizeAssistantText(content);

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(displayContent);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleSpeak = () => {
    if (isSpeaking) stop();
    else speak(displayContent);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`w-full ${isUser ? 'flex justify-end' : ''}`}
    >
      {isUser ? (
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 border border-primary/30 rounded-2xl rounded-br-md px-5 py-3.5 shadow-lg shadow-primary/10">
            <p className="text-sm sm:text-[15px] leading-relaxed text-foreground font-medium">{content}</p>
          </div>
        </div>
      ) : (
        <div className="w-full">
          {/* AI indicator + actions */}
          <div className="flex items-center gap-2 mb-3 justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">HyperSYS</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleSpeak} disabled={isTTSLoading}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all border ${isSpeaking ? 'bg-primary/20 text-primary border-primary/30' : isTTSLoading ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground border-border/30 hover:border-primary/30'}`}>
                {isTTSLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button type="button" onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-xs text-muted-foreground hover:text-foreground transition-all border border-border/30 hover:border-primary/30">
                {copiedAll ? <><Check className="w-3.5 h-3.5 text-primary" /><span className="text-primary font-medium">Copied</span></> : <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="w-full">
            {content ? (
              <div className="prose prose-lg sm:prose-xl prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-5 mt-8 first:mt-0 text-foreground bg-gradient-to-r from-primary/20 via-primary/10 to-transparent py-3 px-4 rounded-xl border-l-4 border-primary">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 mt-7 first:mt-0 text-foreground flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-primary/50 flex-shrink-0" />
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 mt-6 first:mt-0 text-foreground/95 border-b border-border/30 pb-2">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-[15px] sm:text-base md:text-lg leading-[1.85] mb-4 last:mb-0 text-foreground/90">{children}</p>
                    ),
                    ul: ({ children }) => <ul className="space-y-3 my-4 pl-0 list-none">{children}</ul>,
                    ol: ({ children }) => <ol className="space-y-3 my-4 pl-0 list-none">{children}</ol>,
                    li: ({ children }) => (
                      <li className="flex items-start gap-3 text-[15px] sm:text-base leading-relaxed text-foreground/90 bg-gradient-to-r from-secondary/45 via-secondary/30 to-primary/10 rounded-xl p-3.5 border border-border/20 hover:border-primary/30 hover:from-secondary/60 hover:to-primary/15 transition-all duration-200 shadow-sm">
                        <span className="flex-shrink-0 mt-2 w-2 h-2 rounded-full bg-primary/70" />
                        <span className="flex-1">{children}</span>
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-extrabold gradient-text">{children}</strong>
                    ),
                    em: ({ children }) => <em className="italic text-primary/90">{children}</em>,
                    blockquote: ({ children }) => (
                      <blockquote className="my-5 pl-5 py-3 border-l-4 border-primary/40 bg-primary/5 rounded-r-xl text-foreground/85 italic">{children}</blockquote>
                    ),
                    code: ({ className, children }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      if (!match) {
                        return <code className="px-2 py-0.5 rounded-md bg-primary/15 text-primary font-mono text-[0.9em] border border-primary/20">{children}</code>;
                      }
                      return <CodeBlock language={match[1]}>{String(children).replace(/\n$/, '')}</CodeBlock>;
                    },
                    pre: ({ children }) => <>{children}</>,
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline underline-offset-4">{children}</a>
                    ),
                    table: ({ children }) => (
                      <div className="my-5 overflow-x-auto rounded-2xl border border-border/40 shadow-lg">
                        <table className="w-full text-base">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => <th className="px-5 py-3 text-left font-bold bg-primary/10 border-b border-border/40 text-foreground">{children}</th>,
                    td: ({ children }) => <td className="px-5 py-3 border-b border-border/20 text-foreground/85">{children}</td>,
                    hr: () => <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />,
                    img: ({ src, alt }) => (
                      <div className="my-5 rounded-2xl overflow-hidden border border-border/30 shadow-2xl">
                        <img src={src} alt={alt || ''} className="w-full h-auto" />
                      </div>
                    ),
                  }}
                >
                  {displayContent}
                </ReactMarkdown>
              </div>
            ) : isStreaming ? (
              <div className="flex items-center gap-3 py-2">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="w-2 h-2 rounded-full bg-primary"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
                <span className="text-sm text-primary/80 font-medium">Thinking...</span>
              </div>
            ) : null}

            {isStreaming && content && (
              <motion.span className="inline-block w-0.5 h-5 bg-primary ml-0.5 align-middle rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
