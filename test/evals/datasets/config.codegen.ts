import type { EvalCase } from '../types.js'

export const configCodegenDataset: EvalCase[] = [
  {
    input:
      'Add the SEO plugin from "@payloadcms/plugin-seo" to a Payload config. Pass a generateTitle function that returns a string combining the doc title and the site name "Acme Corp".',
    expected:
      'import seoPlugin from @payloadcms/plugin-seo, add seoPlugin() call to plugins array, generateTitle function that uses doc.title and returns a string containing "Acme Corp"',
    category: 'config',
  },
  {
    input:
      'Configure the Payload admin panel to use a custom Logo component at the path "@/components/Logo" and set the admin meta titleSuffix to " | My CMS".',
    expected:
      'admin.components.graphics.Logo set to "@/components/Logo" (or similar import path), admin.meta.titleSuffix set to " | My CMS"',
    category: 'config',
  },
  {
    input:
      'Configure Payload to allow CORS from two origins: "https://myapp.com" and "https://staging.myapp.com", and set serverURL to "https://api.myapp.com".',
    expected:
      'cors property as an array containing https://myapp.com and https://staging.myapp.com, serverURL: "https://api.myapp.com"',
    category: 'config',
  },
  {
    input:
      'Write a Payload onInit hook that creates a default admin user with email "admin@example.com" and role "admin" if no users exist yet in the "users" collection.',
    expected:
      'onInit async function receiving payload, payload.find or payload.count on users collection, conditional payload.create call with email admin@example.com only when no users exist',
    category: 'config',
  },
  {
    input:
      'Configure Payload localization with two locales: "en" (English) as the default, and "fr" (French). Set fallback to the default locale.',
    expected:
      'localization config with locales array containing en and fr locale entries, defaultLocale: "en", fallback: true',
    category: 'config',
  },
]
