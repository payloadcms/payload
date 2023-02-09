import { Request } from 'express';
import { Strategy } from 'passport-strategy';
import { Payload } from '../../../src/payload';
import { buildConfig } from '../../buildConfig';

export const slug = 'users';
export const strategyName = 'test-local';

export class CustomStrategy extends Strategy {
  ctx: Payload;

  constructor(ctx: Payload) {
    super();
    this.ctx = ctx;
  }

  authenticate(req: Request, options?: any): void {
    if (!req.headers.code && !req.headers.secret) {
      return this.success(null);
    }
    this.ctx.find({
      collection: slug,
      where: {
        code: {
          equals: req.headers.code,
        },
        secret: {
          equals: req.headers.secret,
        },
      },
    }).then((users) => {
      if (users.docs && users.docs.length) {
        const user = users.docs[0];
        user.collection = slug;
        user._strategy = `${slug}-${strategyName}`;
        this.success(user);
      } else {
        this.error(null);
      }
    });
  }
}

export default buildConfig({
  admin: {
    user: 'users',
  },
  collections: [
    {
      slug,
      auth: {
        disableLocalStrategy: true,
        strategies: [
          {
            name: strategyName,
            strategy: (ctx) => new CustomStrategy(ctx),
          },
        ],
      },
      access: {
        create: () => true,
      },
      fields: [
        {
          name: 'code',
          label: 'Code',
          type: 'text',
          unique: true,
          index: true,
        },
        {
          name: 'secret',
          label: 'Secret',
          type: 'text',
        },
        {
          name: 'name',
          label: 'Name',
          type: 'text',
        },
        {
          name: 'roles',
          label: 'Role',
          type: 'select',
          options: ['admin', 'editor', 'moderator', 'user', 'viewer'],
          defaultValue: 'user',
          required: true,
          saveToJWT: true,
          hasMany: true,
        },

      ],
    },
  ],
});
