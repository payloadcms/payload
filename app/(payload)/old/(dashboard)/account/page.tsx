/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { Account, generateMetadata as generateMeta } from '@payloadcms/next/pages/Account/index'
import config from '@payload-config'

export const generateMetadata = async () => generateMeta({ config })

type Args = {
  searchParams: { [key: string]: string | string[] }
}

const Page: React.FC<Args> = ({ searchParams }) => Account({ config, searchParams })

export default Page
