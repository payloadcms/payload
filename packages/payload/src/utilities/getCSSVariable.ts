export default (variable) =>
  getComputedStyle(document.documentElement).getPropertyValue(`--${variable}`)
