import type { TaskConfig } from 'payload'

import { updatePostStep2 } from '../runners/updatePost.js'

export const UpdatePostStep2Task: TaskConfig<'UpdatePostStep2'> = {
  retries: 2,
  slug: 'UpdatePostStep2',
  inputSchema: [
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      maxDepth: 0,
      required: true,
    },
    {
      name: 'messageTwice',
      type: 'text',
      required: true,
    },
  ],
  handler: updatePostStep2,
}
