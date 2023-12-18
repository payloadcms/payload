import type { PluginConfig } from '../../../types'

const createCharge = async (beforeChangeData: any, formConfig: PluginConfig): Promise<any> => {
  const { data, operation } = beforeChangeData

  let dataWithPaymentDetails = data

  if (operation === 'create') {
    const { handlePayment } = formConfig || {}

    if (typeof handlePayment === 'function') {
      dataWithPaymentDetails = await handlePayment(beforeChangeData)
    }
  }

  return dataWithPaymentDetails
}

export default createCharge
