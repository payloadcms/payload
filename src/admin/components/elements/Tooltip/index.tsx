import React, { useEffect } from 'react';
import { Props } from './types';
import useIntersect from '../../../hooks/useIntersect';

import './index.scss';

const Tooltip: React.FC<Props> = (props) => {
  const {
    className,
    children,
    show: showFromProps = true,
    delay = 350,
    boundingRef,
  } = props;

  const [show, setShow] = React.useState(showFromProps);
  const [position, setPosition] = React.useState<'top' | 'bottom'>('top');

  const [ref, intersectionEntry] = useIntersect({
    threshold: 0,
    rootMargin: '-150px 0px 0px 100px',
    root: boundingRef?.current || null,
  });


  useEffect(() => {
    let timerId: NodeJS.Timeout;

    // do not use the delay on transition-out
    if (delay && showFromProps) {
      timerId = setTimeout(() => {
        setShow(showFromProps);
      }, delay);
    } else {
      setShow(showFromProps);
    }

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [showFromProps, delay]);

  useEffect(() => {
    setPosition(intersectionEntry?.isIntersecting ? 'top' : 'bottom');
  }, [intersectionEntry]);

  return (
    <aside
      ref={ref}
      className={[
        'tooltip',
        className,
        show && 'tooltip--show',
        position && `tooltip--position-${position}`,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </aside>
  );
};

export default Tooltip;
