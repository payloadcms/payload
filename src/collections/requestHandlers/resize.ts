import { Response, NextFunction } from 'express';
import payload from '../..';
import { PayloadRequest } from '../../express/types';
import { FileData } from '../../uploads/types';
import { SanitizedCollectionConfig } from '../config/types';
import fetch from 'node-fetch';
import { TypeWithID } from '../../globals/config/types';
import sharp, { ResizeOptions } from 'sharp';
import fs from 'fs';
import path from 'path';

export default (collection: SanitizedCollectionConfig) =>
  async function resizeHandler(
    req: PayloadRequest,
    res: Response,
    next: NextFunction
  ): Promise<Response<{}> | void> {
    try {
      const image: TypeWithID & FileData & { url?: string } =
        await payload.findByID({
          collection: collection.slug,
          id: req.params.id,
        });

      let imageBuffer: Buffer;

      if (collection.upload.disableLocalStorage) {
        if (!image.url) {
          const errorMessage = 'No url property found';
          payload.logger.error(errorMessage);
          res.status(500).send(errorMessage);
        }
        payload.logger.info(`Fetching image to resize from ${image.url}`);
        const response = await fetch(image.url);
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else {
        let imagePath = path.resolve(
          payload.config.paths.configDir,
          collection.upload.staticDir,
          image.filename
        );
        imageBuffer = fs.readFileSync(imagePath);
      }

      const width = parseInt(req.query.width as string);
      const height = parseInt(req.query.height as string);
      const position = (req.query.position as string) || 'centre';

      const options: ResizeOptions = {
        position,
      };

      payload.logger.info(
        `Resizing image ${image.id} with parameters: ${JSON.stringify({
          width,
          height,
          options,
        })}`
      );

      const resized = sharp(imageBuffer).resize(width, height, options);
      const resizedBuffer = await resized.toBuffer({
        resolveWithObject: true,
      });

      res.setHeader('Content-Type', image.mimeType);
      res.setHeader('Content-Length', resizedBuffer.data.length);
      res.send(resizedBuffer.data);
    } catch (error) {
      return next(error);
    }
  };
