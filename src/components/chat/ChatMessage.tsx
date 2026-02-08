import { motion } from 'framer-motion';
import { Sparkles, Copy, Check, Volume2, VolumeX, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import { useElevenLabsTTS } from '@/hooks/useElevenLabsTTS';

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
      {/* macOS-style header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-secondary/90 to-secondary/70 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/80 shadow-inner" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-inner" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-inner" />
          </div>
          <span className="text-xs text-muted-foreground/70 font-mono ml-2 uppercase tracking-wider">{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/60 hover:bg-background text-xs text-muted-foreground hover:text-foreground transition-all duration-200 border border-border/20"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
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
            padding: '1.25rem 1.5rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.7',
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

function formatAssistantContent(raw: string) {
  if (!raw) return raw;

  let text = raw;

  // Comprehensive emoji list for bullet points
  const emojiBullets = [
    '✨', '🎯', '💡', '✅', '🌙', '📱', '🛏️', '⭐', '🔥', '💪', '🚀', '📌', '👀', '❤️', '💫', 
    '🌟', '⚡', '🎉', '👍', '💯', '🔑', '📝', '💻', '🎨', '🌈', '☀️', '🌺', '🍀', '🎁', '💎', 
    '🏆', '🥇', '✔️', '❌', '⚠️', '💬', '🤔', '😊', '😎', '🙌', '👏', '☑️', '🤗', '💖', '🎶',
    '📚', '🧠', '💼', '🌍', '🔮', '🎭', '🎪', '🎢', '🎡', '🎠', '🏠', '🏡', '🏢', '🌸', '🌻',
    '🌼', '🌷', '🌹', '🍎', '🍊', '🍋', '🍇', '🍓', '🥑', '🥕', '🌽', '🥦', '🧩', '🎮', '🎲',
    '👉', '👆', '👇', '👈', '🔹', '🔸', '▶️', '⬛', '⬜', '🟢', '🔵', '🟡', '🟠', '🔴', '🟣'
  ];
  
  // Force double line breaks before emoji bullets
  emojiBullets.forEach(emoji => {
    const escapedEmoji = emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Emoji followed by bold text
    text = text.replace(new RegExp(`([^\\n])\\s*(${escapedEmoji})\\s*\\*\\*`, 'g'), '$1\n\n$2 **');
    // Emoji followed by regular text
    text = text.replace(new RegExp(`([^\\n])\\s*(${escapedEmoji})\\s+([^*\\n])`, 'g'), '$1\n\n$2 $3');
    // Emoji at start of a cramped line
    text = text.replace(new RegExp(`\\n(${escapedEmoji})\\s*\\*\\*`, 'g'), '\n\n$1 **');
  });

  // Force line breaks for various bullet styles
  text = text.replace(/([^\n])\s*•\s+/g, '$1\n\n• ');
  text = text.replace(/([^\n])\s*►\s+/g, '$1\n\n► ');
  text = text.replace(/([^\n])\s*→\s+/g, '$1\n\n→ ');
  text = text.replace(/([^\n])\s*➤\s+/g, '$1\n\n➤ ');
  text = text.replace(/([^\n])\s*-\s+\*\*/g, '$1\n\n- **');
  
  // Force line breaks for numbered lists with bold
  text = text.replace(/([^\n])(\d+\.\s*\*\*)/g, '$1\n\n$2');
  
  // Force line breaks for headers
  text = text.replace(/([^\n])(#{1,3}\s)/g, '$1\n\n$2');
  
  // Ensure dash-based dividers are spaced
  text = text.replace(/([^\n])(\n---\n)/g, '$1\n\n---\n\n');

  // Clean up but preserve intentional spacing
  return text
    .replace(/^\n+/, '')
    .replace(/\n{5,}/g, '\n\n\n')
    .trim();
}

export default function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';
  const [copiedAll, setCopiedAll] = useState(false);
  const { speak, stop, isSpeaking, isLoading: isTTSLoading } = useElevenLabsTTS();

  const assistantContent = isUser ? content : formatAssistantContent(content);

  const handleCopyAll = async () => {
    if (!assistantContent) return;
    await navigator.clipboard.writeText(assistantContent);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleSpeak = () => {
    if (!assistantContent) return;
    
    if (isSpeaking) {
      stop();
    } else {
      speak(assistantContent);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`w-full ${isUser ? 'flex justify-end' : ''}`}
    >
      {isUser ? (
        // User message - right aligned, premium bubble
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 border border-primary/30 rounded-2xl rounded-br-md px-5 py-3.5 shadow-lg shadow-primary/10">
            <p className="text-sm sm:text-[15px] leading-relaxed text-foreground font-medium">
              {content}
            </p>
          </div>
        </div>
      ) : (
        // AI message - full width, premium design
        <div className="w-full">
          {/* AI indicator */}
          <div className="flex items-center gap-2 mb-3 justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Hypermid</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Speak button - ElevenLabs powered */}
              <button
                type="button"
                onClick={handleSpeak}
                disabled={isTTSLoading}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 border ${
                  isSpeaking 
                    ? 'bg-primary/20 text-primary border-primary/30 shadow-lg shadow-primary/20' 
                    : isTTSLoading
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground border-border/30 hover:border-primary/30'
                }`}
                aria-label={isSpeaking ? "Stop speaking" : "Read aloud"}
              >
                {isTTSLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSpeaking ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              {/* Copy button */}
              <button
                type="button"
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-xs text-muted-foreground hover:text-foreground transition-all duration-200 border border-border/30 hover:border-primary/30"
                aria-label="Copy answer"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span className="text-primary font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Message content */}
          <div className="w-full">
            {content ? (
              <div className="prose prose-lg sm:prose-xl prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-3xl sm:text-4xl font-bold mb-5 mt-8 first:mt-0 text-foreground bg-gradient-to-r from-primary/25 via-primary/15 to-transparent py-3 px-4 rounded-xl border-l-4 border-primary shadow-lg">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl sm:text-3xl font-bold mb-4 mt-7 first:mt-0 text-foreground flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-primary/50 animate-pulse shadow-lg shadow-primary/30" />
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl sm:text-2xl font-semibold mb-3 mt-6 first:mt-0 text-foreground/95 border-b border-border/30 pb-2">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-base sm:text-lg leading-[1.9] mb-5 last:mb-0 text-foreground/90">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="space-y-4 my-5 pl-0 list-none">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="space-y-4 my-5 pl-0 list-none counter-reset-[item]">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="flex items-start gap-4 text-base sm:text-lg leading-relaxed text-foreground/90 bg-gradient-to-r from-secondary/50 via-secondary/30 to-transparent rounded-xl p-4 border border-border/20 hover:border-primary/30 hover:bg-secondary/60 transition-all duration-300 shadow-sm hover:shadow-md">
                        <span className="flex-shrink-0 mt-2 w-3 h-3 rounded-full bg-gradient-to-br from-primary via-primary/70 to-primary/40 shadow-lg shadow-primary/40 animate-pulse" />
                        <span className="flex-1">{children}</span>
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-foreground bg-gradient-to-r from-primary/20 to-primary/10 px-2 py-0.5 rounded-md border border-primary/20">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-primary/90 font-medium">{children}</em>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="my-5 pl-5 py-4 border-l-4 border-gradient-to-b from-primary to-primary/50 bg-gradient-to-r from-primary/10 to-transparent rounded-r-xl text-foreground/85 italic shadow-lg">
                        {children}
                      </blockquote>
                    ),
                    code: ({ className, children }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match;
                      
                      if (isInline) {
                        return (
                          <code className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-mono text-[0.9em] border border-primary/25 shadow-sm">
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
                        className="text-primary font-semibold hover:underline decoration-primary/50 underline-offset-4 transition-all hover:text-primary/80 hover:decoration-primary"
                      >
                        {children}
                      </a>
                    ),
                    table: ({ children }) => (
                      <div className="my-5 overflow-x-auto rounded-2xl border border-border/40 shadow-xl">
                        <table className="w-full text-base">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="px-5 py-4 text-left font-bold bg-gradient-to-r from-primary/15 to-primary/5 border-b border-border/40 text-foreground">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-5 py-4 border-b border-border/20 text-foreground/85">
                        {children}
                      </td>
                    ),
                    hr: () => (
                      <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                    ),
                    img: ({ src, alt }) => (
                      <div className="my-5 rounded-2xl overflow-hidden border border-border/30 shadow-2xl">
                        <img src={src} alt={alt || ''} className="w-full h-auto" />
                      </div>
                    ),
                  }}
                >
                  {assistantContent}
                </ReactMarkdown>
              </div>
            ) : isStreaming ? (
              <div className="flex items-center gap-3 py-2">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span 
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ 
                        scale: [1, 1.4, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 0.7,
                        repeat: Infinity,
                        delay: i * 0.15,
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
                className="inline-block w-0.5 h-5 bg-primary ml-0.5 align-middle rounded-full"
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
