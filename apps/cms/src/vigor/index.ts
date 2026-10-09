/**
 * Content of the Vigor Gems and Jewelry website (atorpos/VigorNewWebsite): everything under
 * "Vigor website" in the admin panel. The website reads it from the REST API in each of the
 * languages in src/locales.ts (README: "Vigor website").
 *
 * The collections have drafts: only published products, service pages, news and events are public.
 * The globals don't: saving the site settings, home page or About page puts it live. With MongoDB,
 * Payload gives every global with drafts an index of the same name in the shared `globals`
 * collection, so with several of them all but one fail to build on every start.
 */
import { VigorEvents } from './collections/VigorEvents'
import { VigorNews } from './collections/VigorNews'
import { VigorProducts } from './collections/VigorProducts'
import { VigorServices } from './collections/VigorServices'
import { VigorAbout } from './globals/VigorAbout'
import { VigorHome } from './globals/VigorHome'
import { VigorSettings } from './globals/VigorSettings'

export const vigorCollections = [VigorProducts, VigorServices, VigorNews, VigorEvents]

export const vigorGlobals = [VigorSettings, VigorHome, VigorAbout]
