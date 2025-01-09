type ReturnType = {
  ext: string
  mime: string
}

const extensionMap: {
  [ext: string]: string
} = {
  css: 'text/css',
  csv: 'text/csv',
  htm: 'text/html',
  html: 'text/html',
  js: 'application/javascript',
  json: 'application/json',
  md: 'text/markdown',
  svg: 'image/svg+xml',
  xml: 'application/xml',
  yml: 'application/x-yaml',
}

export const getFileTypeFallback = (path: string): ReturnType => {
  const ext = path.split('.').pop() || 'txt'

  return {
    ext,
    mime: extensionMap[ext] || 'text/plain',
  }
}
