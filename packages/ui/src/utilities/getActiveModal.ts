import type { useModal } from '@faceless-ui/modal'

/** Find the top open modal that has finished rendering into the DOM. */
export function getActiveModal({
  modalState,
}: {
  modalState: ReturnType<typeof useModal>['modalState']
}): HTMLElement | undefined {
  return Object.values(modalState)
    .filter((modal) => modal.isOpen)
    .sort((a, b) => (b.openedOn ?? 0) - (a.openedOn ?? 0))
    .map(
      ({ slug }) =>
        document.querySelector<HTMLElement>(`[data-payload-modal-slug="${CSS.escape(slug)}"]`) ??
        document.getElementById(slug),
    )
    .find((element): element is HTMLElement =>
      Boolean(element?.matches('dialog[open], [role="dialog"]')),
    )
}
