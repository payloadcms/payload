import * as React from 'react';

type Result = [boolean, () => void];
export const useDelay = (delay: number): Result => {
  const [hasDelayed, setHasDelayed] = React.useState(false);
  const triggerTimeoutRef = React.useRef<NodeJS.Timeout>();

  const triggerDelay = React.useCallback(() => {
    setHasDelayed(false);
    clearTimeout(triggerTimeoutRef.current);
    triggerTimeoutRef.current = setTimeout(() => {
      setHasDelayed(true);
    }, delay);

    return () => {
      clearTimeout(triggerTimeoutRef.current);
    };
  }, [delay]);

  return [hasDelayed, triggerDelay];
};
