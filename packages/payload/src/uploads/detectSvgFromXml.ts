import { inspectSvg } from './validateSvg.js'

export const detectSvgFromXml = (buffer: Buffer): boolean => inspectSvg(buffer).isSvg
