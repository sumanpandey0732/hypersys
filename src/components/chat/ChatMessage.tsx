import { motion } from 'framer-motion';
import { Sparkles, Copy, Check, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState, useRef } from 'react';

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

function formatAssistantContent(raw: string) {
  if (!raw) return raw;

  let text = raw;

  // Ensure emoji bullets start their own paragraph
  const emojiBullets = ['✨', '🎯', '💡', '✅', '🌙', '📱', '🛏️', '⭐', '🔥', '💪', '🚀', '📌', '👀', '❤️', '💫', '🌟', '⚡', '🎉', '👍', '💯', '🔑', '📝', '💻', '🎨', '🌈', '☀️', '🌺', '🍀', '🎁', '💎', '🏆', '🥇', '✔️', '❌', '⚠️', '💬', '🤔', '😊', '😎', '🙌', '👏', '☑️'];
  
  emojiBullets.forEach(emoji => {
    const escapedEmoji = emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`([^\\n])\\s*(${escapedEmoji})\\s*\\*\\*`, 'g'), '$1\n\n$2 **');
    text = text.replace(new RegExp(`([^\\n])\\s*(${escapedEmoji})\\s+`, 'g'), '$1\n\n$2 ');
  });

  // Ensure regular bullets start their own paragraph
  text = text.replace(/([^\n])\s*•\s+/g, '$1\n\n• ');
  text = text.replace(/([^\n])\s*►\s+/g, '$1\n\n► ');
  text = text.replace(/([^\n])\s*→\s+/g, '$1\n\n→ ');
  text = text.replace(/([^\n])\s*➤\s+/g, '$1\n\n➤ ');
  
  // Ensure numbered points start their own paragraph
  text = text.replace(/([^\n])(\d+\.\s*\*\*)/g, '$1\n\n$2');

  // Clean up excessive newlines
  return text.replace(/^\n+/, '').replace(/\n{4,}/g, '\n\n\n');
}

export default function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';
  const [copiedAll, setCopiedAll] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

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
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(assistantContent);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to use a natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || 
      v.name.includes('Samantha') || 
      v.name.includes('Natural') ||
      v.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`w-full ${isUser ? 'flex justify-end' : ''}`}
    >
      {isUser ? (
        // User message - right aligned, compact bubble
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="bg-primary/15 border border-primary/25 rounded-2xl rounded-br-md px-4 py-3">
            <p className="text-sm sm:text-[15px] leading-relaxed text-foreground">
              {content}
            </p>
          </div>
        </div>
      ) : (
        // AI message - full width, clean design
        <div className="w-full">
          {/* AI indicator */}
          <div className="flex items-center gap-2 mb-2 justify-between">
            <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-medium text-primary/70">Hypermid</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Speak button */}
              <button
                type="button"
                onClick={handleSpeak}
                className={`flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200 border ${
                  isSpeaking 
                    ? 'bg-primary/20 text-primary border-primary/30' 
                    : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground border-border/30'
                }`}
                aria-label={isSpeaking ? "Stop speaking" : "Read aloud"}
              >
                {isSpeaking ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Copy button */}
              <button
                type="button"
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/50 hover:bg-secondary text-xs text-muted-foreground hover:text-foreground transition-all duration-200 border border-border/30"
                aria-label="Copy answer"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-3 h-3 text-primary" />
                    <span className="text-primary">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Message content */}
          <div className="w-full">
            {content ? (
              <div className="prose prose-sm sm:prose-base prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-lg sm:text-xl font-bold mb-3 mt-4 first:mt-0 text-foreground">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-base sm:text-lg font-bold mb-2 mt-3 first:mt-0 text-foreground">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm sm:text-base font-semibold mb-2 mt-3 first:mt-0 text-foreground">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-sm sm:text-[15px] leading-[1.75] mb-3 last:mb-0 text-foreground/90">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="space-y-2 my-3 pl-0 list-none">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="space-y-2 my-3 pl-0 list-none">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="flex items-start gap-2 text-sm sm:text-[15px] leading-relaxed text-foreground/90">
                        <span className="flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                        <span className="flex-1">{children}</span>
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-foreground/80">{children}</em>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="my-3 pl-3 py-1 border-l-2 border-primary/40 text-foreground/80 italic">
                        {children}
                      </blockquote>
                    ),
                    code: ({ className, children }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match;
                      
                      if (isInline) {
                        return (
                          <code className="px-1.5 py-0.5 rounded bg-secondary text-primary font-mono text-[0.85em]">
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
                        className="text-primary hover:underline"
                      >
                        {children}
                      </a>
                    ),
                    table: ({ children }) => (
                      <div className="my-3 overflow-x-auto rounded-lg border border-border/40">
                        <table className="w-full text-sm">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="px-3 py-2 text-left font-semibold bg-secondary/50 border-b border-border/40 text-foreground">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3 py-2 border-b border-border/20 text-foreground/80">
                        {children}
                      </td>
                    ),
                    hr: () => (
                      <hr className="my-4 border-0 h-px bg-border/30" />
                    ),
                  }}
                >
                  {assistantContent}
                </ReactMarkdown>
              </div>
            ) : isStreaming ? (
              <div className="flex items-center gap-2 py-1">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span 
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            ) : null}

            {/* Streaming cursor */}
            {isStreaming && content && (
              <motion.span
                className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle"
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