import React from 'react'

export function ContentsMarker({ isMenuItem, text }: { isMenuItem?: boolean; text: string }) {
  return isMenuItem ? (
    <button role="menuitem" type="button">
      {text}
    </button>
  ) : (
    <p>{text}</p>
  )
}
