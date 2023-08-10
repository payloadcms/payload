import path from 'path';
import fs from 'fs';
import type { TFunction } from 'i18next';
import { ErrorDeletingFile } from '../errors';
import type { FileData, FileToSave } from './types';
import type { SanitizedConfig } from '../config/types';
import type { SanitizedCollectionConfig } from '../collections/config/types';
import fileExists from './fileExists';

type Args = {
  config: SanitizedConfig
  collectionConfig: SanitizedCollectionConfig
  files?: FileToSave[]
  doc: Record<string, unknown>
  t: TFunction
  overrideDelete: boolean
}

export const deleteAssociatedFiles: (args: Args) => Promise<void> = async ({
  config,
  collectionConfig,
  files = [],
  doc,
  t,
  overrideDelete,
}) => {
  if (!collectionConfig.upload) return;
  if (overrideDelete || files.length > 0) {
    const { staticDir } = collectionConfig.upload;
    const staticPath = path.resolve(config.paths.configDir, staticDir);

    const fileToDelete = `${staticPath}/${doc.filename}`;

    try {
      if (await fileExists(fileToDelete)) {
        fs.unlinkSync(fileToDelete);
      }
    } catch (err) {
      throw new ErrorDeletingFile(t);
    }

    if (doc.sizes) {
      const sizes: FileData[] = Object.values(doc.sizes);
      // Since forEach will not wait until unlink is finished it could
      // happen that two operations will try to delete the same file.
      // To avoid this it is recommended to use "sync" instead
      // eslint-disable-next-line no-restricted-syntax
      for (const size of sizes) {
        const sizeToDelete = `${staticPath}/${size.filename}`;
        try {
          // eslint-disable-next-line no-await-in-loop
          if (await fileExists(sizeToDelete)) {
            fs.unlinkSync(sizeToDelete);
          }
        } catch (err) {
          throw new ErrorDeletingFile(t);
        }
      }
    }
  }
};
