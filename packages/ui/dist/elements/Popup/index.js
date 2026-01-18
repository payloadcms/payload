'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export * as PopupList from './PopupButtonList/index.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEffectEvent } from '../../hooks/useEffectEvent.js';
import './index.scss';
import { PopupTrigger } from './PopupTrigger/index.js';
const baseClass = 'popup';
/**
 * Selector for all elements the browser considers tabbable.
 */
const TABBABLE_SELECTOR = ['a[href]', 'button:not(:disabled)', 'input:not(:disabled):not([type="hidden"])', 'select:not(:disabled)', 'textarea:not(:disabled)', '[tabindex]', '[contenteditable]:not([contenteditable="false"])', 'audio[controls]', 'video[controls]', 'summary'].map(s => `${s}:not([tabindex="-1"])`).join(', ');
/**
 * Component that renders a popup, as well as a button that triggers the popup.
 *
 * The popup is rendered in a portal, and is automatically positioned above / below the trigger,
 * depending on the verticalAlign prop and the space available.
 */
export const Popup = props => {
  const {
    id,
    button,
    buttonClassName,
    buttonSize,
    buttonType = 'default',
    caret = true,
    children,
    className,
    disabled,
    forceOpen,
    horizontalAlign = 'left',
    initActive = false,
    noBackground,
    onToggleClose,
    onToggleOpen,
    render,
    showOnHover = false,
    showScrollbar = false,
    size = 'medium',
    verticalAlign = 'bottom'
  } = props;
  const popupRef = useRef(null);
  const triggerRef = useRef(null);
  /**
  * Keeps track of whether the popup was opened via keyboard.
  * This is used to determine whether to autofocus the first element in the popup.
  * If the popup was opened via mouse, we do not want to autofocus the first element.
  */
  const openedViaKeyboardRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [active, setActiveInternal] = useState(initActive);
  const [isOnTop, setIsOnTop] = useState(verticalAlign === 'top');
  // Track when component is mounted to avoid SSR/client hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  const setActive = useCallback((isActive, viaKeyboard = false) => {
    if (isActive) {
      openedViaKeyboardRef.current = viaKeyboard;
      onToggleOpen?.(true);
    } else {
      onToggleClose?.();
    }
    setActiveInternal(isActive);
  }, [onToggleClose, onToggleOpen]);
  // /////////////////////////////////////
  // Position Calculation
  //
  // Calculates and applies popup position relative to trigger.
  // Always checks viewport bounds (for flipping), but only updates
  // styles if the calculated position differs from current position.
  // /////////////////////////////////////
  const updatePosition = useEffectEvent(() => {
    const trigger = triggerRef.current;
    const popup = popupRef.current;
    if (!trigger || !popup) {
      return;
    }
    const triggerRect = trigger.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    // Gap between the popup and the trigger/viewport edges (in pixels)
    const offset = 10;
    // /////////////////////////////////////
    // Vertical Positioning
    // Calculates the `top` position in absolute page coordinates.
    // Uses `verticalAlign` prop as the preferred direction, but flips
    // to the opposite side if there's not enough viewport space.
    // /////////////////////////////////////
    let top;
    let onTop = verticalAlign === 'top';
    if (verticalAlign === 'bottom') {
      top = triggerRect.bottom + window.scrollY + offset;
      if (triggerRect.bottom + popupRect.height + offset > window.innerHeight) {
        top = triggerRect.top + window.scrollY - popupRect.height - offset;
        onTop = true;
      }
    } else {
      top = triggerRect.top + window.scrollY - popupRect.height - offset;
      if (triggerRect.top - popupRect.height - offset < 0) {
        top = triggerRect.bottom + window.scrollY + offset;
        onTop = false;
      }
    }
    setIsOnTop(onTop);
    // /////////////////////////////////////
    // Horizontal Positioning
    // Calculates the `left` position based on `horizontalAlign` prop:
    // - 'left': aligns popup's left edge with trigger's left edge
    // - 'right': aligns popup's right edge with trigger's right edge
    // - 'center': centers popup horizontally relative to trigger
    // Then clamps to keep the popup within viewport bounds.
    // /////////////////////////////////////
    let left = horizontalAlign === 'right' ? triggerRect.right - popupRect.width : horizontalAlign === 'center' ? triggerRect.left + triggerRect.width / 2 - popupRect.width / 2 : triggerRect.left;
    left = Math.max(offset, Math.min(left, window.innerWidth - popupRect.width - offset));
    // /////////////////////////////////////
    // Caret Positioning
    // Positions the caret arrow to point at the trigger's horizontal center.
    // Clamps between 12px from edges to prevent caret from overflowing the popup.
    // /////////////////////////////////////
    const triggerCenter = triggerRect.left + triggerRect.width / 2;
    const caretLeft = Math.max(12, Math.min(triggerCenter - left, popupRect.width - 12));
    // /////////////////////////////////////
    // Apply Styles (only if changed)
    // Compares calculated position with current styles to avoid unnecessary
    // DOM updates during scroll. This prevents visual lag by relying on the absolute
    // positioning where possible (popup slightly lags behind when scrolling really fast),
    // while still allowing position changes when needed (e.g., sticky parent, viewport flip).
    // Values are rounded to match browser's CSS precision and avoid false updates.
    // /////////////////////////////////////
    const newTop = `${Math.round(top)}px`;
    const newLeft = `${Math.round(left + window.scrollX)}px`;
    const newCaretLeft = `${Math.round(caretLeft)}px`;
    if (popup.style.top !== newTop) {
      popup.style.top = newTop;
    }
    if (popup.style.left !== newLeft) {
      popup.style.left = newLeft;
    }
    if (popup.style.getPropertyValue('--caret-left') !== newCaretLeft) {
      popup.style.setProperty('--caret-left', newCaretLeft);
    }
  });
  // /////////////////////////////////////
  // Click Outside Handler
  // Closes popup when clicking outside both the popup and trigger.
  // /////////////////////////////////////
  const handleClickOutside = useEffectEvent(e => {
    const isOutsidePopup = !popupRef.current?.contains(e.target);
    const isOutsideTrigger = !triggerRef.current?.contains(e.target);
    if (isOutsidePopup && isOutsideTrigger) {
      setActive(false);
    }
  });
  // /////////////////////////////////////
  // Keyboard Navigation
  // Handles keyboard interactions when popup is open:
  // - Escape: closes popup and returns focus to trigger
  // - Tab/Shift+Tab: cycles through focusable items with wrapping
  // - ArrowUp/ArrowDown: same as Shift+Tab/Tab for menu-style navigation
  // Focus is managed manually to support elements the browser might skip.
  // /////////////////////////////////////
  const handleKeyDown = useEffectEvent(e_0 => {
    const popup_0 = popupRef.current;
    if (!popup_0 || !active) {
      return;
    }
    if (e_0.key === 'Escape') {
      e_0.preventDefault();
      setActive(false);
      triggerRef.current?.querySelector('button, [tabindex="0"]')?.focus();
      return;
    }
    if (e_0.key === 'Tab' || e_0.key === 'ArrowDown' || e_0.key === 'ArrowUp') {
      const focusable = Array.from(popup_0.querySelectorAll(TABBABLE_SELECTOR));
      if (focusable.length === 0) {
        return;
      }
      e_0.preventDefault();
      const currentIndex = focusable.findIndex(el => el === document.activeElement);
      const goBackward = e_0.key === 'ArrowUp' || e_0.key === 'Tab' && e_0.shiftKey;
      let nextIndex;
      if (currentIndex === -1) {
        nextIndex = goBackward ? focusable.length - 1 : 0;
      } else if (goBackward) {
        nextIndex = currentIndex === 0 ? focusable.length - 1 : currentIndex - 1;
      } else {
        nextIndex = currentIndex === focusable.length - 1 ? 0 : currentIndex + 1;
      }
      focusable[nextIndex].focus();
    }
  });
  // /////////////////////////////////////
  // Click Handler for Actionable Elements
  // Closes popup when buttons/links inside are clicked (includes Enter/Space activation).
  // /////////////////////////////////////
  const handleActionableClick = useEffectEvent(e_1 => {
    const target = e_1.target;
    // Check if the clicked element or any ancestor is an actionable element
    const actionable = target.closest('button, a[href], [role="button"], [role="menuitem"]');
    if (actionable && popupRef.current?.contains(actionable)) {
      setActive(false);
    }
  });
  // /////////////////////////////////////
  // Effect: Setup/Teardown position and focus management
  // /////////////////////////////////////
  useEffect(() => {
    if (!active) {
      return;
    }
    const popup_1 = popupRef.current;
    if (!popup_1) {
      return;
    }
    // /////////////////////////////////////
    // Initial Position
    // Calculate and apply popup position immediately on open.
    // /////////////////////////////////////
    updatePosition();
    // /////////////////////////////////////
    // Focus Management
    // When opened via keyboard, autofocus the first focusable button.
    // When opened via mouse, skip autofocus to avoid unwanted highlights.
    // /////////////////////////////////////
    if (openedViaKeyboardRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready.
      requestAnimationFrame(() => {
        const firstFocusable = popup_1.querySelector(TABBABLE_SELECTOR);
        firstFocusable?.focus();
      });
    }
    // /////////////////////////////////////
    // Event Listeners
    // - resize/scroll: recalculate position (only applies styles if changed)
    // - mousedown: detect clicks outside to close
    // - keydown: handle keyboard navigation
    // /////////////////////////////////////
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, {
      capture: true,
      passive: true
    });
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    popup_1.addEventListener('click', handleActionableClick);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, {
        capture: true
      });
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      popup_1.removeEventListener('click', handleActionableClick);
    };
  }, [active]);
  useEffect(() => {
    if (forceOpen !== undefined) {
      setActive(forceOpen);
    }
  }, [forceOpen, setActive]);
  const Trigger = /*#__PURE__*/_jsx(PopupTrigger, {
    active: active,
    button: button,
    buttonType: buttonType,
    className: buttonClassName,
    disabled: disabled,
    noBackground: noBackground,
    setActive: setActive,
    size: buttonSize
  });
  return /*#__PURE__*/_jsxs("div", {
    className: [baseClass, className].filter(Boolean).join(' '),
    id: id,
    children: [/*#__PURE__*/_jsx("div", {
      className: `${baseClass}__trigger-wrap`,
      ref: triggerRef,
      children: showOnHover ? /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__on-hover-watch`,
        onMouseEnter: () => setActive(true),
        onMouseLeave: () => setActive(false),
        role: "button",
        tabIndex: 0,
        children: Trigger
      }) : Trigger
    }), mounted ?
    // This ensures that components within the popup, like modals, do not unmount when the popup closes.
    // Otherwise, modals opened from the popup will close unexpectedly when clicking within the modal, since
    // that closes the popup due to the click outside handler.
    /*#__PURE__*/
    createPortal(/*#__PURE__*/_jsxs("div", {
      className: active ? [`${baseClass}__content`, `${baseClass}--size-${size}`, isOnTop ? `${baseClass}--v-top` : `${baseClass}--v-bottom`].filter(Boolean).join(' ') :
      // tests do not accidentally target inactive popups.
      `${baseClass}__hidden-content`,
      "data-popup-id": id || undefined,
      ref: popupRef,
      children: [/*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__scroll-container${showScrollbar ? ` ${baseClass}__scroll-container--show-scrollbar` : ''}`,
        children: [render?.({
          close: () => setActive(false)
        }), children]
      }), caret && /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__caret`
      })]
    }), document.body) : null]
  });
};
//# sourceMappingURL=index.js.map