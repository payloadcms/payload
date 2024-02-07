import { Collection, PayloadRequest, SanitizedGlobalConfig } from 'payload/types'

export type BaseRouteHandler = ({ req }: { req: PayloadRequest }) => Promise<Response> | Response

export type CollectionRouteHandler<T = {}> = ({
  req,
  collection,
}: {
  req: PayloadRequest
  collection: Collection
} & T) => Promise<Response> | Response

export type GlobalRouteHandler<T = {}> = ({
  req,
  globalConfig,
}: {
  req: PayloadRequest
  globalConfig: SanitizedGlobalConfig
} & T) => Promise<Response> | Response
