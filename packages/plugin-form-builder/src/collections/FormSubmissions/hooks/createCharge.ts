import type { FormBuilderPluginConfig } from '../../../types.js'

export const createCharge = async (
  beforeChangeData: any,
  formConfig: FormBuilderPluginConfig,
): Promise<any> => {
  const { data, operation } = beforeChangeData

  let dataWithPaymentDetails = data

  if (operation === 'create') {
    const { handlePayment } = formConfig || {}

    if (typeof handlePayment === 'function') {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      dataWithPaymentDetails = await handlePayment(beforeChangeData)
    }
  }

  return dataWithPaymentDetails
}
