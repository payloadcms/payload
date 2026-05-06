export const blocksSeedData = {
  multipleBlockTypes: [
    {
      blockType: 'test-block' as const,
      blockName: 'Short Block',
      text: 'This is a short block',
    },
    {
      blockType: 'content-block' as const,
      blockName: 'Tall Content Block',
      heading: 'Welcome to Payload CMS',
      body: 'This block has significantly more content to make it taller. It demonstrates how blocks of different heights interact during drag and drop reordering.',
      link: 'https://payloadcms.com',
      footnote: 'This is a footnote for additional context.',
    },
    {
      blockType: 'hero-block' as const,
      blockName: 'Medium Hero',
      heading: 'Hero heading',
      subheading: 'A brief subheading here',
    },
    {
      blockType: 'form-block' as const,
      blockName: 'Tall Form Block',
      title: 'Contact Us',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      message:
        'This form block is the tallest, containing many fields to test drag reordering with large height differences.',
      terms: true,
    },
    {
      blockType: 'call-to-action-block' as const,
      blockName: 'Tiny CTA',
      label: 'Click me',
    },
  ],
  readOnlyBlocks: [
    {
      blockType: 'test-block' as const,
      blockName: 'Read Only Named Block',
      text: 'This is a read-only block',
    },
  ],
}
