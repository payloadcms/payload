import { Response, NextFunction } from 'express';
import { Where } from '../types';
import executeAccess from './executeAccess';
import { Forbidden } from '../errors';
import { PayloadRequest } from '../express/types';

const getExecuteStaticAccess = ({ config, Model }) => async (req: PayloadRequest, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  try {
    if (req.path) {
      const accessResult = await executeAccess({ req, isReadingStaticFile: true }, config.access.read);

      if (typeof accessResult === 'object') {
        const filename = decodeURI(req.path).replace(/^\/|\/$/g, '');

        const queryToBuild: Where = {
          and: [
            {
              or: [
                {
                  filename: {
                    equals: filename,
                  },
                },
              ],
            },
            accessResult,
          ],
        };

        if (config.upload.imageSizes) {
          config.upload.imageSizes.forEach(({ name }) => {
            queryToBuild.and[0].or.push({
              [`sizes.${name}.filename`]: {
                equals: filename,
              },
            });
          });
        }

        const query = await Model.buildQuery({
          where: queryToBuild,
          req,
          overrideAccess: true,
        });

        const doc = await Model.findOne(query);

        if (!doc) {
          throw new Forbidden(req.t);
        }
      }
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

export default getExecuteStaticAccess;
