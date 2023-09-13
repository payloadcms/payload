import payload from 'payload'

const confirmationMessage = [
  {
    children: [
      {
        text: "Thank you! I'll be reaching out to you shortly.",
      },
    ],
  },
]

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const seedForms = async () => {
  const contactForm = await payload.create({
    collection: 'forms',
    data: {
      title: 'Contact Form',
      fields: [
        {
          name: 'firstname',
          label: 'First Name',
          width: 50,
          required: true,
          blockType: 'text',
        },
        {
          name: 'lastname',
          label: 'Last Name',
          width: 50,
          required: true,
          blockType: 'text',
        },
        {
          name: 'email',
          label: 'Email',
          width: 100,
          required: true,
          blockType: 'email',
        },
        {
          name: 'subject',
          label: 'Subject',
          width: 100,
          required: true,
          blockType: 'text',
        },
        {
          name: 'message',
          label: 'Message',
          width: 100,
          required: true,
          blockType: 'textarea',
        },
      ],
      submitButtonLabel: 'Submit',
      confirmationType: 'message',
      confirmationMessage: confirmationMessage,
    },
  })

  return { contactForm }
}

export type InitialForms = Awaited<ReturnType<typeof seedForms>>
