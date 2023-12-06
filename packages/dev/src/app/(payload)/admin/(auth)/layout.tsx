/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { AuthLayout } from '@payloadcms/next/layouts/Auth'
import configPromise from 'payload-config'

export default async ({ children }: { children: React.ReactNode }) => (
  <AuthLayout config={configPromise}>{children}</AuthLayout>
)
