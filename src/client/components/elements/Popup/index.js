import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useWindowInfo } from '@trbl/react-window-info';
import { useScrollInfo } from '@trbl/react-scroll-info';
import useThrottledEffect from '../../../hooks/useThrottledEffect';

import './index.scss';

const baseClass = 'popup';

const Popup = (props) => {
  const {
    render, align, size, button, children,
  } = props;

  const [active, setActive] = useState(false);
  const [verticalAlign, setVerticalAlign] = useState('top');
  const { height: windowHeight } = useWindowInfo();
  const { y: scrollY } = useScrollInfo();
  const ref = useRef(null);

  const handleClickOutside = (e) => {
    if (ref.current.contains(e.target)) {
      return;
    }

    setActive(false);
  };

  useThrottledEffect(() => {
    if (ref.current) {
      const { height, y } = ref.current.getBoundingClientRect();
      if (height > y) {
        setVerticalAlign('bottom');
      } else {
        setVerticalAlign('top');
      }
    }
  }, 500, [setVerticalAlign, ref, scrollY, windowHeight]);

  useEffect(() => {
    if (active) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [active]);

  const classes = [
    baseClass,
    `${baseClass}--align-${align}`,
    `${baseClass}--size-${size}`,
    `${baseClass}--vertical-align-${verticalAlign}`,
    active && `${baseClass}--active`,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <button
        type="button"
        onClick={() => setActive(!active)}
      >
        {button}
      </button>
      <div
        className={`${baseClass}__content`}
        ref={ref}
      >
        <div className={`${baseClass}__wrap`}>
          <div className={`${baseClass}__scroll`}>
            {render && render({ close: () => setActive(false) })}
            {children && children}
          </div>
        </div>
      </div>
    </div>
  );
};

Popup.defaultProps = {
  align: 'center',
  size: 'small',
  children: undefined,
  render: undefined,
};

Popup.propTypes = {
  render: PropTypes.func,
  children: PropTypes.node,
  align: PropTypes.oneOf(['left', 'center', 'right']),
  size: PropTypes.oneOf(['small', 'large']),
  button: PropTypes.node.isRequired,
};

export default Popup;
