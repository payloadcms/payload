import type {
  ListViewClientProps as ListComponentClientProps,
  ListViewServerProps as ListComponentServerProps,
  CollectionPreferences as ListPreferences,
} from 'payload'

export type Props = {
  client: ListComponentClientProps
  preferences: ListPreferences
  server: ListComponentServerProps
}
