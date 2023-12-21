import type { ObjMap } from 'graphql/jsutils/ObjMap'
import type { GraphQLFieldConfig, GraphQLFieldResolver } from 'graphql/type/definition'

import type { PayloadRequest } from '../../express/types'

import isolateObjectProperty from '../../utilities/isolateObjectProperty'

type PayloadContext = { req: PayloadRequest }

function wrapCustomResolver<TSource, TArgs, TResult>(
  resolver: GraphQLFieldResolver<TSource, PayloadContext, TArgs, TResult>,
): GraphQLFieldResolver<TSource, PayloadContext, TArgs, TResult> {
  return (source, args, context, info) => {
    return resolver(
      source,
      args,
      { ...context, req: isolateObjectProperty(context.req, 'transactionID') },
      info,
    )
  }
}

export function wrapCustomFields<TSource>(
  fields: ObjMap<GraphQLFieldConfig<TSource, PayloadContext>>,
): ObjMap<GraphQLFieldConfig<TSource, PayloadContext>> {
  for (const key in fields) {
    if (fields[key].resolve) {
      fields[key].resolve = wrapCustomResolver(fields[key].resolve)
    }
  }
  return fields
}
