import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowInfo } from '@faceless-ui/window-info';
import { Props } from './types';
import PopupButton from './PopupButton';

import './index.scss';
import useIntersect from '../../../hooks/useIntersect';

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

  const { width: windowWidth, height: windowHeight } = useWindowInfo();
  const [intersectionRef, intersectionEntry] = useIntersect({
    threshold: 1,
    rootMargin: '-100px 0px 0px 0px',
    root: boundingRef?.current || null,
  });

  const buttonRef = useRef(null);
  const contentRef = useRef(null);
  const [active, setActive] = useState(initActive);
  const [verticalAlign, setVerticalAlign] = useState(verticalAlignFromProps);
  const [horizontalAlign, setHorizontalAlign] = useState(horizontalAlignFromProps);

  const handleClickOutside = useCallback((e) => {
    if (contentRef.current.contains(e.target)) {
      return;
    }

    setActive(false);
  }, [contentRef]);

  useEffect(() => {
    if (contentRef.current) {
      const {
        left: contentLeftPos,
        right: contentRightPos,
        top: contentTopPos,
        bottom: contentBottomPos,
      } = contentRef.current.getBoundingClientRect();

      let boundingTopPos = 100;
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
      } else if (contentBottomPos > boundingBottomPos && contentTopPos > boundingTopPos) {
        setVerticalAlign('top');
      }
    }
  }, [boundingRef, intersectionEntry, windowHeight, windowWidth]);

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
    (active) && `${baseClass}--active`,
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
          ref={intersectionRef}
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
