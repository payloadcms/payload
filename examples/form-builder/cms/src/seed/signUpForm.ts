export const signUpForm = {
  id: '63c086c36955e39c4208aa8f',
  title: 'Sign Up Form',
  fields: [
    {
      name: 'full-name',
      label: 'Full Name',
      width: 100,
      required: true,
      id: '63c085ae69853127a889531e',
      blockName: 'full-name',
      blockType: 'text',
    },
    {
      name: 'email',
      label: 'Email',
      width: 100,
      required: true,
      id: '63c085df69853127a889531f',
      blockName: 'email',
      blockType: 'email',
    },
    {
      name: 'password',
      label: 'Password',
      width: 100,
      required: true,
      id: '63c0861869853127a8895321',
      blockName: 'password',
      blockType: 'text',
    },
    {
      message: [
        {
          children: [
            {
              text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
            },
          ],
        },
      ],
      id: '63c0865769853127a8895324',
      blockType: 'message',
    },
    {
      name: 'terms-and-conditions',
      label: 'I agree to the terms and conditions',
      required: true,
      id: '63c086a469853127a8895325',
      blockName: 'terms-and-conditions',
      blockType: 'checkbox',
    },
  ],
  submitButtonLabel: 'Create Account',
  confirmationType: 'message',
  confirmationMessage: [
    {
      children: [
        {
          text: 'Your sign up submission was successful.',
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
              text: 'Your sign up submissioin was received successfully.',
            },
          ],
        },
      ],
      id: '63c0858f69853127a889531d',
    },
  ],
  createdAt: '2023-01-12T22:16:35.480Z',
  updatedAt: '2023-01-12T22:16:35.480Z',
  redirect: {},
};
