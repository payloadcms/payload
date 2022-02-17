import { FormConfig } from "../../../types";

const createCharge = async (beforeChangeData, formConfig: FormConfig) => {
  const {
    operation
  } = beforeChangeData;

  if (operation === 'create') {
    const {
      handlePayment
    } = formConfig || {};

    if (typeof handlePayment === 'function') {
      handlePayment(beforeChangeData);
    }
  }

  return beforeChangeData;
};

export default createCharge
