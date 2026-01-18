'use client';

import { c as _c } from "react/compiler-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { useConfig } from '../providers/Config/index.js';
export const usePopupWindow = props => {
  const $ = _c(15);
  const {
    eventType,
    onMessage,
    url
  } = props;
  const isReceivingMessage = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const {
    config: t0
  } = useConfig();
  const {
    serverURL
  } = t0;
  const popupRef = useRef(null);
  let t1;
  let t2;
  if ($[0] !== eventType || $[1] !== isOpen || $[2] !== onMessage || $[3] !== serverURL || $[4] !== url) {
    t1 = () => {
      const receiveMessage = async event => {
        if (event.origin !== window.location.origin || event.origin !== url || event.origin !== serverURL) {
          return;
        }
        if (typeof onMessage === "function" && event.data?.type === eventType && !isReceivingMessage.current) {
          isReceivingMessage.current = true;
          await onMessage(event.data?.searchParams);
          isReceivingMessage.current = false;
        }
      };
      if (isOpen && popupRef.current) {
        window.addEventListener("message", receiveMessage, false);
      }
      return () => {
        window.removeEventListener("message", receiveMessage);
      };
    };
    t2 = [onMessage, eventType, url, serverURL, isOpen];
    $[0] = eventType;
    $[1] = isOpen;
    $[2] = onMessage;
    $[3] = serverURL;
    $[4] = url;
    $[5] = t1;
    $[6] = t2;
  } else {
    t1 = $[5];
    t2 = $[6];
  }
  useEffect(t1, t2);
  let t3;
  if ($[7] !== url) {
    t3 = e => {
      if (e) {
        e.preventDefault();
      }
      const features = {
        height: 700,
        left: "auto",
        menubar: "no",
        popup: "yes",
        toolbar: "no",
        top: "auto",
        width: 800
      };
      const popupOptions = Object.entries(features).reduce((str, t4) => {
        const [key, value] = t4;
        let strCopy = str;
        if (value === "auto") {
          if (key === "top") {
            const v = Math.round(window.innerHeight / 2 - features.height / 2);
            strCopy = strCopy + `top=${v},`;
          } else {
            if (key === "left") {
              const v_0 = Math.round(window.innerWidth / 2 - features.width / 2);
              strCopy = strCopy + `left=${v_0},`;
            }
          }
          return strCopy;
        }
        strCopy = strCopy + `${key}=${value},`;
        return strCopy;
      }, "").slice(0, -1);
      const newWindow = window.open(url, "_blank", popupOptions);
      popupRef.current = newWindow;
      setIsOpen(true);
    };
    $[7] = url;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  const openPopupWindow = t3;
  let t4;
  let t5;
  if ($[9] !== isOpen) {
    t4 = () => {
      let timer;
      if (isOpen) {
        timer = setInterval(function () {
          if (popupRef.current.closed) {
            clearInterval(timer);
            setIsOpen(false);
          }
        }, 1000);
      } else {
        clearInterval(timer);
      }
      return () => {
        if (timer) {
          clearInterval(timer);
        }
      };
    };
    t5 = [isOpen, popupRef];
    $[9] = isOpen;
    $[10] = t4;
    $[11] = t5;
  } else {
    t4 = $[10];
    t5 = $[11];
  }
  useEffect(t4, t5);
  let t6;
  if ($[12] !== isOpen || $[13] !== openPopupWindow) {
    t6 = {
      isPopupOpen: isOpen,
      openPopupWindow,
      popupRef
    };
    $[12] = isOpen;
    $[13] = openPopupWindow;
    $[14] = t6;
  } else {
    t6 = $[14];
  }
  return t6;
};
//# sourceMappingURL=usePopupWindow.js.map