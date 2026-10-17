/** Read an EXIF orientation from a bounded header, ignoring malformed metadata. */
export function getImageOrientation({ data }: { data: Buffer }): number | undefined {
  const header = data.subarray(0, 65536)

  try {
    if (header[0] === 0xff && header[1] === 0xd8) {
      let offset = 2

      while (offset + 4 <= header.length && header[offset] === 0xff) {
        const marker = header[offset + 1]
        if (marker === 0xda || marker === 0xd9) {
          break
        }
        const length = header.readUInt16BE(offset + 2)
        if (length < 2 || offset + 2 + length > header.length) {
          break
        }
        if (marker === 0xe1 && header.toString('ascii', offset + 4, offset + 10) === 'Exif\0\0') {
          return readTIFFOrientation({ data: header.subarray(offset + 10, offset + 2 + length) })
        }
        offset += 2 + length
      }
    }
    if (header.toString('ascii', 0, 2) === 'II' || header.toString('ascii', 0, 2) === 'MM') {
      return readTIFFOrientation({ data: header })
    }
    if (header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP') {
      let offset = 12

      while (offset + 8 <= header.length) {
        const length = header.readUInt32LE(offset + 4)
        if (offset + 8 + length > header.length) {
          break
        }
        if (header.toString('ascii', offset, offset + 4) === 'EXIF') {
          const exif = header.subarray(offset + 8, offset + 8 + length)
          return readTIFFOrientation({
            data: exif.toString('ascii', 0, 6) === 'Exif\0\0' ? exif.subarray(6) : exif,
          })
        }
        offset += 8 + length + (length % 2)
      }
    }
  } catch {
    return undefined
  }

  return undefined
}

function readTIFFOrientation({ data }: { data: Buffer }): number | undefined {
  const isLittleEndian = data.toString('ascii', 0, 2) === 'II'
  const read16 = (offset: number) =>
    isLittleEndian ? data.readUInt16LE(offset) : data.readUInt16BE(offset)
  const read32 = (offset: number) =>
    isLittleEndian ? data.readUInt32LE(offset) : data.readUInt32BE(offset)
  const directoryOffset = read32(4)
  const count = read16(directoryOffset)

  for (let index = 0; index < count; index++) {
    const offset = directoryOffset + 2 + index * 12
    if (offset + 12 > data.length) {
      return undefined
    }
    if (read16(offset) === 0x0112 && read16(offset + 2) === 3 && read32(offset + 4) === 1) {
      const orientation = read16(offset + 8)
      return orientation >= 1 && orientation <= 8 ? orientation : undefined
    }
  }

  return undefined
}
