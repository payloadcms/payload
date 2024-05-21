import React from 'react'

import type { Post } from '../../../payload-types'

import { Media } from '../../components/Media'

export const PostHero: React.FC<{
  post: Post
}> = ({ post }) => {
  const { meta: { image: metaImage } = {} } = post

  return (
    <div className="relative -z-10 -mt-[10.5rem]">
      <div className=" pt-80 min-h-[80vh]">
        <div className="">
          {metaImage && typeof metaImage !== 'string' && (
            <Media fill imgClassName="-z-10 object-cover" resource={metaImage} />
          )}
          <div className="absolute left-0 bottom-0 w-full h-full bg-gradient-to-t from-black to-transparent" />
        </div>
      </div>
    </div>
  )
}
