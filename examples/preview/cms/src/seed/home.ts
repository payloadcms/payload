export const home = {
  "title": "Home",
  "hero": {
    "type": "highImpact",
    "richText": [
      {
        "children": [
          {
            "text": "Scalable Design System with Payload + NextJS"
          }
        ],
        "type": "h1"
      },
      {
        "children": [
          {
            "text": "Here’s some large body copy which is great for heroes."
          }
        ],
        "type": "large-body"
      }
    ],
    "links": [
      {
        "link": {
          "type": "custom",
          "url": "https://payloadcms.com",
          "label": "Go to Payload",
          "appearance": "primary"
        }
      },
      {
        "link": {
          "type": "custom",
          "url": "https://github.com/payloadcms/payload",
          "label": "Go to GitHub",
          "appearance": "secondary"
        }
      }
    ],
    "media": "{{MOUNTAIN_IMAGE}}"
  },
  "layout": [
    {
      "contentBackgroundColor": "white",
      "layout": "oneColumn",
      "columnOne": {
        "richText": [
          {
            "children": [
              {
                "text": "Here is a one-column content block."
              }
            ],
            "type": "h3"
          },
          {
            "children": [
              {
                "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
              }
            ]
          }
        ],
        "enableLink": true,
        "link": {
          "type": "custom",
          "url": "https://payloadcms.com",
          "label": "Go to Payload",
          "appearance": "primary"
        }
      },
      "blockName": "One column",
      "blockType": "content"
    },
    {
      "contentBackgroundColor": "white",
      "layout": "halfAndHalf",
      "columnOne": {
        "richText": [
          {
            "children": [
              {
                "text": "Here is a two-column content block."
              }
            ],
            "type": "h3"
          },
          {
            "children": [
              {
                "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
              }
            ]
          }
        ],
        "enableLink": true,
        "link": {
          "type": "custom",
          "url": "https://payloadcms.com",
          "label": "Go to Payload",
          "appearance": "default"
        }
      },
      "columnTwo": {
        "richText": [
          {
            "children": [
              {
                "text": "Here is a two-column content block."
              }
            ],
            "type": "h3"
          },
          {
            "children": [
              {
                "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
              }
            ]
          }
        ],
        "enableLink": true,
        "link": {
          "type": "custom",
          "url": "https://payloadcms.com",
          "label": "Go to Payload",
          "appearance": "default"
        }
      },
      "blockName": "Two column",
      "blockType": "content"
    },
    {
      "mediaBlockBackgroundColor": "white",
      "position": "default",
      "media": "{{MOUNTAIN_IMAGE}}",
      "caption": [
        {
          "children": [
            {
              "text": "This is a caption for the surfer photo above."
            }
          ]
        }
      ],
      "blockName": "Surfer",
      "blockType": "mediaBlock"
    },
    {
      "ctaBackgroundColor": "white",
      "richText": [
        {
          "children": [
            {
              "text": "This is a call-to-action."
            }
          ],
          "type": "h2"
        },
        {
          "children": [
            {
              "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor."
            }
          ]
        }
      ],
      "links": [
        {
          "link": {
            "type": "custom",
            "url": "https://payloadcms.com",
            "label": "Go to Payload",
            "appearance": "primary"
          }
        },
        {
          "link": {
            "type": "custom",
            "url": "https://github.com/payloadcms/payload",
            "label": "Go to GitHub",
            "appearance": "secondary"
          }
        }
      ],
      "blockName": "CTA",
      "blockType": "cta"
    }
  ],
  "slug": "home",
  "_status": "published",
  "meta": {
    "title": "Home page",
    "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
    "image": "{{MOUNTAIN_IMAGE}}"
  }
}