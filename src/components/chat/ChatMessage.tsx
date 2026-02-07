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

  // Comprehensive emoji list for bullet points
  const emojiBullets = [
    '✨', '🎯', '💡', '✅', '🌙', '📱', '🛏️', '⭐', '🔥', '💪', '🚀', '📌', '👀', '❤️', '💫', 
    '🌟', '⚡', '🎉', '👍', '💯', '🔑', '📝', '💻', '🎨', '🌈', '☀️', '🌺', '🍀', '🎁', '💎', 
    '🏆', '🥇', '✔️', '❌', '⚠️', '💬', '🤔', '😊', '😎', '🙌', '👏', '☑️', '🤗', '💖', '🎶',
    '📚', '🧠', '💼', '🌍', '🔮', '🎭', '🎪', '🎢', '🎡', '🎠', '🏠', '🏡', '🏢', '🌸', '🌻',
    '🌼', '🌷', '🌹', '🍎', '🍊', '🍋', '🍇', '🍓', '🥑', '🥕', '🌽', '🥦', '🧩', '🎮', '🎲'
  ];
  
  // Force double line breaks before emoji bullets
  emojiBullets.forEach(emoji => {
    const escapedEmoji = emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Emoji followed by bold text
    text = text.replace(new RegExp(`([^\\n])\\s*(${escapedEmoji})\\s*\\*\\*`, 'g'), '$1\n\n$2 **');
    // Emoji followed by regular text
    text = text.replace(new RegExp(`([^\\n])\\s*(${escapedEmoji})\\s+([^*])`, 'g'), '$1\n\n$2 $3');
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

    // Clean text for speech - remove markdown formatting
    const cleanText = assistantContent
      .replace(/\*\*/g, '') // Remove bold
      .replace(/\*/g, '')   // Remove italics
      .replace(/`/g, '')    // Remove code blocks
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/[-•►→➤✨🎯💡✅🌟⭐💪🚀📌❤️💫⚡🎉👍💯🔑📝💻🎨🌈☀️💎🏆🤔😊😎🙌👏🤗💖]/g, '') // Remove bullets/emojis
      .replace(/\n{2,}/g, '. ') // Convert double newlines to pauses
      .replace(/\n/g, ' ')
      .trim();

    // Create utterance with optimized settings
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95; // Slightly slower for clarity
    utterance.pitch = 1.05; // Slightly higher for friendliness
    utterance.volume = 1.0;
    
    // Wait for voices to load then select best one
    const selectVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      
      // Priority order for natural-sounding voices
      const voicePreferences = [
        'Google UK English Female',
        'Google US English',
        'Samantha',
        'Microsoft Zira',
        'Karen',
        'Moira',
        'Tessa',
      ];
      
      let selectedVoice = voices.find(v => 
        voicePreferences.some(pref => v.name.includes(pref))
      );
      
      // Fallback to any English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('en'));
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    };

    // Try to select voice immediately or wait for voices to load
    if (window.speechSynthesis.getVoices().length > 0) {
      selectVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = selectVoice;
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
              <div className="prose prose-base sm:prose-lg prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl sm:text-3xl font-bold mb-4 mt-6 first:mt-0 text-foreground bg-gradient-to-r from-primary/20 to-transparent py-2 px-3 rounded-lg border-l-4 border-primary">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl sm:text-2xl font-bold mb-3 mt-5 first:mt-0 text-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg sm:text-xl font-semibold mb-2 mt-4 first:mt-0 text-foreground/95">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-base sm:text-lg leading-[1.85] mb-4 last:mb-0 text-foreground/90">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="space-y-3 my-4 pl-0 list-none">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="space-y-3 my-4 pl-0 list-none counter-reset-[item]">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="flex items-start gap-3 text-base sm:text-lg leading-relaxed text-foreground/90 bg-secondary/30 rounded-xl p-3 border border-border/20 hover:bg-secondary/50 transition-colors">
                        <span className="flex-shrink-0 mt-1.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary to-primary/50 shadow-sm shadow-primary/30" />
                        <span className="flex-1">{children}</span>
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-foreground bg-primary/10 px-1.5 py-0.5 rounded">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-primary/90">{children}</em>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="my-4 pl-4 py-3 border-l-4 border-primary/60 bg-primary/5 rounded-r-xl text-foreground/85 italic">
                        {children}
                      </blockquote>
                    ),
                    code: ({ className, children }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match;
                      
                      if (isInline) {
                        return (
                          <code className="px-2 py-1 rounded-lg bg-primary/15 text-primary font-mono text-[0.9em] border border-primary/20">
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
                        className="text-primary font-medium hover:underline decoration-primary/50 underline-offset-2 transition-all hover:text-primary/80"
                      >
                        {children}
                      </a>
                    ),
                    table: ({ children }) => (
                      <div className="my-4 overflow-x-auto rounded-xl border border-border/40 shadow-lg">
                        <table className="w-full text-base">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="px-4 py-3 text-left font-bold bg-primary/10 border-b border-border/40 text-foreground">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-4 py-3 border-b border-border/20 text-foreground/85">
                        {children}
                      </td>
                    ),
                    hr: () => (
                      <hr className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
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