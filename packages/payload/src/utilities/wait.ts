async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export default wait
