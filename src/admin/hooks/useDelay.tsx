import * as React from 'react';

type Result = [boolean, () => void];
export const useDelay = (delay: number): Result => {
  const [hasDelayed, setHasDelayed] = React.useState(false);

  const triggerDelay = React.useCallback(() => {
    setHasDelayed(false);
    const delayTimeout = setTimeout(() => {
      setHasDelayed(true);
    }, delay);

    return () => {
      clearTimeout(delayTimeout);
    };
  }, [delay]);

  return [hasDelayed, triggerDelay];
};
