import type { Collection, PayloadRequestWithData, SanitizedGlobalConfig } from 'payload'

export type BaseRouteHandler = ({
  req,
}: {
  req: PayloadRequestWithData
}) => Promise<Response> | Response

export type CollectionRouteHandler = ({
  collection,
  req,
}: {
  collection: Collection
  req: PayloadRequestWithData
}) => Promise<Response> | Response

export type CollectionRouteHandlerWithID = ({
  id,
  collection,
  req,
}: {
  collection: Collection
  id: string
  req: PayloadRequestWithData
}) => Promise<Response> | Response

export type GlobalRouteHandler = ({
  globalConfig,
  req,
}: {
  globalConfig: SanitizedGlobalConfig
  req: PayloadRequestWithData
}) => Promise<Response> | Response

export type GlobalRouteHandlerWithID = ({
  id,
  globalConfig,
  req,
}: {
  globalConfig: SanitizedGlobalConfig
  id: string
  req: PayloadRequestWithData
}) => Promise<Response> | Response
