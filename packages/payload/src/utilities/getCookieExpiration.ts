const getCookieExpiration = (seconds = 7200) => {
  const currentTime = new Date()
  currentTime.setSeconds(currentTime.getSeconds() + seconds)
  return currentTime
}

export default getCookieExpiration
