'use client';

import { c as _c } from "react/compiler-runtime";
import { useEffect, useState } from 'react';
export const useResize = element => {
  const $ = _c(5);
  const [size, setSize] = useState();
  let t0;
  let t1;
  if ($[0] !== element) {
    t0 = () => {
      let observer;
      if (element) {
        observer = new ResizeObserver(entries => {
          entries.forEach(entry => {
            const {
              contentBoxSize,
              contentRect
            } = entry;
            let newWidth = 0;
            let newHeight = 0;
            if (contentBoxSize) {
              const newSize = Array.isArray(contentBoxSize) ? contentBoxSize[0] : contentBoxSize;
              if (newSize) {
                const {
                  blockSize,
                  inlineSize
                } = newSize;
                newWidth = inlineSize;
                newHeight = blockSize;
              }
            } else {
              if (contentRect) {
                const {
                  height,
                  width
                } = contentRect;
                newWidth = width;
                newHeight = height;
              }
            }
            setSize({
              height: newHeight,
              width: newWidth
            });
          });
        });
        observer.observe(element);
      }
      return () => {
        if (observer) {
          observer.unobserve(element);
        }
      };
    };
    t1 = [element];
    $[0] = element;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  useEffect(t0, t1);
  let t2;
  if ($[3] !== size) {
    t2 = {
      size
    };
    $[3] = size;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
};
//# sourceMappingURL=useResize.js.map