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

export const seed = async (payload: Payload): Promise<boolean> => {
  payload.logger.info('Seeding data...')
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

    const [small, medium, large, xlarge] = await Promise.all(
      sizeVariantOptions.map((option) => {
        return payload.create({
          collection: 'variantOptions',
          data: {
            ...option,
            variantType: sizeVariantType.id,
          },
        })
      }),
    )

    const colorVariantType = await payload.create({
      collection: 'variantTypes',
      data: {
        name: 'color',
        label: 'Color',
      },
    })

    const [black, white] = await Promise.all(
      colorVariantOptions.map((option) => {
        return payload.create({
          collection: 'variantOptions',
          data: {
            ...option,
            variantType: colorVariantType.id,
          },
        })
      }),
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
        priceInUSD: {
          enabled: true,
          amount: 1999,
        },
      },
    })

    const hoodieMediumWhite = await payload.create({
      collection: 'variants',
      data: {
        product: hoodieProduct.id,
        options: [white!.id, medium!.id],
        inventory: 492,
        priceInUSD: {
          enabled: true,
          amount: 1999,
        },
      },
    })

    const hatProduct = await payload.create({
      collection: 'products',
      data: {
        name: 'Hat',

        priceInUSD: {
          enabled: true,
          amount: 1999,
        },
        priceInEUR: {
          enabled: true,
          amount: 1999,
        },
      },
    })

    const pendingTransaction = await payload.create({
      collection: 'transactions',
      data: {
        currency: 'USD',
        customer: customer.id,
        paymentMethod: 'stripe',
        stripe: {
          stripeCustomerID: 'cus_123',
          stripePaymentIntentID: 'pi_123',
        },
        status: 'pending',
        cartSnapshot: [
          {
            product: hoodieProduct.id,
            variant: hoodieSmallWhite.id,
            quantity: 1,
          },
          {
            product: hatProduct.id,
            variant: null,
            quantity: 2,
          },
        ],
      },
    })

    const succeededTransaction = await payload.create({
      collection: 'transactions',
      data: {
        currency: 'USD',
        customer: customer.id,
        paymentMethod: 'stripe',
        stripe: {
          stripeCustomerID: 'cus_123',
          stripePaymentIntentID: 'pi_123',
        },
        status: 'succeeded',
        cartSnapshot: [
          {
            product: hoodieProduct.id,
            variant: hoodieSmallWhite.id,
            quantity: 1,
          },
          {
            product: hatProduct.id,
            variant: null,
            quantity: 2,
          },
        ],
      },
    })

    return true
  } catch (err) {
    console.error(err)
    return false
  }
}
