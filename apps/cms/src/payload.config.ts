import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { sharpTransformer } from '@payloadcms/transformer-sharp'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { ChatMessages } from './collections/ChatMessages'
import { ensureChatRetentionIndexes } from './collections/chatRetention'
import { ChatSessions } from './collections/ChatSessions'
import { Clients } from './collections/Clients'
import { Events } from './collections/Events'
import { MarketMaterials } from './collections/MarketMaterials'
import { MarketPrices } from './collections/MarketPrices'
import { PushNotifications } from './collections/PushNotifications'
import { seedMarketMaterials } from './collections/marketSeed'
import { Media, mediaVariants } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Profiles } from './collections/Profiles'
import { Users } from './collections/Users'
import { sendgridAdapter } from './email/sendgrid'
import {
  appAccountDeleteEndpoint,
  appChatMessagesEndpoint,
  appChatSessionSummaryEndpoint,
  appChatSessionsToSummarizeEndpoint,
} from './endpoints/appChat'
import {
  appClientByAccountEndpoint,
  appClientsEndpoint,
  appClientUpdateEndpoint,
} from './endpoints/appClients'
import {
  appEventDiscoveryEndpoint,
  appEventDiscoverySaveEndpoint,
} from './endpoints/appEventDiscovery'
import { appEventsEndpoint } from './endpoints/appEvents'
import { appMarketEndpoint, appMarketPricesEndpoint } from './endpoints/appMarket'
import {
  appPushNotificationResultEndpoint,
  appPushNotificationsDueEndpoint,
  appPushNotificationStartEndpoint,
} from './endpoints/appPushNotifications'
import { healthEndpoint } from './endpoints/health'
import { locales } from './locales'
import { personalCollections, personalGlobals } from './personal'
import { photoVariants } from './personal/collections/PersonalPhotos'
import { requestSizeLimit } from './requestSizeLimit'
import { s3StorageAdapter } from './storage/s3'
import { timezones } from './timezones'
import { vigorCollections, vigorGlobals } from './vigor'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Public origin the admin panel is served from, e.g. `https://cms.example.com`.
 * It must exactly match the URL in the browser's address bar (scheme + host + port),
 * otherwise Payload's CSRF protection rejects cookie-authenticated requests.
 */
const serverURL = process.env.SERVER_URL?.replace(/\/+$/, '') || ''

/**
 * Additional origins (comma-separated) allowed to call the API with credentials,
 * e.g. a separate frontend: `https://www.example.com,https://preview.example.com`.
 */
const allowedOrigins = [
  serverURL,
  ...(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean),
].filter(Boolean)

export default buildConfig({
  admin: {
    components: {
      views: {
        // Two-factor setup and login check, see src/proxy.ts
        twoFactor: {
          Component: '/components/TwoFactorView#TwoFactorView',
          exact: true,
          path: '/2fa',
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    // Default list plus cities such as Hong Kong and Paris, for event dates
    timezones,
    user: Users.slug,
  },
  collections: [
    Users,
    Media,
    Posts,
    ...personalCollections,
    Pages,
    Profiles,
    Clients,
    Events,
    ChatSessions,
    ChatMessages,
    MarketMaterials,
    MarketPrices,
    PushNotifications,
    ...vigorCollections,
  ],
  cors: allowedOrigins,
  csrf: allowedOrigins,
  db: mongooseAdapter({
    connectOptions: {
      maxPoolSize: Number(process.env.DATABASE_MAX_POOL_SIZE || 10),
      serverSelectionTimeoutMS: 10_000,
    },
    url: process.env.DATABASE_URL || '',
  }),
  editor: lexicalEditor(),
  // Sends emails such as "forgot password" through SendGrid when SENDGRID_API_KEY is set
  email: sendgridAdapter(),
  endpoints: [
    appAccountDeleteEndpoint,
    appChatMessagesEndpoint,
    appChatSessionSummaryEndpoint,
    appChatSessionsToSummarizeEndpoint,
    appClientByAccountEndpoint,
    appClientsEndpoint,
    appClientUpdateEndpoint,
    appEventsEndpoint,
    appEventDiscoveryEndpoint,
    appEventDiscoverySaveEndpoint,
    appMarketEndpoint,
    appMarketPricesEndpoint,
    appPushNotificationsDueEndpoint,
    appPushNotificationStartEndpoint,
    appPushNotificationResultEndpoint,
    healthEndpoint,
  ],
  globals: [...personalGlobals, ...vigorGlobals],
  // Only fields marked `localized: true` have a version per language; see src/locales.ts
  // Lets MongoDB delete VgemsAI app chats after 90 days, and adds the Research tab's materials the first time
  onInit: async (payload) => {
    await ensureChatRetentionIndexes(payload)
    await seedMarketMaterials(payload)
  },
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales,
  },
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL,
  storage: [s3StorageAdapter],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  upload: {
    limits: { fileSize: 50 * 1024 * 1024 },
    requestSizeLimit,
    // Image processing on upload, such as cropping (the top-level `sharp` option before Payload 4)
    // and the smaller copies of each Media image and photo (`imageSizes` before Payload 4)
    transformers: [
      sharpTransformer({
        collections: {
          media: { variants: mediaVariants },
          'personal-photos': { variants: photoVariants },
        },
      }),
    ],
  },
})
