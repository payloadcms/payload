// @ts-strict-ignore
// eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/no-obscure-range
const ACCEPTABLE_CONTENT_TYPE = /multipart\/['"()+-_]+(?:; ?['"()+-_]*)+$/i
const UNACCEPTABLE_METHODS = new Set(['CONNECT', 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'TRACE'])

const hasBody = (req: Request): boolean => {
  return Boolean(
    req.headers.get('transfer-encoding') ||
      (req.headers.get('content-length') && req.headers.get('content-length') !== '0'),
  )
}

const hasAcceptableMethod = (req: Request): boolean => !UNACCEPTABLE_METHODS.has(req.method)

const hasAcceptableContentType = (req: Request): boolean => {
  const contType = req.headers.get('content-type')
  return contType.includes('boundary=') && ACCEPTABLE_CONTENT_TYPE.test(contType)
}

export const isEligibleRequest = (req: Request): boolean => {
  try {
    return hasBody(req) && hasAcceptableMethod(req) && hasAcceptableContentType(req)
  } catch (e) {
    return false
  }
}
