import * as React from 'react';
import { useDelay } from './useDelay';

type DelayedRenderProps = {
  /** `true` starts the mount process.
   * `false` starts the unmount process.
   * */
  show: boolean;
  /** Time in ms to wait before "mounting" the component. */
  delayBeforeShow: number;
  /** Time in ms for the "enter" phase of the transition, after delay completes. */
  inTimeout: number;
  /** Min time in ms for the "entered" phase of the transition. */
  minShowTime: number;
  /** Time in ms for the exit phase of the transition. */
  outTimeout: number;
};
type useDelayedRenderT = (props: DelayedRenderProps) => {
  /** `true` if the component has mounted after the timeout. */
  isMounted: boolean;
  /** `true` if the component is unmounting. */
  isUnmounting: boolean;
  /** Call this function to trigger the timeout delay before rendering. */
  triggerDelayedRender: () => void;
};
export const useDelayedRender: useDelayedRenderT = ({ show, delayBeforeShow, inTimeout, minShowTime, outTimeout }) => {
  const totalMountTime = inTimeout + minShowTime + outTimeout;
  const [hasDelayed, triggerDelay] = useDelay(delayBeforeShow);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isUnmounting, setIsUnmounting] = React.useState(false);
  const onMountTimestampRef = React.useRef(0);
  const unmountTimeoutRef: React.MutableRefObject<NodeJS.Timeout | undefined> = React.useRef();

  const unmount = React.useCallback(() => {
    setIsUnmounting(true);
    unmountTimeoutRef.current = setTimeout(() => {
      setIsMounted(false);
      setIsUnmounting(false);
    }, outTimeout);
  }, [setIsUnmounting, outTimeout]);

  React.useEffect(() => {
    const shouldMount = hasDelayed && !isMounted && show;
    const shouldUnmount = isMounted && !show;

    if (shouldMount) {
      onMountTimestampRef.current = Date.now();
      setIsMounted(true);
    } else if (shouldUnmount) {
      const totalTimeMounted = Date.now() - onMountTimestampRef.current;
      const remainingTime = totalMountTime - totalTimeMounted;
      clearTimeout(unmountTimeoutRef.current);
      unmountTimeoutRef.current = setTimeout(unmount, Math.max(0, remainingTime));
    }
  }, [isMounted, show, unmount, totalMountTime, hasDelayed]);

  return {
    isMounted,
    isUnmounting,
    triggerDelayedRender: triggerDelay,
  };
};
