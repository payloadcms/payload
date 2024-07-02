import type { Collection, PayloadRequest, SanitizedGlobalConfig } from 'payload'

export type BaseRouteHandler = ({ req }: { req: PayloadRequest }) => Promise<Response> | Response

export type CollectionRouteHandler = ({
  collection,
  req,
}: {
  collection: Collection
  req: PayloadRequest
}) => Promise<Response> | Response

export type CollectionRouteHandlerWithID = ({
  id,
  collection,
  req,
}: {
  collection: Collection
  id: string
  req: PayloadRequest
}) => Promise<Response> | Response

export type GlobalRouteHandler = ({
  globalConfig,
  req,
}: {
  globalConfig: SanitizedGlobalConfig
  req: PayloadRequest
}) => Promise<Response> | Response

export type GlobalRouteHandlerWithID = ({
  id,
  globalConfig,
  req,
}: {
  globalConfig: SanitizedGlobalConfig
  id: string
  req: PayloadRequest
}) => Promise<Response> | Response
