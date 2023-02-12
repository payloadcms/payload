import path from 'path';
import { buildConfig } from '../buildConfig';
import { devUser } from '../credentials';
import getFileByPath from '../../src/uploads/getFileByPath';
import removeFiles from '../helpers/removeFiles';
import { Uploads1 } from './collections/Upload1';
import Uploads2 from './collections/Upload2';

export const mediaSlug = 'media';

export const relationSlug = 'relation';

export const audioSlug = 'audio';

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
      slug: audioSlug,
      fields: [
        {
          name: 'audio',
          type: 'upload',
          relationTo: 'media',
          filterOptions: {
            mimeType: {
              in: ['audio/mpeg'],
            },
          },
        },
      ],
    },
    {
      slug: mediaSlug,
      upload: {
        staticURL: '/media',
        staticDir: './media',
        mimeTypes: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml', 'audio/mpeg'],
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
            height: undefined,
            crop: 'center',
            position: 'center',
            formatOptions: { format: 'png', options: { quality: 90 } },
          },
          {
            name: 'differentFormatFromMainImage',
            width: 200,
            height: undefined,
            formatOptions: { format: 'jpg', options: { quality: 90 } },
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
    Uploads1,
    Uploads2,
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
    const imageFilePath = path.resolve(__dirname, './image.png');
    const imageFile = await getFileByPath(imageFilePath);

    const { id: uploadedImage } = await payload.create({
      collection: mediaSlug,
      data: {},
      file: imageFile,
    });

    await payload.create({
      collection: relationSlug,
      data: {
        image: uploadedImage,
      },
    });

    // Create audio
    const audioFilePath = path.resolve(__dirname, './audio.mp3');
    const audioFile = await getFileByPath(audioFilePath);

    const file = await payload.create({
      collection: mediaSlug,
      data: {},
      file: audioFile,
    });

    await payload.create({
      collection: audioSlug,
      data: {
        audio: file.id,
      },
    });
  },
});
