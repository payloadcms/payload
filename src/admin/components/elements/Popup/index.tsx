import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowInfo } from '@faceless-ui/window-info';
import { useScrollInfo } from '@faceless-ui/scroll-info';
import { Props } from './types';

import useThrottledEffect from '../../../hooks/useThrottledEffect';
import PopupButton from './PopupButton';

import './index.scss';

const baseClass = 'popup';

const Popup: React.FC<Props> = (props) => {
  const {
    className,
    buttonClassName,
    render,
    size = 'small',
    color = 'light',
    button,
    buttonType = 'default',
    children,
    showOnHover = false,
    horizontalAlign: horizontalAlignFromProps = 'left',
    verticalAlign: verticalAlignFromProps = 'top',
    initActive = false,
    onToggleOpen,
    padding,
    forceOpen,
    boundingRef,
  } = props;

  const buttonRef = useRef(null);
  const contentRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(initActive);
  const [verticalAlign, setVerticalAlign] = useState(verticalAlignFromProps);
  const [horizontalAlign, setHorizontalAlign] = useState(horizontalAlignFromProps);

  const { y: scrollY } = useScrollInfo();
  const { height: windowHeight, width: windowWidth } = useWindowInfo();

  const handleClickOutside = useCallback((e) => {
    if (contentRef.current.contains(e.target)) {
      return;
    }

    setActive(false);
  }, []);

  useThrottledEffect(() => {
    if (contentRef.current && buttonRef.current) {
      const {
        left: contentLeftPos,
        right: contentRightPos,
        top: contentTopPos,
        bottom: contentBottomPos,
      } = contentRef.current.getBoundingClientRect();

      let boundingTopPos = 0;
      let boundingRightPos = windowWidth;
      let boundingBottomPos = windowHeight;
      let boundingLeftPos = 0;

      if (boundingRef?.current) {
        ({
          top: boundingTopPos,
          right: boundingRightPos,
          bottom: boundingBottomPos,
          left: boundingLeftPos,
        } = boundingRef.current.getBoundingClientRect());
      }

      if (contentRightPos > boundingRightPos && contentLeftPos > boundingLeftPos) {
        setHorizontalAlign('right');
      } else if (contentLeftPos < boundingLeftPos && contentRightPos < boundingRightPos) {
        setHorizontalAlign('left');
      }

      if (contentTopPos < boundingTopPos && contentBottomPos < boundingBottomPos) {
        setVerticalAlign('bottom');
      } else if (contentBottomPos > boundingBottomPos && contentTopPos < boundingTopPos) {
        setVerticalAlign('top');
      }

      setMounted(true);
    }
  }, 500, [scrollY, windowHeight, windowWidth]);

  useEffect(() => {
    if (typeof onToggleOpen === 'function') onToggleOpen(active);

    if (active) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [active, handleClickOutside, onToggleOpen]);

  useEffect(() => {
    setActive(forceOpen);
  }, [forceOpen]);

  const classes = [
    baseClass,
    className,
    `${baseClass}--size-${size}`,
    `${baseClass}--color-${color}`,
    `${baseClass}--v-align-${verticalAlign}`,
    `${baseClass}--h-align-${horizontalAlign}`,
    (active && mounted) && `${baseClass}--active`,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
    >
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
              <PopupButton {...{ className: buttonClassName, buttonType, button, setActive, active }} />
            </div>
          )
          : (
            <PopupButton {...{ className: buttonClassName, buttonType, button, setActive, active }} />
          )}
      </div>

      <div
        className={`${baseClass}__content`}
        ref={contentRef}
      >
        <div
          className={`${baseClass}__wrap`}
          // TODO: color ::after with bg color
        >
          <div
            className={`${baseClass}__scroll`}
            style={{
              padding,
            }}
          >
            {render && render({ close: () => setActive(false) })}
            {children && children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;
