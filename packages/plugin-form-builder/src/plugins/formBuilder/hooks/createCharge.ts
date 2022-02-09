import payload from "payload";
import Stripe from 'stripe';

// see https://github.com/stripe/stripe-node#usage-with-typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
})

const createCharge = async ({ data, operation }) => {
  if (operation === 'create') {
    const {
      form: {
        fields: formFields = []
      } = {},
      submissionData
    } = data;

    if (submissionData && submissionData.length > 0) {
      submissionData.forEach(async submission => {
        const {
          field: submittedFieldName,
          id: submittedID,
          token: submittedToken,
        } = submission;

        const foundField = formFields.find(formField => formField.name === submittedFieldName);

        if (foundField) {
          const {
            blockType,
            paymentProcessor,
            amount
          } = foundField;

          if (blockType === 'payment') {
            if (paymentProcessor === 'stripe') {
              try {
                const charge = await stripe.charges.create({
                  amount: amount,
                  currency: 'usd',
                  source: submittedToken,
                  // receipt_email: email,
                });

                data.payment.push({
                  field: submittedID,
                  status: 'paid',
                  amount: charge.amount,
                  creditCard: {
                    source: submittedToken,
                    brand: charge.payment_method_details.card.brand,
                    number: `xxxx-xxxx-xxxx-${charge.payment_method_details.card.last4}`,
                  }
                });
              } catch (err) {
                payload.logger.error(err);
                payload.logger.error(`Error processing payment.`);
              }
            }
          }
        }
      });
    }
  }

  return data;
};

export default createCharge
