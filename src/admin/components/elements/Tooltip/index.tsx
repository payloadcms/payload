import React, { useEffect } from 'react';
import { Props } from './types';

import './index.scss';

const Tooltip: React.FC<Props> = (props) => {
  const {
    className,
    children,
    show: showFromProps = true,
    delay = 350,
  } = props;

  const [show, setShow] = React.useState(showFromProps);

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

  return (
    <aside
      className={[
        'tooltip',
        className,
        show && 'tooltip--show',
      ].filter(Boolean).join(' ')}
    >
      {children}
    </aside>
  );
};

export default Tooltip;
