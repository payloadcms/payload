import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import Categories from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
import { seed } from './seed'

export const pagesSlug = 'pages'

export const mobileBreakpoint = {
  label: 'Mobile',
  name: 'mobile',
  width: 375,
  height: 667,
}

const mockModulePath = path.resolve(__dirname, './mocks/mockFSModule.js')

export default buildConfigWithDefaults({
  admin: {
    livePreview: {
      // You can also define this per collection or per global
      // The Live Preview config is inherited from the top down
      url: ({ data, documentInfo }) =>
        `http://localhost:3001${
          documentInfo?.slug && documentInfo.slug !== 'pages' ? `/${documentInfo.slug}` : ''
        }${data?.slug && data.slug !== 'home' ? `/${data.slug}` : ''}`,
      breakpoints: [mobileBreakpoint],
      collections: ['pages', 'posts'],
      globals: ['header', 'footer'],
    },
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
  cors: ['http://localhost:3001'],
  csrf: ['http://localhost:3001'],
  collections: [Users, Pages, Posts, Categories, Media],
  globals: [Header, Footer],
  onInit: seed,
})
