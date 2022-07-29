import { Response, NextFunction } from 'express';
import payload from '../..';
import { PayloadRequest } from '../../express/types';
import { FileData } from '../../uploads/types';
import { SanitizedCollectionConfig } from '../config/types';
import fetch from 'node-fetch';
import { TypeWithID } from '../../globals/config/types';
import sharp from 'sharp';

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

      if (!image.url) {
        const errorMessage = 'No url property found';
        payload.logger.error(errorMessage);
        res.status(500).send(errorMessage);
      }

      let imageUrl = image.url;
      const relativeUrl = imageUrl?.indexOf('http') === -1;

      if (relativeUrl) {
        imageUrl = [req.protocol, '://', req.get('host'), image.url].join('');
      }

      const width = parseInt(req.query.width as string);
      const height = parseInt(req.query.height as string);
      const position = (req.query.position as string) || 'centre';

      payload.logger.info(
        `Resizing image from source: ${imageUrl} with parameters: ${JSON.stringify(
          {
            width,
            height,
            position,
          }
        )}`
      );

      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const resized = sharp(buffer).resize(width, height, {
        position,
      });

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
