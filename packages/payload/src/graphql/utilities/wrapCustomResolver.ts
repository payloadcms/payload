import type { ObjMap } from 'graphql/jsutils/ObjMap'
import type { GraphQLFieldResolver } from 'graphql/type/definition'
import type { GraphQLFieldConfig } from 'graphql/type/definition'

import type { PayloadRequest } from '../../types'

import isolateTransactionID from '../../utilities/isolateTransactionID'

type PayloadContext = { req: PayloadRequest }

function wrapCustomResolver<TSource, TArgs, TResult>(
  resolver: GraphQLFieldResolver<TSource, PayloadContext, TArgs, TResult>,
): GraphQLFieldResolver<TSource, PayloadContext, TArgs, TResult> {
  return (source, args, context, info) => {
    return resolver(source, args, { ...context, req: isolateTransactionID(context.req) }, info)
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
