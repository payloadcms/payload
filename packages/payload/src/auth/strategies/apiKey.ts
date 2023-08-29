import { HeaderAPIKeyStrategy as PassportAPIKeyImport } from 'passport-headerapikey';
import crypto from 'crypto';
import { PayloadRequest } from '../../express/types.js';
import { Payload } from '../../payload.js';
import find from '../../collections/operations/find.js';
import { SanitizedCollectionConfig } from '../../collections/config/types.js';

const PassportAPIKey = 'default' in PassportAPIKeyImport ? PassportAPIKeyImport.default : PassportAPIKeyImport;

export default (payload: Payload, config: SanitizedCollectionConfig): PassportAPIKeyImport => {
  const { secret } = payload;
  const opts = {
    header: 'Authorization',
    prefix: `${config.slug} API-Key `,
  };

  // @ts-expect-error
  return new PassportAPIKey(opts, true, async (apiKey, done, req) => {
    const apiKeyIndex = crypto.createHmac('sha1', secret)
      .update(apiKey)
      .digest('hex');

    try {
      const where: { [key: string]: any } = {};
      if (config.auth.verify) {
        where.and = [
          {
            // TODO: Search for index
            apiKeyIndex: {
              equals: apiKeyIndex,
            },
          },
          {
            _verified: {
              not_equals: false,
            },
          },
        ];
      } else {
        where.apiKeyIndex = {
          equals: apiKeyIndex,
        };
      }
      const userQuery = await find({
        where,
        collection: {
          config,
        },
        req: req as PayloadRequest,
        overrideAccess: true,
        depth: config.auth.depth,
      });

      if (userQuery.docs && userQuery.docs.length > 0) {
        const user = userQuery.docs[0];
        user.collection = config.slug;
        user._strategy = 'api-key';
        done(null, user);
      } else {
        done(null, false);
      }
    } catch (err) {
      done(null, false);
    }
  });
};
