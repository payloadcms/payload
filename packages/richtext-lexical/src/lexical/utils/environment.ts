'use client'
import { CAN_USE_DOM } from './canUseDOM.js'

declare global {
  interface Document {
    documentMode?: unknown
  }

  interface Window {
    MSStream?: unknown
  }
}

const documentMode = CAN_USE_DOM && 'documentMode' in document ? document.documentMode : null

export const IS_APPLE: boolean = CAN_USE_DOM && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

export const IS_FIREFOX: boolean =
  CAN_USE_DOM && /^(?!.*Seamonkey)(?=.*Firefox).*/i.test(navigator.userAgent)

export const CAN_USE_BEFORE_INPUT: boolean =
  CAN_USE_DOM && 'InputEvent' in window && !documentMode
    ? 'getTargetRanges' in new window.InputEvent('input')
    : false

export const IS_SAFARI: boolean = CAN_USE_DOM && /Version\/[\d.].*Safari/.test(navigator.userAgent)

export const IS_IOS: boolean =
  CAN_USE_DOM && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

export const IS_ANDROID: boolean = CAN_USE_DOM && /Android/.test(navigator.userAgent)

export const IS_WINDOWS: boolean = CAN_USE_DOM && /Win/.test(navigator.platform)
export const IS_CHROME: boolean = CAN_USE_DOM && /^(?=.*Chrome).*/i.test(navigator.userAgent)
// export const canUseTextInputEvent: boolean = CAN_USE_DOM && 'TextEvent' in window && !documentMode;

export const IS_APPLE_WEBKIT =
  CAN_USE_DOM && /AppleWebKit\/[\d.]+/.test(navigator.userAgent) && !IS_CHROME
