export const isUserLocked = (date: Date): boolean => {
  if (!date) {
    return false
  }
  return date.getTime() > Date.now()
}
