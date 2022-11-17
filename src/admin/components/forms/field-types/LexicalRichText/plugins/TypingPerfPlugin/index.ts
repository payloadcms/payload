/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {useEffect} from 'react';

import useReport from '../../hooks/useReport';

const validInputTypes = new Set([
  'insertText',
  'insertCompositionText',
  'insertFromComposition',
  'insertLineBreak',
  'insertParagraph',
  'deleteCompositionText',
  'deleteContentBackward',
  'deleteByComposition',
  'deleteContent',
  'deleteContentForward',
  'deleteWordBackward',
  'deleteWordForward',
  'deleteHardLineBackward',
  'deleteSoftLineBackward',
  'deleteHardLineForward',
  'deleteSoftLineForward',
]);

export default function TypingPerfPlugin(): JSX.Element | null {
  const report = useReport();
  useEffect(() => {
    let start = 0;
    let timerId: ReturnType<typeof setTimeout> | null;
    let keyPressTimerId: ReturnType<typeof setTimeout> | null;
    let log: Array<DOMHighResTimeStamp> = [];
    let invalidatingEvent = false;

    const measureEventEnd = function logKeyPress() {
      if (keyPressTimerId != null) {
        if (invalidatingEvent) {
          invalidatingEvent = false;
        } else {
          log.push(performance.now() - start);
        }

        clearTimeout(keyPressTimerId);
        keyPressTimerId = null;
      }
    };

    const measureEventStart = function measureEvent() {
      if (timerId != null) {
        clearTimeout(timerId);
        timerId = null;
      }

      // We use a setTimeout(0) instead of requestAnimationFrame, due to
      // inconsistencies between the sequencing of rAF in different browsers.
      keyPressTimerId = setTimeout(measureEventEnd, 0);
      // Schedule a timer to report the results.
      timerId = setTimeout(() => {
        const total = log.reduce((a, b) => a + b, 0);
        const reportedText =
          'Typing Perf: ' + Math.round((total / log.length) * 100) / 100 + 'ms';
        report(reportedText);
        log = [];
      }, 2000);
      // Make the time after we do the previous logic, so we don't measure the overhead
      // for it all.
      start = performance.now();
    };

    const beforeInputHandler = function beforeInputHandler(event: InputEvent) {
      if (!validInputTypes.has(event.inputType) || invalidatingEvent) {
        invalidatingEvent = false;
        return;
      }

      measureEventStart();
    };

    const keyDownHandler = function keyDownHandler(event: KeyboardEvent) {
      const keyCode = event.keyCode;

      if (keyCode === 8 || keyCode === 13) {
        measureEventStart();
      }
    };

    const pasteHandler = function pasteHandler() {
      invalidatingEvent = true;
    };

    const cutHandler = function cutHandler() {
      invalidatingEvent = true;
    };

    window.addEventListener('keydown', keyDownHandler, true);
    window.addEventListener('selectionchange', measureEventEnd, true);
    window.addEventListener('beforeinput', beforeInputHandler, true);
    window.addEventListener('paste', pasteHandler, true);
    window.addEventListener('cut', cutHandler, true);

    return () => {
      window.removeEventListener('keydown', keyDownHandler, true);
      window.removeEventListener('selectionchange', measureEventEnd, true);
      window.removeEventListener('beforeinput', beforeInputHandler, true);
      window.removeEventListener('paste', pasteHandler, true);
      window.removeEventListener('cut', cutHandler, true);
    };
  }, [report]);

  return null;
}
