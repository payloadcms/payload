export const getCaptureMenuScroll = ({
  captureMenuScroll,
  menuPortalTarget: _menuPortalTarget,
}: {
  captureMenuScroll?: boolean
  menuPortalTarget?: HTMLElement | null
}): boolean => {
  if (typeof captureMenuScroll === 'boolean') {
    return captureMenuScroll
  }

  return true
}
