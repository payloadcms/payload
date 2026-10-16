import { inspectSvg } from './validateSvg.js'

/** Detect whether an XML document's root element is namespaced SVG. */
export function detectSvgFromXml(buffer: Buffer): boolean {
  return inspectSvg(buffer).isSvg
}
