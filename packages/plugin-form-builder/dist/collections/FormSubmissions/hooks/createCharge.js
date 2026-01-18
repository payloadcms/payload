export const createCharge = async (beforeChangeData, formConfig)=>{
    const { data, operation } = beforeChangeData;
    let dataWithPaymentDetails = data;
    if (operation === 'create') {
        const { handlePayment } = formConfig || {};
        if (typeof handlePayment === 'function') {
            // eslint-disable-next-line @typescript-eslint/await-thenable
            dataWithPaymentDetails = await handlePayment(beforeChangeData);
        }
    }
    return dataWithPaymentDetails;
};

//# sourceMappingURL=createCharge.js.map