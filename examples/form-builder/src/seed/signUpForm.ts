export const signUpForm = {
  id: '63c086c36955e39c4208aa8f',
  confirmationMessage: {
    root: {
      type: 'root',
      children: [
        {
          type: 'heading',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: 'Your sign up submission was successful.',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          tag: 'h2',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  },
  confirmationType: 'message',
  createdAt: '2023-01-12T22:16:35.480Z',
  emails: [
    {
      id: '6644edb9cffd2c6c48a44730',
      emailFrom: '"Payload" \u003Cdemo@payloadcms.com\u003E',
      emailTo: '{{email}}',
      message: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Your sign up submission was received successfully.',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              textFormat: 0,
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      },
      subject: "You've received a new message.",
    },
    {
      id: '6644edb9cffd2c6c48a4472f',
      subject: "You've received a new message.",
    },
  ],
  fields: [
    {
      id: '63c085ae69853127a889531e',
      name: 'full-name',
      blockName: 'full-name',
      blockType: 'text',
      label: 'Full Name',
      required: true,
      width: 100,
    },
    {
      id: '63c085df69853127a889531f',
      name: 'email',
      blockName: 'email',
      blockType: 'email',
      label: 'Email',
      required: true,
      width: 100,
    },
    {
      id: '63c0861869853127a8895321',
      name: 'password',
      blockName: 'password',
      blockType: 'text',
      label: 'Password',
      required: true,
      width: 100,
    },
    {
      id: '63c0865769853127a8895324',
      blockType: 'message',
      message: [
        {
          children: [
            {
              text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
            },
          ],
        },
      ],
    },
    {
      id: '63c086a469853127a8895325',
      name: 'terms-and-conditions',
      blockName: 'terms-and-conditions',
      blockType: 'checkbox',
      label: 'I agree to the terms and conditions',
      required: true,
    },
  ],
  redirect: {},
  submitButtonLabel: 'Create Account',
  title: 'Sign Up Form',
  updatedAt: '2023-01-12T22:16:35.480Z',
}
