import type { ReactNode } from 'react'

import { ModalContainer, ModalProvider } from '@faceless-ui/modal'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import {
  expectFocus,
  PopupTestRoot,
} from '../../../../../test/__helpers/components/PopupTestRoot/index.js'
import { Modal } from '../../elements/Modal/index.js'
import { Popup, PopupList } from '../../elements/Popup/index.js'
import { ModalFocusProvider, useModalFocus } from './index.js'

describe('document', () => runPopupFocusTests({ isShadowRoot: false }))
describe('shadow root', () => runPopupFocusTests({ isShadowRoot: true }))

function runPopupFocusTests({ isShadowRoot }: { isShadowRoot: boolean }) {
  function Root({ children }: { children: ReactNode }) {
    return <PopupTestRoot isShadowRoot={isShadowRoot}>{children}</PopupTestRoot>
  }

  test('should remember the action and parent menu triggers for focus restoration', async () => {
    let targets: readonly HTMLElement[] = []
    const screen = await render(
      <ModalFocusProvider>
        <PopupFixture
          onCapture={({ captured }) => {
            targets = captured
          }}
        />
      </ModalFocusProvider>,
      { wrapper: Root },
    )
    const trigger = screen.getByRole('button', { name: 'Actions', exact: true })

    trigger.element().focus()
    await userEvent.keyboard('{Enter}')
    const nested = screen.getByRole('menuitem', { name: 'More actions', exact: true })

    await expectFocus({ locator: nested })
    await userEvent.keyboard('{Enter}')
    const opener = screen.getByRole('menuitem', { name: 'Open modal', exact: true })

    await expectFocus({ locator: opener })
    const expectedTargets = [opener.element(), nested.element(), trigger.element()]

    await userEvent.keyboard('{Enter}')
    expect(targets).toEqual(expectedTargets)
  })

  test('should remember the control activated with the keyboard', async () => {
    let targets: readonly HTMLElement[] = []

    function Controls() {
      const { getReturnFocusTargets } = useModalFocus()
      const capture = () => {
        targets = getReturnFocusTargets()
      }

      return (
        <Popup button="Actions" popupType="dialog">
          <div data-popup-prevent-close>
            <PopupTestRoot isShadowRoot>
              <button onClick={capture} type="button">
                First action
              </button>
              <button onClick={capture} type="button">
                Second action
              </button>
            </PopupTestRoot>
          </div>
        </Popup>
      )
    }

    const screen = await render(
      <ModalFocusProvider>
        <Controls />
      </ModalFocusProvider>,
      { wrapper: Root },
    )
    const trigger = screen.getByRole('button', { name: 'Actions', exact: true })

    await trigger.click()
    const first = screen.getByRole('button', { name: 'First action' })
    const second = screen.getByRole('button', { name: 'Second action' })
    const expectedTargets = [second.element(), trigger.element()]

    for (const key of ['{Enter}', ' ']) {
      targets = []
      first.element().focus()
      await userEvent.keyboard('{Tab}')
      await expectFocus({ locator: second })
      await userEvent.keyboard(key)
      expect(targets).toEqual(expectedTargets)
    }
  })

  describe.each([
    { context: 'with styling classes', shouldRemoveClasses: false },
    { context: 'without styling classes', shouldRemoveClasses: true },
  ])('$context', ({ shouldRemoveClasses }) => {
    test('should remember parent menu triggers for focus restoration', async () => {
      let targets: readonly HTMLElement[] = []
      const screen = await render(
        <ModalFocusProvider>
          <PopupFixture
            onCapture={({ captured }) => {
              targets = captured
            }}
          />
        </ModalFocusProvider>,
        { wrapper: Root },
      )
      const root = screen.getByRole('button', { name: 'Actions', exact: true })

      await root.click()
      const nested = screen.getByRole('menuitem', { name: 'More actions', exact: true })

      await nested.click()
      const opener = screen.getByRole('menuitem', { name: 'Open modal', exact: true })
      const expectedTargets = [opener.element(), nested.element(), root.element()]

      if (shouldRemoveClasses) {
        const domRoot = root.element().getRootNode() as Document | ShadowRoot

        for (const element of domRoot.querySelectorAll('.popup, .popup__trigger-wrap')) {
          element.classList.remove('popup', 'popup__trigger-wrap')
        }
      }

      await opener.click()

      expect(targets).toEqual(expectedTargets)
    })
  })

  test('should share opener listeners as closed modals mount and remove them on unmount', async () => {
    const addListener = vi.spyOn(document, 'addEventListener')
    const removeListener = vi.spyOn(document, 'removeEventListener')

    try {
      const screen = await render(<Fixture count={1} />, { wrapper: Root })

      for (const event of ['click', 'focusin', 'pointerdown']) {
        expect(addListener.mock.calls.filter(([type]) => type === event)).toHaveLength(1)
      }

      await screen.rerender(<Fixture count={12} />)

      for (const event of ['click', 'focusin', 'pointerdown']) {
        const registrations = addListener.mock.calls.filter(([type]) => type === event)

        expect(registrations).toHaveLength(1)
      }

      await screen.unmount()

      for (const event of ['click', 'focusin', 'pointerdown']) {
        const registration = addListener.mock.calls.find(([type]) => type === event)!

        expect(removeListener.mock.calls).toContainEqual(registration)
      }
    } finally {
      vi.restoreAllMocks()
    }
  })
}

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
