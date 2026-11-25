import type { useModal } from '@faceless-ui/modal'

/** Find the top open modal that has finished rendering into the DOM. */
export function getActiveModal({
  modalState,
  root = document,
}: {
  modalState: ReturnType<typeof useModal>['modalState']
  root?: Document | ShadowRoot
}): HTMLElement | undefined {
  return Object.values(modalState)
    .filter((modal) => modal.isOpen)
    .sort((a, b) => (b.openedOn ?? 0) - (a.openedOn ?? 0))
    .map(
      ({ slug }) =>
        root.querySelector<HTMLElement>(`[data-payload-modal-slug="${CSS.escape(slug)}"]`) ??
        root.getElementById(slug),
    )
    .find((element): element is HTMLElement =>
      Boolean(element?.matches('dialog[open], [role="dialog"]')),
    )
}
