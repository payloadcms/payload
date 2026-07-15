export type PropertyRow = { label: string; value: string }

export type BuildPropertiesArgs = {
  exif?: {
    location?: [number, number] | null // GeoJSON [longitude, latitude]
    raw?: null | Record<string, unknown>
    takenAt?: null | string // ISO string
  } | null
  file?: {
    filesize?: null | number // bytes
    height?: null | number
    mimeType?: null | string
    width?: null | number
  } | null
}

const isPresent = (value: unknown): boolean => value !== null && value !== undefined && value !== ''

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const formatShutterSpeed = (seconds: number): string =>
  seconds < 1 ? `1/${Math.round(1 / seconds)}s` : `${seconds}s`

const formatFileSize = (bytes: number): string => {
  if (bytes >= 1048576) {
    return `${(bytes / 1048576).toFixed(1)} MB`
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${bytes} B`
}

const formatGpsLatitude = (lat: number): string =>
  `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`

const formatGpsLongitude = (lng: number): string =>
  `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`

const formatDateTime = (value: string): string =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    ? `${value.slice(0, 10)} ${value.slice(11, 19)}`
    : value

const formatEnum = (value: unknown, map: Record<number, string>): null | string => {
  if (typeof value === 'number') {
    return map[value] ?? String(value)
  }
  if (typeof value === 'string' && value !== '') {
    return value
  }
  return null
}

const formatFlash = (value: unknown): null | string => {
  if (typeof value === 'number') {
    return (value & 1) === 1 ? 'On' : 'Off'
  }
  if (typeof value === 'boolean') {
    return value ? 'On' : 'Off'
  }
  if (typeof value === 'string' && value !== '') {
    return value
  }
  return null
}

const passthrough = (value: unknown): null | string => {
  if (!isPresent(value)) {
    return null
  }
  return typeof value === 'string' ? value : String(value)
}

const numericRow = (value: unknown, format: (n: number) => string): null | string =>
  isFiniteNumber(value) ? format(value) : null

export const buildProperties = (args: BuildPropertiesArgs): PropertyRow[] => {
  const exif = args.exif ?? undefined
  const file = args.file ?? undefined
  const raw: Record<string, unknown> = exif?.raw ?? {}

  const location = exif?.location
  const hasGps =
    Array.isArray(location) &&
    location.length === 2 &&
    isFiniteNumber(location[0]) &&
    isFiniteNumber(location[1])

  const rows: (null | PropertyRow)[] = [
    { label: 'Camera Make', value: passthrough(raw.Make) },
    { label: 'Camera Model', value: passthrough(raw.Model) },
    { label: 'Lens', value: passthrough(raw.LensModel ?? raw.Lens) },
    { label: 'Aperture', value: numericRow(raw.FNumber, (n) => `f/${n}`) },
    { label: 'Shutter Speed', value: numericRow(raw.ExposureTime, formatShutterSpeed) },
    { label: 'ISO', value: numericRow(raw.ISO, (n) => String(n)) },
    { label: 'Focal Length', value: numericRow(raw.FocalLength, (n) => `${n}mm`) },
    {
      label: 'Exposure Mode',
      value: formatEnum(raw.ExposureMode, { 0: 'Auto', 1: 'Manual', 2: 'Auto bracket' }),
    },
    { label: 'White Balance', value: formatEnum(raw.WhiteBalance, { 0: 'Auto', 1: 'Manual' }) },
    { label: 'Flash', value: formatFlash(raw.Flash) },
    { label: 'Date/Time', value: isPresent(exif?.takenAt) ? formatDateTime(exif!.takenAt!) : null },
    {
      label: 'GPS Latitude',
      value: hasGps ? formatGpsLatitude(location[1]) : null,
    },
    {
      label: 'GPS Longitude',
      value: hasGps ? formatGpsLongitude(location[0]) : null,
    },
    {
      label: 'Image Width',
      value: numericRow(file?.width ?? raw.ExifImageWidth ?? raw.ImageWidth, (n) => `${n} px`),
    },
    {
      label: 'Image Height',
      value: numericRow(file?.height ?? raw.ExifImageHeight ?? raw.ImageHeight, (n) => `${n} px`),
    },
    { label: 'File Size', value: numericRow(file?.filesize, formatFileSize) },
    {
      label: 'Color Space',
      value: formatEnum(raw.ColorSpace, { 1: 'sRGB', 2: 'Adobe RGB', 65535: 'Uncalibrated' }),
    },
    { label: 'Software', value: passthrough(raw.Software) },
  ].map((row) => (row.value === null ? null : { label: row.label, value: row.value }))

  return rows.filter((row): row is PropertyRow => row !== null)
}
