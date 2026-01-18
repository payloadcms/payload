import { useEffect, useState } from 'react';
/**
 * A custom React hook to throttle a value so that it updates no more than once every `delay` milliseconds.
 * @param {any} value - The value to be throttled.
 * @param {number} delay - The minimum delay (in milliseconds) between updates.
 * @returns {any} - The throttled value.
 */
export function useThrottledValue(value, delay) {
  const [throttledValue, setThrottledValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setThrottledValue(value);
    }, delay);
    // Cleanup the timeout if the value changes before the delay is completed
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return throttledValue;
}
//# sourceMappingURL=useThrottledValue.js.map