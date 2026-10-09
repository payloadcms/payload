/** Built-in conventions with arbitrary additional keys owned by adapters. */
export type TransformState = BuiltInTransforms & Record<string, unknown>

/** Rectangle in the orientation-normalized original's pixels, before resizing. */
export type CropTransform = {
  /** Positive integer height in original pixels. */
  height: number
  /** Positive integer width in original pixels. */
  width: number
  /** Non-negative integer horizontal offset. */
  x: number
  /** Non-negative integer vertical offset. */
  y: number
}

/** Original-space percentages, from 0 to 100; fractional values are supported. */
export type FocalPointTransform = {
  x: number
  y: number
}

/** Positive integer target dimensions; at least one dimension is required. */
export type ResizeTransform = {
  fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside'
  withoutEnlargement?: boolean
} & ({ height: number; width?: number } | { height?: number; width: number })

/** Clockwise degrees in the orientation-normalized original's space. */
export type RotateTransform = {
  angle: number
}

/** Mirror axes; at least one axis must be enabled. */
export type FlipTransform =
  | { horizontal: true; vertical?: boolean }
  | { horizontal?: boolean; vertical: true }

/** Integer millisecond bounds, with an exclusive end greater than the start. */
export type ClipTransform = {
  endMs: number
  startMs: number
}

/** Inclusive, one-based page bounds. */
export type PageRangeTransform = {
  endPage: number
  startPage: number
}

/** Non-negative integer position in the original media, in milliseconds. */
export type PosterFrameTransform = {
  timestampMs: number
}

/** Embedded output metadata policy; extracted document metadata is independent. */
export type MetadataPolicyTransform = {
  mode: 'preserve' | 'strip'
}

export type ImageEncodingTransform = {
  progressive?: boolean
  /** Integer quality from 1 to 100. */
  quality?: number
}

export type VideoEncodingTransform = {
  audioCodec?: string
  frameRate?: number
  profile?: string
  videoBitrate?: number
  videoCodec?: string
}

export type PDFEncodingTransform = {
  downsampleImagesToDpi?: number
  linearize?: boolean
  profile?: string
  removeHiddenObjects?: boolean
  stripMetadata?: boolean
}

/** Conventional encoding options, selected by the adapter for its output media. */
export type EncodingTransform =
  | ImageEncodingTransform
  | PDFEncodingTransform
  | VideoEncodingTransform

/** Standard shapes for built-in transform keys. Additional keys remain unrestricted. */
export type BuiltInTransforms = {
  clip?: ClipTransform
  crop?: CropTransform
  encoding?: EncodingTransform
  flip?: FlipTransform
  focalPoint?: FocalPointTransform
  metadataPolicy?: MetadataPolicyTransform
  pageRange?: PageRangeTransform
  posterFrame?: PosterFrameTransform
  resize?: ResizeTransform
  rotate?: RotateTransform
}
