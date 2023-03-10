export const basicForm = {
  id: '63c0651b132c8e2783f8dcae',
  updatedAt: '2023-01-12T21:25:41.113Z',
  createdAt: '2022-12-28T20:48:53.181Z',
  title: 'Basic Form',
  fields: [
    {
      name: 'first-name',
      label: 'First name',
      width: 50,
      required: true,
      id: '63adaaba5236fe69ca8973f8',
      blockName: 'first-name',
      blockType: 'text',
    },
    {
      name: 'last-name',
      label: 'Last name',
      width: 50,
      required: true,
      id: '63bf4b1fd69cef4f34272f9a',
      blockName: 'last-name',
      blockType: 'text',
    },
    {
      name: 'email',
      label: 'Email',
      width: 100,
      required: true,
      id: '63c0953adc1cd2c2f6c2d30b',
      blockName: 'email',
      blockType: 'email',
    },
    {
      name: 'coolest-project',
      label: "What's the coolest project you've built with Payload so far?",
      width: 100,
      required: false,
      id: '63adab96b65c28c168442316',
      blockName: 'coolest-project',
      blockType: 'textarea',
    },
    {
      message: [
        {
          children: [
            {
              text: 'Have a great rest of your day!',
            },
          ],
        },
        {
          children: [
            {
              text: '',
            },
          ],
        },
        {
          children: [
            {
              text: 'Sincerely, \n\nPayload Team.',
            },
          ],
        },
      ],
      id: '63adb90db65c28c168442322',
      blockName: 'farewell',
      blockType: 'message',
    },
  ],
  submitButtonLabel: 'Submit',
  confirmationType: 'message',
  confirmationMessage: [
    {
      children: [
        {
          text: 'The basic form has been submitted successfully.',
        },
      ],
    },
  ],
  emails: [
    {
      emailTo: '{{email}}',
      emailFrom: 'dev@payloadcms.com',
      emailFromName: 'Payload',
      subject: "You've received a new message.",
      message: [
        {
          children: [
            {
              text: 'Your basic form submission was successfully received.',
            },
          ],
        },
      ],
      id: '63acab72433ea1822764c538',
    },
  ],
  redirect: {},
};
