export const richTextData = [
  {
    type: 'ul',
    children: [
      {
        type: 'li',
        children: [
          {
            children: [
              {
                text: 'I am semantically connected to my sub-bullets',
              },
            ],
          },
          {
            type: 'ul',
            children: [
              {
                type: 'li',
                children: [
                  {
                    text: 'I am sub-bullets that are semantically connected to the parent bullet',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        children: [
          {
            text: 'Normal bullet',
          },
        ],
        type: 'li',
      },
      {
        type: 'li',
        children: [
          {
            type: 'ul',
            children: [
              {
                type: 'li',
                children: [
                  {
                    text: 'I am the old style of sub-bullet',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'li',
        children: [
          {
            text: 'Another normal bullet',
          },
        ],
      },
      {
        type: 'li',
        children: [
          {
            children: [
              {
                text: 'This text precedes a nested list',
              },
            ],
          },
          {
            type: 'ul',
            children: [
              {
                type: 'li',
                children: [
                  {
                    text: 'I am a sub-bullet',
                  },
                ],
              },
              {
                type: 'li',
                children: [
                  {
                    text: 'And I am another sub-bullet',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]
