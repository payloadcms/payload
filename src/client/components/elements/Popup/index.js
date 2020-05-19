import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useWindowInfo } from '@trbl/react-window-info';
import { useScrollInfo } from '@trbl/react-scroll-info';
import useThrottledEffect from '../../../hooks/useThrottledEffect';

import './index.scss';

const baseClass = 'popup';

const Popup = (props) => {
  const {
    children, align, size, active, handleClose,
  } = props;
  const [verticalAlign, setVerticalAlign] = useState('top');
  const { height: windowHeight } = useWindowInfo();
  const { y: scrollY } = useScrollInfo();
  const ref = useRef(null);

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
      ref.current.focus();
    }
  }, [active]);

  const classes = [
    baseClass,
    `${baseClass}--align-${align}`,
    `${baseClass}--size-${size}`,
    `${baseClass}--vertical-align-${verticalAlign}`,
    active && `${baseClass}--active`,
  ].filter(Boolean).join(' ');

  return (
    <>
      <div
        tabIndex="-1"
        className={classes}
        ref={ref}
        onBlur={handleClose}
      >
        <div className={`${baseClass}__wrap`}>
          <div className={`${baseClass}__scroll`}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

Popup.defaultProps = {
  align: 'center',
  size: 'small',
  active: false,
  handleClose: null,
};

Popup.propTypes = {
  children: PropTypes.node.isRequired,
  align: PropTypes.oneOf(['left', 'center', 'right']),
  size: PropTypes.oneOf(['small', 'large']),
  active: PropTypes.bool,
  handleClose: PropTypes.func,
};

export default Popup;
