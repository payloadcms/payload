import type { TaskConfig } from 'payload'

import { updatePostStep1 } from '../runners/updatePost.js'

export const UpdatePostTask: TaskConfig<'UpdatePost'> = {
  retries: 2,
  slug: 'UpdatePost',
  interfaceName: 'MyUpdatePostType',
  inputSchema: [
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      maxDepth: 0,
      required: true,
    },
    {
      name: 'message',
      type: 'text',
      required: true,
    },
  ],
  outputSchema: [
    {
      name: 'messageTwice',
      type: 'text',
      required: true,
    },
  ],
  handler: updatePostStep1,
}
