export const getOffsetTop = (element: HTMLElement): number => {
  let el = element
  // Set our distance placeholder
  let distance = 0

  // Loop up the DOM
  if (el.offsetParent) {
    do {
      distance += el.offsetTop
      el = el.offsetParent as HTMLElement
    } while (el)
  }

  // Return our distance
  return distance < 0 ? 0 : distance
}
