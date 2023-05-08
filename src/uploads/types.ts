/* eslint-disable import/no-extraneous-dependencies */
import express from 'express';
import serveStatic from 'serve-static';
import { Sharp, ResizeOptions } from 'sharp';

export type FileSize = {
  filename: string;
  filesize: number;
  mimeType: string;
  width: number;
  height: number;
}

export type FileSizes = {
  [size: string]: FileSize
}

export type FileData = {
  filename: string;
  filesize: number;
  mimeType: string;
  width: number;
  height: number;
  sizes: FileSizes;
  tempFilePath?: string;
};

export type ProbedImageSize = {
  width: number,
  height: number,
  type: string,
  mime: string,
}

/**
 * Params sent to the sharp toFormat() function
 * @link https://sharp.pixelplumbing.com/api-output#toformat
 */
export type ImageUploadFormatOptions = {
  format: Parameters<Sharp['toFormat']>[0]
  options?: Parameters<Sharp['toFormat']>[1]
}

/**
 * Params sent to the sharp trim() function
 * @link https://sharp.pixelplumbing.com/api-resize#trim
 */
export type ImageUploadTrimOptions = Parameters<Sharp['trim']>[0]

export type ImageSize = ResizeOptions & {
  name: string
  formatOptions?: ImageUploadFormatOptions
  trimOptions?: ImageUploadTrimOptions
  /**
   * @deprecated prefer position
   */
  crop?: string // comes from sharp package
};

export type GetAdminThumbnail = (args: { doc: Record<string, unknown> }) => string

export type IncomingUploadType = {
  imageSizes?: ImageSize[]
  staticURL?: string
  staticDir?: string
  disableLocalStorage?: boolean
  adminThumbnail?: string | GetAdminThumbnail
  mimeTypes?: string[]
  staticOptions?: serveStatic.ServeStaticOptions<express.Response<any, Record<string, any>>>
  handlers?: any[]
  resizeOptions?: ResizeOptions
  /** Options for original upload file only. For sizes, set each formatOptions individually. */
  formatOptions?: ImageUploadFormatOptions
  trimOptions?: ImageUploadTrimOptions
}

export type Upload = {
  imageSizes?: ImageSize[]
  staticURL: string
  staticDir: string
  disableLocalStorage: boolean
  adminThumbnail?: string | GetAdminThumbnail
  mimeTypes?: string[]
  staticOptions?: serveStatic.ServeStaticOptions<express.Response<any, Record<string, any>>>
  handlers?: any[]
  resizeOptions?: ResizeOptions;
  formatOptions?: ImageUploadFormatOptions
  trimOptions?: ImageUploadTrimOptions
}

export type File = {
  data: Buffer
  mimetype: string
  name: string
  size: number
}

export type FileToSave = {
  buffer: Buffer
  path: string
}
