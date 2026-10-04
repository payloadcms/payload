export const scrollToID = (id: string): void => {
  const element = document.getElementById(id)

  if (element) {
    const bounds = element.getBoundingClientRect()
    let scrollContainer = element.parentElement

    while (
      scrollContainer &&
      !['auto', 'scroll'].includes(getComputedStyle(scrollContainer).overflowY)
    ) {
      scrollContainer = scrollContainer.parentElement
    }

    const scrollTarget = scrollContainer ?? window

    scrollTarget.scrollBy({
      behavior: 'smooth',
      top: bounds.top - (scrollContainer?.getBoundingClientRect().top ?? 0) - 100,
    })
  }
}
