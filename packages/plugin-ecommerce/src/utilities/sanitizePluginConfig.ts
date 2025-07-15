import type { EcommercePluginConfig, SanitizedEcommercePluginConfig } from '../types.js'

import { USD } from '../currencies/index.js'

type Props = {
  pluginConfig: EcommercePluginConfig
}

export const sanitizePluginConfig = ({ pluginConfig }: Props): SanitizedEcommercePluginConfig => {
  const config = {
    ...pluginConfig,
  } as Partial<SanitizedEcommercePluginConfig>

  if (typeof config.customers === 'undefined') {
    config.customers = {
      slug: 'users',
      addresses: true,
    }
  } else {
    if (typeof config.customers.addresses === 'undefined') {
      config.customers.addresses = true
    }
  }

  if (!config.currencies) {
    config.currencies = {
      defaultCurrency: 'USD',
      supportedCurrencies: [USD],
    }
  }

  if (
    typeof config.inventory === 'undefined' ||
    (typeof config.inventory === 'boolean' && config.inventory === true)
  ) {
    config.inventory = {
      fieldName: 'inventory',
    }
  }

  if (typeof config.carts === 'undefined') {
    config.carts = true
  }

  if (typeof config.orders === 'undefined') {
    config.orders = true
  }

  if (typeof config.transactions === 'undefined') {
    config.transactions = true
  }

  if (typeof config.payments === 'undefined') {
    config.payments = {
      paymentMethods: [],
    }
  } else if (!config.payments.paymentMethods) {
    config.payments.paymentMethods = []
  }

  return config as SanitizedEcommercePluginConfig
}
