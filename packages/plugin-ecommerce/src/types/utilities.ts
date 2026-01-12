import type { DefaultDocumentIDType, GeneratedTypes } from 'payload'

/**
 * THIS FILE IS EXTREMELY SENSITIVE PLEASE BE CAREFUL AS THERE IS EVIL AT PLAY
 *
 * This file is used to extract the types for the ecommerce plugin
 * from the user's generated types. It must be kept as a .ts file
 * and not a .tsx file, and it must not import any other files
 * that are not strictly types. This is to prevent circular
 * dependencies and to ensure that the types are always available.
 *
 * Do not add any runtime code to this file.
 */

type CartsUntyped = {
  [key: string]: any
  id: DefaultDocumentIDType
  items?: any[]
  subtotal?: number
}

type AddressesUntyped = {
  [key: string]: any
  id: DefaultDocumentIDType
}

type ResolveEcommerceType<T> = 'ecommerce' extends keyof T
  ? T['ecommerce']
  : // @ts-expect-error - typescript doesnt play nice here
    T['ecommerceUntyped']

export type TypedEcommerce = ResolveEcommerceType<GeneratedTypes>

declare module 'payload' {
  export interface GeneratedTypes {
    ecommerceUntyped: {
      collections: {
        addresses: AddressesUntyped
        carts: CartsUntyped
      }
    }
  }
}
