import { useEffect, useState, useRef } from 'react';
import { getGeminiRateLimitInfo } from '../services/geminiService';

/**
 * Polls in-memory Gemini rate limit info and exposes countdown.
 * Lightweight (1s interval) and auto-stops when coolingDown=false.
 */
export default function useGeminiRateLimit() {
  const [coolingDown, setCoolingDown] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const info = getGeminiRateLimitInfo();
      setCoolingDown(info.coolingDown);
      setRetryAfterSeconds(info.retryAfterSeconds);
      if (!info.coolingDown && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // Initial read
    tick();
    if (!timerRef.current) {
      timerRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { coolingDown, retryAfterSeconds };
}
