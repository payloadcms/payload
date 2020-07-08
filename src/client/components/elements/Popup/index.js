import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useWindowInfo } from '@faceless-ui/window-info';
import { useScrollInfo } from '@faceless-ui/scroll-info';

import useThrottledEffect from '../../../hooks/useThrottledEffect';
import PopupButton from './PopupButton';

import './index.scss';

const baseClass = 'popup';

const Popup = (props) => {
  const {
    render, align, size, color, button, buttonType, children, showOnHover, horizontalAlign,
  } = props;

  const buttonRef = useRef(null);
  const contentRef = useRef(null);
  const [active, setActive] = useState(false);
  const [verticalAlign, setVerticalAlign] = useState('top');
  const [forceHorizontalAlign, setForceHorizontalAlign] = useState(null);

  const { y: scrollY } = useScrollInfo();
  const { height: windowHeight } = useWindowInfo();

  const handleClickOutside = (e) => {
    if (contentRef.current.contains(e.target)) {
      return;
    }

    setActive(false);
  };

  useThrottledEffect(() => {
    if (contentRef.current && buttonRef.current) {
      const {
        height: contentHeight,
        width: contentWidth,
        right: contentRightEdge,
      } = contentRef.current.getBoundingClientRect();
      const { y: buttonYCoord } = buttonRef.current.getBoundingClientRect();

      const windowWidth = window.innerWidth;
      const distanceToRightEdge = windowWidth - contentRightEdge;
      const distanceToLeftEdge = contentRightEdge - contentWidth;

      if (horizontalAlign === 'left' && distanceToRightEdge <= 0) {
        setForceHorizontalAlign('right');
      } else if (horizontalAlign === 'right' && distanceToLeftEdge <= 0) {
        setForceHorizontalAlign('left');
      } else if (horizontalAlign === 'center' && (distanceToLeftEdge <= contentWidth / 2 || distanceToRightEdge <= contentWidth / 2)) {
        if (distanceToRightEdge > distanceToLeftEdge) setForceHorizontalAlign('left');
        else setForceHorizontalAlign('right');
      } else {
        setForceHorizontalAlign(null);
      }

      if (buttonYCoord > contentHeight) {
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
    `${baseClass}--v-align-${verticalAlign}`,
    `${baseClass}--h-align-${horizontalAlign}`,
    forceHorizontalAlign && `${baseClass}--force-h-align-${forceHorizontalAlign}`,
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
          )}
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
  children: undefined,
  render: undefined,
  buttonType: 'default',
  button: undefined,
  showOnHover: false,
  horizontalAlign: 'left',
};

Popup.propTypes = {
  render: PropTypes.func,
  children: PropTypes.node,
  align: PropTypes.oneOf(['left', 'center', 'right']),
  horizontalAlign: PropTypes.oneOf(['left', 'center', 'right']),
  size: PropTypes.oneOf(['small', 'large', 'wide']),
  color: PropTypes.oneOf(['light', 'dark']),
  buttonType: PropTypes.oneOf(['default', 'custom']),
  button: PropTypes.node,
  showOnHover: PropTypes.bool,
};

export default Popup;
