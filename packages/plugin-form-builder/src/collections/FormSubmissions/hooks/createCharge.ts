import { FormConfig } from "../../../types";

const createCharge = async (beforeChangeData: any, formConfig: FormConfig) => {
  const {
    operation,
    data
  } = beforeChangeData;

  let dataWithPaymentDetails = data;

  if (operation === 'create') {
    const {
      handlePayment
    } = formConfig || {};

    if (typeof handlePayment === 'function') {
      dataWithPaymentDetails = await handlePayment(beforeChangeData);
    }
  }

  return dataWithPaymentDetails;
};

export default createCharge
