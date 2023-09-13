export const home = {
  title: 'Encryption Example',
  content: [
    {
      type: 'code',
      children: [
        {
          text: 'This example does 4 things:'
        }
      ]
    },
    {
      type: 'ul',
      children: [
        {
          type: 'li',
          children: [
            {
              type: 'code',
              children: [
                {
                  text: 'hides data from the api response: '
                },
                {
                  text: '${process.env.NEXT_PUBLIC_CMS_URL}/api/users/${id}',
                  code: true
                }
              ]
            }
          ]
        },
        {
          type: 'li',
          children: [
            {
              type: 'code',
              children: [
                {
                  text: 'adds a custom endpoint to fetch hidden data: '
                },
                {
                  text: '${process.env.NEXT_PUBLIC_CMS_URL}/${custom-route-here}',
                  code: true
                }
              ]
            }
          ]
        },
        {
          type: 'li',
          children: [
            {
              type: 'code',
              children: [
                {
                  text: 'encrypts the value before storing it in the database: '
                },
                {
                  type: 'link',
                  linkType: 'custom',
                  url: 'https://github.com/payloadcms/payload/tree/master/examples/encryption/payload/src/utilities/crypto.ts',
                  children: [
                    {
                      text: 'encrypt function'
                    }
                  ]
                },
                {
                  text: ''
                }
              ]
            }
          ]
        },
        {
          type: 'li',
          children: [
            {
              type: 'code',
              children: [
                {
                  text: 'decrypts the value before returning it to the client: '
                },
                {
                  type: 'link',
                  linkType: 'custom',
                  url: 'https://github.com/payloadcms/payload/tree/master/examples/encryption/payload/src/utilities/crypto.ts',
                  children: [
                    {
                      text: 'decrypt function'
                    }
                  ]
                },
                {
                  text: ''
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  slug: 'home',
  _status: 'published',
};
