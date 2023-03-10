export const contactForm = {
  id: '63c07ffd4cb6b574b4977573',
  title: 'Contact Form',
  fields: [
    {
      name: 'full-name',
      label: 'Full Name',
      width: 100,
      required: true,
      id: '63c07f4e69853127a889530c',
      blockName: 'full-name',
      blockType: 'text',
    },
    {
      name: 'email',
      label: 'Email',
      width: 50,
      required: true,
      id: '63c07f7069853127a889530d',
      blockName: 'email',
      blockType: 'email',
    },
    {
      name: 'phone',
      label: 'Phone',
      width: 50,
      required: false,
      id: '63c07f8169853127a889530e',
      blockName: 'phone',
      blockType: 'number',
    },
    {
      name: 'message',
      label: 'Message',
      width: 100,
      required: true,
      id: '63c07f9d69853127a8895310',
      blockName: 'message',
      blockType: 'textarea',
    },
  ],
  submitButtonLabel: 'Submit',
  confirmationType: 'message',
  confirmationMessage: [
    {
      children: [
        {
          text: 'The contact form has been submitted successfully.',
        },
      ],
    },
  ],
  emails: [
    {
      emailTo: '{{email}}',
      emailFrom: 'dev@payloadcms.com',
      emailFromName: 'Payload Team',
      subject: "You've received a new message.",
      message: [
        {
          children: [
            {
              text: 'Your contact form submission was successfully received.',
            },
          ],
        },
      ],
      id: '63c07fcb69853127a8895311',
    },
  ],
  createdAt: '2023-01-12T21:47:41.374Z',
  updatedAt: '2023-01-12T21:47:41.374Z',
  redirect: {},
};
