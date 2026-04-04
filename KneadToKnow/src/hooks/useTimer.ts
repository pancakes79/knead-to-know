import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface UseTimerOptions {
  totalSeconds: number;
  label: string;
  onComplete?: () => void;
  autoStart?: boolean;
}

interface UseTimerReturn {
  remaining: number;
  isRunning: boolean;
  isComplete: boolean;
  progress: number; // 0 to 1
  formattedTime: string;
  start: () => void;
  pause: () => void;
  reset: () => void;
  toggle: () => void;
}

export function useTimer({
  totalSeconds,
  label,
  onComplete,
  autoStart = false,
}: UseTimerOptions): UseTimerReturn {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [endTime, setEndTime] = useState<number | null>(null);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notificationIdRef = useRef<string | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const backgroundEndTimeRef = useRef<number | null>(null);
  const remainingRef = useRef(remaining);
  const isRunningRef = useRef(isRunning);
  const labelRef = useRef(label);

  // Keep refs synced with state
  useEffect(() => { remainingRef.current = remaining; }, [remaining]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { labelRef.current = label; }, [label]);

  // Request notification permissions on first use
  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

    // Keep refs synced with state
  useEffect(() => { remainingRef.current = remaining; }, [remaining]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { labelRef.current = label; }, [label]);

  // Handle app going to background — schedule notification
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (state: AppStateStatus) => {
      if (state === 'background' && isRunningRef.current && remainingRef.current > 0) {
        
        // 1. ALWAYS save the background timestamp first
        backgroundEndTimeRef.current = Date.now() + remainingRef.current * 1000;

        // 2. Try to schedule notification, but catch the error if they denied permissions
        try {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: '🍞 Knead to Know',
              body: `${labelRef.current} — Timer complete!`,
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: remainingRef.current,
            },
          });
          notificationIdRef.current = id;
        } catch (e) {
          // User denied permissions. Silent catch, the timer will still sync mathematically!
        }

      // 3. REMOVED the notification ID check. Depend purely on the background timestamp.
      } else if (state === 'active' && backgroundEndTimeRef.current) {
        
        // Clean up the notification if one was successfully created
        if (notificationIdRef.current) {
          await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
          notificationIdRef.current = null;
        }
        
        const expectedEndTime = backgroundEndTimeRef.current;
        const newRemaining = Math.max(0, Math.round((expectedEndTime - Date.now()) / 1000));
        setRemaining(newRemaining);
        backgroundEndTimeRef.current = null;
        
        if (newRemaining <= 0) {
          setIsRunning(false);
          onCompleteRef.current?.();
        }
      }
    });

    return () => subscription.remove();
  }, []);

  // Core timer interval
  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsRunning(false);
            onCompleteRef.current?.();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const start = useCallback(() => {
    if (remaining > 0) setIsRunning(true);
  }, [remaining]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setRemaining(totalSeconds);
    setEndTime(null);
    if (notificationIdRef.current) {
      Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
      notificationIdRef.current = null;
    }
  }, [totalSeconds]);

  const toggle = useCallback(() => {
    if (isRunning) pause();
    else start();
  }, [isRunning, pause, start]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progress = totalSeconds > 0 ? (totalSeconds - remaining) / totalSeconds : 0;

  return {
    remaining,
    isRunning,
    isComplete: remaining === 0,
    progress,
    formattedTime,
    start,
    pause,
    reset,
    toggle,
  };
}
