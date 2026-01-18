'use client';

import { CAN_USE_DOM } from './canUseDOM.js';
const documentMode = CAN_USE_DOM && 'documentMode' in document ? document.documentMode : null;
export const IS_APPLE = CAN_USE_DOM && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
export const IS_FIREFOX = CAN_USE_DOM && /^(?!.*Seamonkey)(?=.*Firefox).*/i.test(navigator.userAgent);
export const CAN_USE_BEFORE_INPUT = CAN_USE_DOM && 'InputEvent' in window && !documentMode ? 'getTargetRanges' in new window.InputEvent('input') : false;
export const IS_SAFARI = CAN_USE_DOM && /Version\/[\d.].*Safari/.test(navigator.userAgent);
export const IS_IOS = CAN_USE_DOM && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
export const IS_ANDROID = CAN_USE_DOM && /Android/.test(navigator.userAgent);
export const IS_WINDOWS = CAN_USE_DOM && /Win/.test(navigator.platform);
export const IS_CHROME = CAN_USE_DOM && /^(?=.*Chrome).*/i.test(navigator.userAgent);
// export const canUseTextInputEvent: boolean = CAN_USE_DOM && 'TextEvent' in window && !documentMode;
export const IS_APPLE_WEBKIT = CAN_USE_DOM && /AppleWebKit\/[\d.]+/.test(navigator.userAgent) && !IS_CHROME;
//# sourceMappingURL=environment.js.map