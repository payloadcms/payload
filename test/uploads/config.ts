import path from 'path';
import fs from 'fs';
import { buildConfig } from '../e2e/buildConfig';
import { devUser } from '../credentials';
import getFileByPath from '../../src/uploads/getFileByPath';

export const mediaSlug = 'media';

export const relationSlug = 'relation';

const mockModulePath = path.resolve(__dirname, './mocks/mockFSModule.js');

export default buildConfig({
  admin: {
    webpack: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          fs: mockModulePath,
        },
      },
    }),
  },
  // upload: {},
  collections: [
    {
      slug: relationSlug,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      slug: mediaSlug,
      upload: {
        staticURL: '/media',
        staticDir: './media',
        imageSizes: [
          {
            name: 'maintainedAspectRatio',
            width: 1024,
            height: null,
            crop: 'center',
          },
          {
            name: 'tablet',
            width: 640,
            height: 480,
            crop: 'left top',
          },
          {
            name: 'mobile',
            width: 320,
            height: 240,
            crop: 'left top',
          },
          {
            name: 'icon',
            width: 16,
            height: 16,
          },
        ],
      },
      fields: [
      ],
    },
  ],
  onInit: async (payload) => {
    // delete files in /media
    const mediaDir = path.resolve(__dirname, './media');
    fs.readdirSync(mediaDir).forEach((f) => fs.rmSync(`${mediaDir}/${f}`));

    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    });
    // Create image
    const filePath = path.resolve(__dirname, './image.png');
    const file = getFileByPath(filePath);

    const { id: uploadedImage } = await payload.create({
      collection: mediaSlug,
      data: {},
      file,
    });

    await payload.create({
      collection: relationSlug,
      data: {
        image: uploadedImage,
      },
    });
  },
});
