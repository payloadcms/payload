const UNACCEPTABLE_METHODS = new Set(['GET', 'HEAD', 'DELETE', 'OPTIONS', 'CONNECT', 'TRACE'])

const hasBody = (req: Request): boolean => {
  return Boolean(
    req.headers.get('transfer-encoding') ||
      (req.headers.get('content-length') && req.headers.get('content-length') !== '0'),
  )
}

const hasAcceptableMethod = (req: Request): boolean => !UNACCEPTABLE_METHODS.has(req.method)

const hasAcceptableContentType = (req: Request): boolean => {
  const contType = req.headers.get('content-type')
  return contType.includes('multipart/form-data; boundary=')
}

export const isEligibleRequest = (req: Request): boolean => {
  try {
    return hasBody(req) && hasAcceptableMethod(req) && hasAcceptableContentType(req)
  } catch (e) {
    return false
  }
}
