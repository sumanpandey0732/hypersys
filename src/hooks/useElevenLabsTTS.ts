import { useState, useRef, useCallback } from 'react';

export function useElevenLabsTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    if (!text) return;

    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();

    setIsLoading(true);

    // Clean text for speech
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/[-•►→➤✨🎯💡✅🌟⭐💪🚀📌❤️💫⚡🎉👍💯🔑📝💻🎨🌈☀️💎🏆🤔😊😎🙌👏🤗💖🔥📍📚🌍🧠💼🌸🌻🌼🌷🌹🍎🎮🎲🧩🥑🥕🌽🥦🍓🍇🍋🍊👉🔹🔸▶️]/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim();

    try {
      // Create Audio element immediately (in user gesture context)
      const audio = new Audio();
      audio.preload = "auto";
      audioRef.current = audio;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: cleanText }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      audio.src = audioUrl;
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      setIsSpeaking(true);
      setIsLoading(false);
      await audio.play();
    } catch (error) {
      console.warn("ElevenLabs TTS failed, falling back to browser TTS:", error);
      
      // Fallback to browser's built-in TTS
      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;

        // Select best voice
        const voices = window.speechSynthesis.getVoices();
        const voicePreferences = [
          'Google UK English Female',
          'Google US English',
          'Samantha',
          'Microsoft Zira',
          'Karen',
        ];
        
        let selectedVoice = voices.find(v => 
          voicePreferences.some(pref => v.name.includes(pref))
        );
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.startsWith('en'));
        }
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        setIsSpeaking(true);
        setIsLoading(false);
        window.speechSynthesis.speak(utterance);
      } catch (fallbackError) {
        console.error("Browser TTS also failed:", fallbackError);
        setIsLoading(false);
        setIsSpeaking(false);
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, isLoading };
}
