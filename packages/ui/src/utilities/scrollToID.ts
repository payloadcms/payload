export const scrollToID = (id: string): void => {
  const element = document.getElementById(id)

  if (element) {
    const bounds = element.getBoundingClientRect()
    window.scrollBy({
      behavior: 'smooth',
      top: bounds.top - 100,
    })
  }
}
