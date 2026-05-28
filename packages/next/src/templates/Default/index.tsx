/**
 * @deprecated Import `DefaultTemplateServer` from `@payloadcms/ui/templates/Default/Server` directly.
 * This re-export is kept for backwards compatibility and uses the chrome-resolving server
 * template that lives in `@payloadcms/ui` (so both Next and TanStack adapters can use it).
 */
export {
  DefaultTemplateServer as DefaultTemplate,
  type DefaultTemplateServerProps as DefaultTemplateProps,
} from '@payloadcms/ui/templates/Default/Server'
