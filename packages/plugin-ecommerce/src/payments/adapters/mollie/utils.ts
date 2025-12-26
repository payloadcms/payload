import type { MollieClient, Customer as MollieCustomer } from '@mollie/api-client'
import type { Payload } from 'payload'

import { MollieApiError } from '@mollie/api-client'

/**
 * Retrieves or creates a Mollie customer by email.
 */
export const getOrCreateMollieCustomer = async ({
  customerEmail,
  customersSlug,
  mollie,
  payload,
}: {
  customerEmail: string
  customersSlug: string
  mollie: MollieClient
  payload: Payload
}): Promise<MollieCustomer> => {
  // Since Mollie does not support querying customers by email,
  // we need to query the customers collection in Payload.
  const customerResults = await payload.find({
    collection: customersSlug,
    depth: 0,
    limit: 1,
    select: {
      mollieCustomerID: true,
    },
    where: {
      email: {
        equals: customerEmail,
      },
    },
  })

  const payloadCustomer = customerResults.docs[0]
  const mollieCustomerID = payloadCustomer?.mollieCustomerID as string | undefined

  let customer: MollieCustomer | undefined
  if (mollieCustomerID) {
    try {
      customer = await mollie.customers.get(mollieCustomerID)
    } catch (error) {
      if (error instanceof MollieApiError && error.statusCode === 404) {
        // Customer not found, continue and try to create a new one
        customer = undefined
      } else {
        // Rethrow the error to be handled by the caller
        throw error
      }
    }
  }

  if (!customer) {
    // Create a new customer if it doesn't exist
    customer = await mollie.customers.create({
      email: customerEmail,
    })

    // Link the customer to the customer document in Payload
    await payload.update({
      collection: customersSlug,
      data: {
        mollieCustomerID: customer.id,
      },
      where: {
        email: {
          equals: customerEmail,
        },
      },
    })
  }

  return customer
}
