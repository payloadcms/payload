export const navigationEventName = 'payload-confirm-navigation'

/** Runs navigation after any active unsaved-changes guard has accepted it. */
export const confirmNavigation = ({ navigate }: { navigate: () => void }): void => {
  const event = new CustomEvent<{ navigate: () => void }>(navigationEventName, {
    cancelable: true,
    detail: { navigate },
  })

  if (document.dispatchEvent(event)) {
    navigate()
  }
}
