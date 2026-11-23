import { ModalContainer, ModalProvider } from '@faceless-ui/modal'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { Modal } from '../../elements/Modal/index.js'
import { Popup, PopupList } from '../../elements/Popup/index.js'
import { ModalProvider as PayloadModalProvider } from '../Modal/index.js'
import { ModalFocusProvider, useModalFocus } from './index.js'

test.each([false, true])(
  'should capture popup ancestors with styling classes removed: %s',
  async (removeClasses) => {
    let targets: readonly HTMLElement[] = []
    const screen = await render(
      <ModalFocusProvider>
        <PopupFixture
          onCapture={({ captured }) => {
            targets = captured
          }}
        />
      </ModalFocusProvider>,
    )
    const root = screen.getByRole('button', { name: 'Actions', exact: true })

    await root.click()
    const nested = screen.getByRole('menuitem', { name: 'More actions', exact: true })

    await nested.click()
    const opener = screen.getByRole('menuitem', { name: 'Open modal', exact: true })
    const expectedTargets = [opener.element(), nested.element(), root.element()]

    if (removeClasses) {
      for (const element of document.querySelectorAll('.popup, .popup__trigger-wrap')) {
        element.classList.remove('popup', 'popup__trigger-wrap')
      }
    }

    await opener.click()

    expect(targets).toEqual(expectedTargets)
  },
)

test('should restore shadow background attributes when the modal provider unmounts', async () => {
  const host = document.createElement('div')
  const shadow = host.attachShadow({ mode: 'open' })
  const mount = document.createElement('div')
  const background = document.createElement('button')

  background.setAttribute('aria-hidden', 'false')
  shadow.append(mount, background)
  document.body.append(host)

  const screen = await render(
    <PayloadModalProvider>
      <Modal openOnInit slug="unmount-shadow-modal">
        <h2>Unmount shadow modal</h2>
        <button type="button">Modal action</button>
      </Modal>
      <ModalContainer />
    </PayloadModalProvider>,
    { container: mount },
  )
  let hasUnmounted = false

  try {
    await expect.poll(() => background.inert).toBe(true)
    await expect.poll(() => background.getAttribute('aria-hidden')).toBe('true')
    await screen.unmount()
    hasUnmounted = true
    expect(background.hasAttribute('inert')).toBe(false)
    expect(background.getAttribute('aria-hidden')).toBe('false')
  } finally {
    if (!hasUnmounted) {
      await screen.unmount()
    }
    host.remove()
  }
})

test('should release shadow focus listeners when focus leaves their tree', async () => {
  const host = document.createElement('div')
  const shadow = host.attachShadow({ mode: 'open' })
  const button = document.createElement('button')

  button.textContent = 'Shadow opener'
  shadow.append(button)
  document.body.append(host)

  const removeListener = vi.spyOn(shadow, 'removeEventListener')
  const screen = await render(
    <ModalFocusProvider>
      <button type="button">Outside shadow</button>
    </ModalFocusProvider>,
  )

  try {
    button.focus()
    await screen.getByRole('button', { name: 'Outside shadow' }).click()
    expect(removeListener.mock.calls.some(([type]) => type === 'focusin')).toBe(true)
  } finally {
    await screen.unmount()
    host.remove()
    vi.restoreAllMocks()
  }
})

test('should share opener listeners as closed modals mount and remove them on unmount', async () => {
  const addListener = vi.spyOn(document, 'addEventListener')
  const removeListener = vi.spyOn(document, 'removeEventListener')

  try {
    const screen = await render(<Fixture count={1} />)

    for (const event of ['focusin', 'pointerdown']) {
      expect(addListener.mock.calls.filter(([type]) => type === event)).toHaveLength(1)
    }

    await screen.rerender(<Fixture count={12} />)

    for (const event of ['focusin', 'pointerdown']) {
      const registrations = addListener.mock.calls.filter(([type]) => type === event)

      expect(registrations).toHaveLength(1)
    }

    await screen.unmount()

    for (const event of ['focusin', 'pointerdown']) {
      const registration = addListener.mock.calls.find(([type]) => type === event)!

      expect(removeListener.mock.calls).toContainEqual(registration)
    }
  } finally {
    vi.restoreAllMocks()
  }
})

function Fixture({ count }: { count: number }) {
  return (
    <ModalProvider transTime={0}>
      <ModalFocusProvider>
        {Array.from({ length: count }, (_, index) => (
          <Modal key={index} slug={`closed-modal-${index}`}>
            <h2>Closed modal {index}</h2>
          </Modal>
        ))}
        <ModalContainer />
      </ModalFocusProvider>
    </ModalProvider>
  )
}

function PopupFixture({
  onCapture,
}: {
  onCapture: ({ captured }: { captured: readonly HTMLElement[] }) => void
}) {
  const { getReturnFocusTargets } = useModalFocus()

  return (
    <Popup button="Actions" popupType="menu" theme="auto">
      <Popup button="More actions" popupType="menu" theme="auto">
        <PopupList.Button onClick={() => onCapture({ captured: getReturnFocusTargets() })}>
          Open modal
        </PopupList.Button>
      </Popup>
    </Popup>
  )
}
