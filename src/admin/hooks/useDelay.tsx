import * as React from 'react';

type Result = [boolean, React.Dispatch<React.SetStateAction<boolean>>];
export const useDelay = (delay: number, run = true): Result => {
  const [hasDelayed, setHasDelayed] = React.useState(false);

  React.useEffect(() => {
    let delayTimeout: NodeJS.Timeout;
    if (run) {
      delayTimeout = setTimeout(() => {
        setHasDelayed(true);
      }, delay);
    }

    return () => {
      clearTimeout(delayTimeout);
    };
  }, [delay, run]);

  return [hasDelayed, setHasDelayed];
};
