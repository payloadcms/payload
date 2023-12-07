/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { AuthLayout, generateMetadata as generateMeta } from '@payloadcms/next/layouts/Auth'
import config from 'payload-config'

export const generateMetadata = async () => generateMeta({ config })

export default async ({ children }: { children: React.ReactNode }) => (
  <AuthLayout config={config}>{children}</AuthLayout>
)
