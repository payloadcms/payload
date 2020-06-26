import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useWindowInfo } from '@trbl/react-window-info';
import { useScrollInfo } from '@trbl/react-scroll-info';

import useThrottledEffect from '../../../hooks/useThrottledEffect';
import PopupButton from './PopupButton';

import './index.scss';

const baseClass = 'popup';

const Popup = (props) => {
  const {
    render, align, size, color, pointerAlignment, button, buttonType, children, showOnHover,
  } = props;

  const [active, setActive] = useState(false);
  const [verticalAlign, setVerticalAlign] = useState('top');
  const { height: windowHeight } = useWindowInfo();
  const { y: scrollY } = useScrollInfo();
  const buttonRef = useRef(null);
  const contentRef = useRef(null);

  const handleClickOutside = (e) => {
    if (contentRef.current.contains(e.target)) {
      return;
    }

    setActive(false);
  };

  useThrottledEffect(() => {
    if (contentRef.current && buttonRef.current) {
      const { height: contentHeight } = contentRef.current.getBoundingClientRect();
      const { y: buttonOffsetTop } = buttonRef.current.getBoundingClientRect();

      if (buttonOffsetTop > contentHeight) {
        setVerticalAlign('top');
      } else {
        setVerticalAlign('bottom');
      }
    }
  }, 500, [setVerticalAlign, contentRef, scrollY, windowHeight]);

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
    `${baseClass}--color-${color}`,
    `${baseClass}--pointer-alignment-${pointerAlignment}`,
    `${baseClass}--vertical-align-${verticalAlign}`,
    active && `${baseClass}--active`,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div
        ref={buttonRef}
        className={`${baseClass}__wrapper`}
      >
        {showOnHover
          ? (
            <div
              className={`${baseClass}__on-hover-watch`}
              onMouseEnter={() => setActive(true)}
              onMouseLeave={() => setActive(false)}
            >
              <PopupButton
                buttonType={buttonType}
                button={button}
                setActive={setActive}
                active={active}
              />
            </div>
          )
          : (
            <PopupButton
              buttonType={buttonType}
              button={button}
              setActive={setActive}
              active={active}
            />
          )
        }
      </div>

      <div
        className={`${baseClass}__content`}
        ref={contentRef}
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
  color: 'light',
  pointerAlignment: 'left',
  children: undefined,
  render: undefined,
  buttonType: 'default',
  button: undefined,
  showOnHover: false,
};

Popup.propTypes = {
  render: PropTypes.func,
  children: PropTypes.node,
  align: PropTypes.oneOf(['left', 'center', 'right']),
  pointerAlignment: PropTypes.oneOf(['left', 'center', 'right']),
  size: PropTypes.oneOf(['small', 'large', 'wide']),
  color: PropTypes.oneOf(['light', 'dark']),
  buttonType: PropTypes.oneOf(['default', 'custom']),
  button: PropTypes.node,
  showOnHover: PropTypes.bool,
};

export default Popup;
