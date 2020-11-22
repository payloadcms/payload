import { Response, NextFunction } from 'express';
import executeAccess from './executeAccess';
import { Forbidden } from '../errors';
import { PayloadRequest } from '../express/types/payloadRequest';

const getExecuteStaticAccess = ({ config, Model }) => async (req: PayloadRequest, res: Response, next: NextFunction) => {
  try {
    if (req.path) {
      const accessResult = await executeAccess({ req, isReadingStaticFile: true }, config.access.read);

      if (typeof accessResult === 'object') {
        const filename = decodeURI(req.path).replace(/^\/|\/$/g, '');

        const queryToBuild = {
          where: {
            and: [
              {
                filename: {
                  equals: filename,
                },
              },
              accessResult,
            ],
          },
        };

        const query = await Model.buildQuery(queryToBuild, req.locale);
        const doc = await Model.findOne(query);

        if (!doc) {
          throw new Forbidden();
        }
      }
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

export default getExecuteStaticAccess;
