/** A playable, audio-only file: one second of 8 kHz, 8-bit mono silence. */
export function createSilentWav(): Blob {
  const sampleRate = 8000
  const headerSize = 44
  const view = new DataView(new ArrayBuffer(headerSize + sampleRate))
  const writeText = (offset: number, text: string) =>
    [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)))

  writeText(0, 'RIFF')
  view.setUint32(4, headerSize - 8 + sampleRate, true)
  writeText(8, 'WAVE')
  writeText(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate, true)
  view.setUint16(32, 1, true)
  view.setUint16(34, 8, true)
  writeText(36, 'data')
  view.setUint32(40, sampleRate, true)
  // 8-bit PCM is unsigned, so 128 is silence
  for (let offset = headerSize; offset < view.byteLength; offset++) {
    view.setUint8(offset, 128)
  }

  return new Blob([view.buffer], { type: 'audio/wav' })
}
