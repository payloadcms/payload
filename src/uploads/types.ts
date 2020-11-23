export type FileSizes = {
  [size: string]: {
    filename: string;
    filesize: number;
    mimeType: string;
    name: string;
    width: number;
    height: number;
    crop: string;
  }
}

export type FileData = {
  filename: string;
  filesize: number;
  mimeType: string;
  width: number;
  height: number;
  sizes: FileSizes;
};
