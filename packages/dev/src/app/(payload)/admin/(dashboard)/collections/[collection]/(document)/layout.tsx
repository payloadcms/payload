/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { DocumentLayout } from '@payloadcms/next/layouts/Document'
import configPromise from 'payload-config'

export default async ({ children, params }: { children: React.ReactNode; params }) => (
  <DocumentLayout config={configPromise} collectionSlug={params.collection} id={params.id}>
    {children}
  </DocumentLayout>
)
