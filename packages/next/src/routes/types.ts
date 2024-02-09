import { Collection, PayloadRequest, SanitizedGlobalConfig } from 'payload/types'

export type BaseRouteHandler = ({ req }: { req: PayloadRequest }) => Promise<Response> | Response

export type CollectionRouteHandler = ({
  req,
  collection,
}: {
  req: PayloadRequest
  collection: Collection
}) => Promise<Response> | Response

export type CollectionRouteHandlerWithID = ({
  req,
  collection,
  id,
}: {
  req: PayloadRequest
  collection: Collection
  id: string
}) => Promise<Response> | Response

export type GlobalRouteHandler = ({
  req,
  globalConfig,
}: {
  req: PayloadRequest
  globalConfig: SanitizedGlobalConfig
}) => Promise<Response> | Response

export type GlobalRouteHandlerWithID = ({
  req,
  globalConfig,
  id,
}: {
  req: PayloadRequest
  globalConfig: SanitizedGlobalConfig
  id: string
}) => Promise<Response> | Response
