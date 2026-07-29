import type { Payload, PayloadRequest } from 'payload'

const sizeVariantOptions = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
  { label: 'X Large', value: 'xlarge' },
]

const colorVariantOptions = [
  { label: 'Black', value: 'black' },
  { label: 'White', value: 'white' },
]

/**
 * MongoDB cannot create the same collection namespace from two concurrent
 * transactions. On the first write to `variantOptions` the namespace and its
 * versions namespace do not exist yet, so creating the options in parallel
 * makes them race and fail with a TransientTransactionError.
 */
const createVariantOptions = async (
  payload: Payload,
  variantTypeID: string,
  options: { label: string; value: string }[],
) => {
  const created = []

  for (const option of options) {
    created.push(
      await payload.create({
        collection: 'variantOptions',
        data: {
          ...option,
          variantType: variantTypeID,
        },
      }),
    )
  }

  return created
}

export const seed = async (payload: Payload): Promise<boolean> => {
  payload.logger.info('Seeding data for ecommerce...')
  const req = {} as PayloadRequest

  try {
    const customer = await payload.create({
      collection: 'users',
      data: {
        email: 'customer@payloadcms.com',
        password: 'customer',
      },
      req,
    })

    const sizeVariantType = await payload.create({
      collection: 'variantTypes',
      data: {
        name: 'size',
        label: 'Size',
      },
    })

    const [small, medium, large, xlarge] = await createVariantOptions(
      payload,
      sizeVariantType.id,
      sizeVariantOptions,
    )

    const colorVariantType = await payload.create({
      collection: 'variantTypes',
      data: {
        name: 'color',
        label: 'Color',
      },
    })

    const [black, white] = await createVariantOptions(
      payload,
      colorVariantType.id,
      colorVariantOptions,
    )

    const hoodieProduct = await payload.create({
      collection: 'products',
      data: {
        name: 'Hoodie',
        variantTypes: [sizeVariantType.id, colorVariantType.id],
        enableVariants: true,
      },
    })

    const hoodieSmallWhite = await payload.create({
      collection: 'variants',
      data: {
        product: hoodieProduct.id,
        options: [small!.id, white!.id],
        inventory: 10,
        priceInUSDEnabled: true,
        priceInUSD: 1999,
      },
    })

    const hoodieMediumWhite = await payload.create({
      collection: 'variants',
      data: {
        product: hoodieProduct.id,
        options: [white!.id, medium!.id],
        inventory: 492,
        priceInUSDEnabled: true,
        priceInUSD: 1999,
      },
    })

    const hatProduct = await payload.create({
      collection: 'products',
      data: {
        name: 'Hat',
        priceInUSDEnabled: true,
        priceInUSD: 1999,
        priceInEUREnabled: true,
        priceInEUR: 2599,
      },
    })

    const pendingPaymentRecord = await payload.create({
      collection: 'transactions',
      data: {
        currency: 'USD',
        customer: customer.id,
        paymentMethod: 'stripe',
        stripe: {
          customerID: 'cus_123',
          paymentIntentID: 'pi_123',
        },
        status: 'pending',
      },
    })

    const succeededPaymentRecord = await payload.create({
      collection: 'transactions',
      data: {
        currency: 'USD',
        customer: customer.id,
        paymentMethod: 'stripe',
        stripe: {
          customerID: 'cus_123',
          paymentIntentID: 'pi_123',
        },
        status: 'succeeded',
      },
    })

    return true
  } catch (err) {
    // Swallowing this leaves the collections empty and surfaces thirteen tests later
    // as unrelated cart failures, so fail the suite where the problem actually is.
    payload.logger.error({ err, msg: 'Seeding data for ecommerce failed' })
    throw err
  }
}
