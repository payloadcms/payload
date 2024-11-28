'use client'
export const wrapperBlockCreateDOM = (args) => {
  console.log({ args })
  const a = document.createElement('span')
  a.style.color = 'red'
  return a
}
