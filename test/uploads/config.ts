import path from 'path';
import { buildConfig } from '../buildConfig';
import { devUser } from '../credentials';
import getFileByPath from '../../src/uploads/getFileByPath';
import removeFiles from '../helpers/removeFiles';

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
          ...config?.resolve?.alias,
          fs: mockModulePath,
        },
      },
    }),
  },
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
        resizeOptions: {
          width: 1280,
          height: 720,
          position: 'center',
        },
        formatOptions: {
          format: 'png',
          options: { quality: 90 },
        },
        imageSizes: [
          {
            name: 'maintainedAspectRatio',
            width: 1024,
            height: null,
            crop: 'center',
            position: 'center',
            formatOptions: { format: 'png', options: { quality: 90 } },
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
      fields: [],
    },
    {
      slug: 'unstored-media',
      upload: {
        staticURL: '/media',
        disableLocalStorage: true,
      },
      fields: [],
    },
  ],
  onInit: async (payload) => {
    const uploadsDir = path.resolve(__dirname, './media');
    removeFiles(uploadsDir);

    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    });
    // Create image
    const filePath = path.resolve(__dirname, './image.png');
    const file = await getFileByPath(filePath);

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
