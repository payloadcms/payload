import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'
import type { ACLType, Options } from 'ali-oss'

import path from 'path'

interface Args {
  acl?: ACLType
  customDomain?: string
  options: Options
}

export const getGenerateURL =
  ({ acl, customDomain, options: { bucket, endpoint, region, secure } }: Args): GenerateURL =>
  ({ filename, prefix = '' }) => {
    const protocol = secure ? 'https' : 'http'
    const realEndpoint = endpoint
      ? endpoint
      : (region ? region : 'oss-cn-hangzhou') + '.aliyuncs.com'
    const host =
      acl === 'private'
        ? `${bucket}.${realEndpoint}`
        : customDomain
          ? customDomain
          : `${bucket}.${realEndpoint}`
    return `${protocol}://${host}/${path.posix.join(prefix, filename)}`
  }
