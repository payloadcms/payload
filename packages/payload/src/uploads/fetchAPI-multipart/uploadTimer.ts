// @ts-strict-ignore
type CreateUploadTimer = (
  timeout?: number,
  callback?: () => void,
) => {
  clear: () => void
  set: () => boolean
}

export const createUploadTimer: CreateUploadTimer = (timeout = 0, callback = () => {}) => {
  let timer = null

  const clear = () => {
    clearTimeout(timer)
  }

  const set = () => {
    // Do not start a timer if zero timeout or it hasn't been set.
    if (!timeout) {
      return false
    }
    clear()
    timer = setTimeout(callback, timeout)
    return true
  }

  return { clear, set }
}
