const isLocked = (date: number): boolean => {
  if (!date) {
    return false
  }
  return date > Date.now()
}
export default isLocked
