import type { Access } from 'payload'

import qs from 'qs'

import { checkRole } from '../../Users/checkRole'

/**
 * Access control for Orders based on the user's role and the query string
 */
export const adminsOrOrderedByOrPaymentId: Access = ({ data, req, req: { user } }) => {
  if (checkRole(['admin'], user)) {
    return true
  }

  const searchParams = req.searchParams
  const where = searchParams.get('where')

  const query = where ? qs.parse(where) : {}
  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore
  const paymentIntentID = query?.stripePaymentIntentID?.equals

  if (paymentIntentID) {
    return {
      stripePaymentIntentID: {
        equals: paymentIntentID,
      },
    }
  }

  return {
    orderedBy: {
      equals: user?.id,
    },
  }
}
