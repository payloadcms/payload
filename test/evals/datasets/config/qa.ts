import type { EvalCase } from '../../types.js'

export const configQADataset: EvalCase[] = [
  {
    input:
      'What function do you call to create a Payload config, and what package does it come from?',
    expected: 'buildConfig, imported from "payload"',
    category: 'config',
  },
  {
    input: 'How do you add a plugin to a Payload config?',
    expected:
      'add it to the plugins array in buildConfig; plugins are functions that receive and return a modified config',
    category: 'config',
  },
  {
    input: 'How do you configure Payload to support multiple languages for content?',
    expected:
      'add a localization object to buildConfig with a locales array, a defaultLocale, and optionally fallback: true to fall back to the default locale when a translation is missing',
    category: 'config',
  },
  {
    input: 'How do you configure allowed CORS origins in a Payload config?',
    expected:
      'set the cors property in buildConfig to an array of allowed origin strings, or to "*" to allow all origins',
    category: 'config',
  },
  {
    input: 'How do you run code once when the Payload server first initializes?',
    expected:
      'define an onInit async function in buildConfig that receives the payload instance; it runs once after Payload has initialized',
    category: 'config',
  },
  {
    input: 'How do you customize the Payload admin panel with a custom logo and favicon?',
    expected:
      'use admin.components.graphics.Logo and admin.components.graphics.Icon in buildConfig, pointing to React components for the logo and favicon respectively',
    category: 'config',
  },
  {
    input:
      'How do you configure Payload to send emails, and what is the default behavior without configuration?',
    expected:
      'set the email property in buildConfig to an email adapter (e.g. nodemailerAdapter or resendAdapter); without configuration Payload logs emails to the console instead of sending them',
    category: 'config',
  },
]
