import type { ImageSize, PayloadRequest, UploadCollectionSlug } from 'payload'

export type CloudflareFormat = 'avif' | 'gif' | 'jpeg' | 'png' | 'webp'
export type CloudflareFit = 'contain' | 'cover' | 'crop' | 'scale-down'
export type CloudflareGravity =
  | 'auto'
  | 'bottom'
  | 'center'
  | 'entropy'
  | 'face'
  | 'left'
  | 'right'
  | 'top'
  | { mode: 'box-center' | 'remainder'; x?: number; y?: number }

/** The supported subset of Cloudflare's image transformation options. */
export type CloudflareTransformation = {
  background?: string
  blur?: number
  brightness?: number
  contrast?: number
  fit?: CloudflareFit
  flip?: 'h' | 'hv' | 'v'
  gamma?: number
  gravity?: CloudflareGravity
  height?: number
  rotate?: 0 | 90 | 180 | 270
  saturation?: number
  sharpen?: number
  trim?: {
    bottom?: number
    height?: number
    left?: number
    right?: number
    top?: number
    width?: number
  }
  width?: number
}

export type CloudflareOutputOptions = {
  /** Preserve animated GIF/WebP/AVIF frames. @default true */
  anim?: boolean
  format: `image/${CloudflareFormat}`
  quality?: number
}

export type CloudflareImageInfo =
  | { fileSize: number; format: string; height: number; width: number }
  | { format: 'image/svg+xml' }

/** Structural types allow generated Cloudflare bindings without a runtime SDK dependency. */
export type CloudflareImagesBinding = {
  info: (stream: ReadableStream<Uint8Array>) => Promise<CloudflareImageInfo>
  input: (stream: ReadableStream<Uint8Array>) => CloudflareImageTransformer
}

export type CloudflareImageTransformer = {
  output: (options: CloudflareOutputOptions) => Promise<{ response: () => Response }>
  transform: (options: CloudflareTransformation) => CloudflareImageTransformer
}

export type CloudflareTransport =
  | {
      /** Override the HTTP client, for example to call a service binding. */
      fetch?: typeof globalThis.fetch
      mode: 'remote'
      /** Timeout for each remote call. @default 30000 */
      timeout?: number
      /** Shared secret configured on the companion Worker. */
      token: string
      /** HTTPS endpoint running createCloudflareImagesHandler; not api.cloudflare.com. */
      url: string
    }
  | {
      binding:
        | ((args: {
            req: PayloadRequest
          }) => CloudflareImagesBinding | Promise<CloudflareImagesBinding>)
        | CloudflareImagesBinding
      mode: 'binding'
    }

export type CloudflareFormatOptions = {
  anim?: boolean
  format: CloudflareFormat
  quality?: number
}

export type CloudflareImageSizeOptions = {
  fit?: CloudflareFit
  formatOptions?: CloudflareFormatOptions
  gravity?: CloudflareGravity
  height?: number
  width?: number
  /** Omit larger variants by default; false enlarges, true retains smaller images. */
  withoutEnlargement?: boolean
}

declare module 'payload' {
  interface RegisteredImageSizeOptions {
    cloudflare: CloudflareImageSizeOptions
  }
}

export type CloudflareCollectionConfig = {
  crop?: boolean
  focalPoint?: boolean
  formatOptions?: CloudflareFormatOptions
  resizeOptions?: { withoutEnlargement?: boolean } & CloudflareTransformation
  variants?: ImageSize[]
}

export type CloudflareDynamicOptions = {
  anim?: boolean
  collections?: UploadCollectionSlug[]
  /** @default 'cover' */
  fit?: CloudflareFit
  /** Omitted keeps the source format. */
  format?: CloudflareFormat
  gravity?: CloudflareGravity
  /** @default 4096 */
  maxHeight?: number
  /** Per-frame output pixel limit. @default 16777216 */
  maxPixels?: number
  /** @default 4096 */
  maxWidth?: number
  quality?: number
  /** @default false */
  withoutEnlargement?: boolean
}

export type CloudflareTransformerOptions = {
  collections?: Partial<Record<UploadCollectionSlug, CloudflareCollectionConfig>>
  /** Disabled by default; true enables default limits for all upload collections. */
  dynamic?: boolean | CloudflareDynamicOptions
  /** @default 'cloudflare' */
  slug?: string
  transport: CloudflareTransport
}

export type DynamicTransformParseResult =
  | { error: string; isRouted: true; valid: false }
  | { height?: number; isRouted: true; valid: true; width?: number; withoutEnlargement?: boolean }
  | { isRouted: false }

export type CloudflareUploadTask = {
  formatOptions?: CloudflareFormatOptions
  transformerSlug: string
  transforms: CloudflareTransformation[]
}

export type ImagesClient = {
  info: (args: { file: File; req: PayloadRequest }) => Promise<CloudflareImageInfo>
  transform: (args: {
    file: File
    output: CloudflareOutputOptions
    req: PayloadRequest
    transforms: CloudflareTransformation[]
  }) => Promise<Response>
}
