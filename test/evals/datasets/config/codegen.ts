import type { EvalCase } from '../../types.js'

export const configCodegenDataset: EvalCase[] = [
  {
    category: 'config',
    configPath: 'config/codegen/admin-components',
    input:
      'Configure the admin panel to use a custom Logo component imported from "@/components/Logo" and set the admin meta titleSuffix to " | My CMS".',
    verify: {
      scorer: {
        expected:
          'admin.components.graphics.Logo set to the Logo component from "@/components/Logo" (or similar import), admin.meta.titleSuffix set to " | My CMS"',
      },
    },
  },
  {
    category: 'config',
    configPath: 'config/codegen/cors-serverurl',
    input:
      'Configure the Payload config to allow CORS from "https://myapp.com" and "https://staging.myapp.com", and set serverURL to "https://api.myapp.com".',
    verify: {
      scorer: {
        expected:
          'cors property as an array containing "https://myapp.com" and "https://staging.myapp.com", serverURL set to "https://api.myapp.com"',
      },
    },
  },
  {
    category: 'config',
    configPath: 'config/codegen/oninit-admin-user',
    input:
      'Add an onInit hook that creates a default admin user with email "admin@example.com" and role "admin" if no users exist yet in the "users" collection.',
    verify: {
      scorer: {
        expected:
          'onInit async function receiving payload, uses payload.find or payload.count on users collection, conditionally calls payload.create with email "admin@example.com" only when no users exist',
      },
    },
  },
  {
    category: 'config',
    configPath: 'config/codegen/localization',
    input:
      'Configure Payload localization with two locales: "en" (English) as the default and "fr" (French). Set fallback to the default locale.',
    verify: {
      scorer: {
        expected:
          'localization config with locales array containing en and fr locale entries, defaultLocale: "en", fallback: true',
      },
    },
  },
]
