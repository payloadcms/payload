import * as React from 'react';
import { useDelay } from './useDelay';

type TimeoutRenderProps = {
  /** `true` starts the mount process.
   * `false` starts the unmount process.
   * */
  show: boolean;
  /** Time in ms to wait before "mounting" the component. */
  timeout?: number;
  /** Time in ms the `appear` phase of the animation. (enter transition time + appear time) */
  appearTime?: number;
  /** Time in ms the `exit` phase of the animation. */
  exitTimeout?: number;
  /** Time in ms to wait before actually unmounting the component. */
  unmountTimeout?: number;
};
type useTimeoutRender = (props: TimeoutRenderProps) => {
  /** `true` if the component has mounted after the timeout. */
  isMounted: boolean;
  /** `true` if the component is unmounting. */
  isUnmounting: boolean;
  /** Call this function to trigger the timeout delay before rendering. */
  triggerRenderTimeout: () => void;
};
export const useTimeoutRender: useTimeoutRender = ({ show, timeout = 500, appearTime = 1250, exitTimeout = 500 }) => {
  const [hasDelayed, triggerDelay] = useDelay(timeout);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isUnmounting, setIsUnmounting] = React.useState(false);
  const onMountTimestampRef = React.useRef(0);
  const unmountTimeoutRef: React.MutableRefObject<NodeJS.Timeout | undefined> = React.useRef();

  const unmount = React.useCallback(() => {
    setIsUnmounting(true);
    unmountTimeoutRef.current = setTimeout(() => {
      setIsMounted(false);
      setIsUnmounting(false);
    }, exitTimeout);
  }, [setIsUnmounting, exitTimeout]);

  React.useEffect(() => {
    const shouldMount = hasDelayed && !isMounted && show;
    const shouldUnmount = isMounted && !show;

    if (shouldMount) {
      onMountTimestampRef.current = Date.now();
      setIsMounted(true);
    } else if (shouldUnmount) {
      const totalTimeMounted = Date.now() - onMountTimestampRef.current;
      const timeoutExtension = (appearTime + exitTimeout) - totalTimeMounted;
      clearTimeout(unmountTimeoutRef.current);
      unmountTimeoutRef.current = setTimeout(unmount, Math.max(0, timeoutExtension));
    }
  }, [isMounted, show, unmount, appearTime, exitTimeout, hasDelayed]);

  return {
    isMounted,
    isUnmounting,
    triggerRenderTimeout: triggerDelay,
  };
};
