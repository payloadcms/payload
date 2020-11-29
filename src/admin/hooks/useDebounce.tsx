import { useState, useEffect } from 'react';

// Our hook
export default function useDebounce(value: unknown, delay: number): unknown {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(
    () => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    },

    [value, delay],
  );

  return debouncedValue;
}
