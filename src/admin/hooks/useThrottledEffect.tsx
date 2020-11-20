/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from 'react';

const useThrottledEffect = (callback, delay, deps = []) => {
  const lastRan = useRef(Date.now());

  useEffect(
    () => {
      const handler = setTimeout(() => {
        if (Date.now() - lastRan.current >= delay) {
          callback();
          lastRan.current = Date.now();
        }
      }, delay - (Date.now() - lastRan.current));

      return () => {
        clearTimeout(handler);
      };
    },
    [delay, ...deps],
  );
};

export default useThrottledEffect;
