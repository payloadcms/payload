const identifyAPI = (api) => {
  return (req, _, next) => {
    req.payloadAPI = api
    next()
  }
}

export default identifyAPI
