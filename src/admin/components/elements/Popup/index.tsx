import React, { useEffect, useRef, useState } from 'react';
import { useWindowInfo } from '@faceless-ui/window-info';
import { useScrollInfo } from '@faceless-ui/scroll-info';
import { Props } from './types';

import useThrottledEffect from '../../../hooks/useThrottledEffect';
import PopupButton from './PopupButton';

import './index.scss';

const baseClass = 'popup';

const Popup: React.FC<Props> = (props) => {
  const {
    render,
    size = 'small',
    color = 'light',
    button,
    buttonType = 'default',
    children,
    showOnHover = false,
    horizontalAlign = 'left',
    initActive = false,
    onToggleOpen,
  } = props;

  const buttonRef = useRef(null);
  const contentRef = useRef(null);
  const [active, setActive] = useState(initActive);
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
                onToggleOpen={onToggleOpen}
                buttonType={buttonType}
                button={button}
                setActive={setActive}
                active={active}
              />
            </div>
          )
          : (
            <PopupButton
              onToggleOpen={onToggleOpen}
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

export default Popup;
