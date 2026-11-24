import React, { useState } from 'react'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { LengthIndicator } from './LengthIndicator.js'

const { t } = vi.hoisted(() => ({
  t: (key: string, vars?: Record<string, number>) =>
    vars ? `${key}:${JSON.stringify(vars)}` : key,
}))

vi.mock('@payloadcms/ui', () => ({
  useTranslation: () => ({ t }),
}))

const Harness = () => {
  const [text, setText] = useState('')

  return (
    <div>
      <textarea id="field" onChange={(event) => setText(event.target.value)} value={text} />
      <LengthIndicator maxLength={160} minLength={50} text={text} />
    </div>
  )
}

test('should not exceed the maximum update depth on rapid input', async () => {
  const errors: string[] = []
  const onError = (event: ErrorEvent) => {
    errors.push(event.message)
    event.preventDefault()
  }
  window.addEventListener('error', onError)

  const screen = await render(<Harness />)
  const field = screen.container.querySelector('#field') as HTMLTextAreaElement
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!

  for (let i = 1; i <= 60; i++) {
    setValue.call(field, 'x'.repeat(i))
    field.dispatchEvent(
      new InputEvent('input', { bubbles: true, data: 'x', inputType: 'insertText' }),
    )
  }

  window.removeEventListener('error', onError)

  expect(errors).toEqual([])
  expect(field.value).toHaveLength(60)
  expect(screen.container.textContent).toContain('plugin-seo:good')
})
