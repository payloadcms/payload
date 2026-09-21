import { createReadStream } from 'fs'
import sax, { type SAXOptions } from 'sax'
import { TextDecoder } from 'util'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const blockedElements = new Set(['embed', 'foreignobject', 'iframe', 'object', 'script'])
const animationElements = new Set(['animate', 'animatemotion', 'animatetransform', 'set'])
const animationValueAttributes = new Set(['by', 'from', 'to', 'values'])
const urlAttributes = new Set(['data', 'href', 'src'])
const urlFunctionAttributes = new Set([
  'clip-path',
  'cursor',
  'fill',
  'filter',
  'marker',
  'marker-end',
  'marker-mid',
  'marker-start',
  'mask',
  'stroke',
])

const getLocalName = (name: string): string => {
  const separator = name.lastIndexOf(':')
  return (separator === -1 ? name : name.slice(separator + 1)).toLowerCase()
}

const getPrefix = (name: string): string => {
  const separator = name.indexOf(':')
  return separator === -1 ? '' : name.slice(0, separator)
}

const hasBlockedURL = (value: string): boolean => {
  let normalizedValue = ''

  for (const character of value) {
    const codePoint = character.codePointAt(0)
    if (codePoint && codePoint > 0x20 && codePoint !== 0x7f) {
      normalizedValue += character
    }
  }

  normalizedValue = normalizedValue.toLowerCase()

  return (
    normalizedValue.includes('javascript:') ||
    normalizedValue.includes('data:text/html') ||
    normalizedValue.includes('data:image/svg+xml')
  )
}

const decodeCSSValue = (value: string): string =>
  value
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\\\r\n|\\[\n\r\f]/g, '')
    .replace(/\\([\da-f]{1,6})\s?|\\(.)/gi, (_match, hexadecimal, escapedCharacter) => {
      if (hexadecimal) {
        const codePoint = Number.parseInt(hexadecimal, 16)
        return codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : ''
      }

      return escapedCharacter || ''
    })

const hasBlockedStyles = (value: string): boolean => {
  const decodedValue = decodeCSSValue(value)

  return decodedValue.toLowerCase().includes('@import') || hasBlockedURL(decodedValue)
}

export type SvgInspection = {
  isSafe: boolean
  isSvg: boolean
  isValid: boolean
}

const getXMLDecoder = (buffer: Buffer): TextDecoder => {
  if (
    (buffer[0] === 0xff && buffer[1] === 0xfe) ||
    (buffer[0] === 0x3c && buffer[1] === 0x00 && buffer[2] === 0x3f && buffer[3] === 0x00)
  ) {
    return new TextDecoder('utf-16le')
  }

  if (
    (buffer[0] === 0xfe && buffer[1] === 0xff) ||
    (buffer[0] === 0x00 && buffer[1] === 0x3c && buffer[2] === 0x00 && buffer[3] === 0x3f)
  ) {
    return new TextDecoder('utf-16be')
  }

  return new TextDecoder('utf-8')
}

const createSvgInspector = () => {
  // sax's namespace mode walks prototype chains at every close tag. Payload only needs to resolve
  // the root SVG namespace; active descendants and attributes are checked by local name.
  const saxWithBufferLength = sax as { MAX_BUFFER_LENGTH: number } & typeof sax
  const maxBufferLength = saxWithBufferLength.MAX_BUFFER_LENGTH
  let parser: ReturnType<typeof sax.parser>
  try {
    saxWithBufferLength.MAX_BUFFER_LENGTH = Number.POSITIVE_INFINITY
    parser = sax.parser(true, {
      position: false,
      strictEntities: true,
      xmlns: false,
    } as { strictEntities: boolean } & SAXOptions)
  } finally {
    saxWithBufferLength.MAX_BUFFER_LENGTH = maxBufferLength
  }

  let attributes: Array<{ name: string; value: string }> = []
  const elementNames: string[] = []
  let isSafe = true
  let isSvg = false
  let isValid = true
  let rootElementSeen = false
  let styleContent: null | string = null
  let styleElementDepth = 0

  parser.onerror = (error) => {
    throw error
  }

  parser.onprocessinginstruction = ({ name }) => {
    if (name.toLowerCase() === 'xml-stylesheet') {
      isSafe = false
    }
  }

  parser.ondoctype = (doctype) => {
    if (doctype.includes('[') || /<!entity/i.test(doctype)) {
      isSafe = false
    }
  }

  parser.onopentagstart = (tag) => {
    attributes = []

    // sax stores attributes in a normal object and calls its hasOwnProperty method. Use a guarded
    // null-prototype object so valid XML attributes with object-property names remain supported.
    const saxAttributes = Object.create(null) as typeof tag.attributes
    tag.attributes = new Proxy(saxAttributes, {
      get: (target, property, receiver) => {
        if (property === 'hasOwnProperty') {
          return (name: string) => Object.prototype.hasOwnProperty.call(target, name)
        }

        return Reflect.get(target, property, receiver)
      },
    })
  }

  parser.onattribute = (attribute) => {
    attributes.push(attribute)
  }

  parser.onopentag = (tag) => {
    const localName = getLocalName(tag.name)
    elementNames.push(localName)

    if (!rootElementSeen) {
      rootElementSeen = true
      const prefix = getPrefix(tag.name)
      const namespaceAttribute = prefix ? `xmlns:${prefix}` : 'xmlns'
      const namespace = attributes.find(({ name }) => name === namespaceAttribute)?.value
      isSvg = localName === 'svg' && namespace === SVG_NAMESPACE
      if (!isSvg) {
        isSafe = false
      }
    }

    if (blockedElements.has(localName)) {
      isSafe = false
    }

    if (localName === 'style') {
      styleElementDepth += 1
      if (styleElementDepth === 1) {
        styleContent = ''
      }
    }

    if (animationElements.has(localName)) {
      const targetAttribute = attributes
        .find(({ name }) => getLocalName(name).toLowerCase() === 'attributename')
        ?.value.trim()
      const targetName = targetAttribute ? getLocalName(targetAttribute) : ''
      const values = attributes
        .filter(({ name }) => animationValueAttributes.has(getLocalName(name)))
        .map(({ value }) => value)
        .join(';')

      if (
        /^on[a-z]/.test(targetName) ||
        (urlAttributes.has(targetName) && hasBlockedURL(values)) ||
        (targetName === 'style' && hasBlockedStyles(values)) ||
        (urlFunctionAttributes.has(targetName) && hasBlockedStyles(values))
      ) {
        isSafe = false
      }
    }

    for (const attribute of attributes) {
      const attributeName = getLocalName(attribute.name)

      if (/^on[a-z]/.test(attributeName)) {
        isSafe = false
      }

      if (attributeName === 'style' && hasBlockedStyles(attribute.value)) {
        isSafe = false
      }

      if (urlAttributes.has(attributeName) && hasBlockedURL(attribute.value)) {
        isSafe = false
      }

      if (
        urlFunctionAttributes.has(attributeName) &&
        /url\s*\(/i.test(attribute.value) &&
        hasBlockedStyles(attribute.value)
      ) {
        isSafe = false
      }
    }
  }

  parser.onclosetag = () => {
    if (elementNames.pop() === 'style') {
      if (styleElementDepth === 1 && styleContent && hasBlockedStyles(styleContent)) {
        isSafe = false
      }
      styleElementDepth -= 1
      if (styleElementDepth === 0) {
        styleContent = null
      }
    }
  }

  const collectStyleContent = (value: string) => {
    if (styleElementDepth > 0 && styleContent !== null) {
      styleContent += value
    }
  }

  parser.ontext = collectStyleContent
  parser.oncdata = collectStyleContent

  return {
    close: () => {
      parser.close()
      if (!rootElementSeen) {
        throw new Error('Missing root element')
      }
    },
    getResult: (): SvgInspection => ({
      isSafe: rootElementSeen && isSafe && isValid,
      isSvg,
      isValid,
    }),
    hasNonSvgRoot: (): boolean => rootElementSeen && !isSvg,
    markInvalid: () => {
      isValid = false
    },
    write: (value: string) => parser.write(value),
  }
}

export function inspectSvg(buffer: Buffer): SvgInspection {
  const inspector = createSvgInspector()
  const decoder = getXMLDecoder(buffer)
  try {
    for (let offset = 0; offset < buffer.length; offset += 64 * 1024) {
      inspector.write(decoder.decode(buffer.subarray(offset, offset + 64 * 1024), { stream: true }))
      if (inspector.hasNonSvgRoot()) {
        return inspector.getResult()
      }
    }
    inspector.write(decoder.decode())
    inspector.close()
    return inspector.getResult()
  } catch (_error) {
    inspector.markInvalid()
    return { ...inspector.getResult(), isSafe: false }
  }
}

export async function inspectSvgFile(
  filePath: string,
  options?: { highWaterMark?: number },
): Promise<SvgInspection> {
  const inspector = createSvgInspector()
  let decoder: null | TextDecoder = null
  let prefix = Buffer.alloc(0)

  try {
    for await (const chunk of createReadStream(filePath, options)) {
      let content: Buffer = chunk
      if (!decoder) {
        prefix = Buffer.concat([prefix, content])
        if (prefix.length < 4) {
          continue
        }
        decoder = getXMLDecoder(prefix)
        content = prefix
      }

      inspector.write(decoder.decode(content, { stream: true }))
      if (inspector.hasNonSvgRoot()) {
        return inspector.getResult()
      }
    }
    decoder ??= getXMLDecoder(prefix)
    if (prefix.length > 0 && prefix.length < 4) {
      inspector.write(decoder.decode(prefix, { stream: true }))
    }
    inspector.write(decoder.decode())
    inspector.close()
    return inspector.getResult()
  } catch (_error) {
    inspector.markInvalid()
    return { ...inspector.getResult(), isSafe: false }
  }
}

/** Validate SVG content by parsing its XML structure and rejecting active content. */
export function validateSvg(buffer: Buffer): boolean {
  return inspectSvg(buffer).isSafe
}
