'use client'
import { FC } from 'react'

import { Project } from '../../../../payload/payload-types'
import { MediaBlock } from '../../../_components/content/mediaBlock'
import { TechnologiesUsed } from './technologiesUsed'

interface ProjectHeroProps {
  project: Project
}

export const ProjectHero: FC<ProjectHeroProps> = ({ project }) => {
  return (
    <div className="relative z-10 lg:pl-20 mt-6 lg:mt-0 flex flex-col items-start lg:items-center justify-center col-span-6 lg:col-span-3 lg:flex-shrink-0 ">
      {project.technologiesUsed && <TechnologiesUsed technologies={project.technologiesUsed} />}
      <MediaBlock
        className="w-full lg:max-w-[545px] mb-10 md:mb-16 lg:mb-0"
        mediaFields={[{ media: project.featuredImage, size: 'full' }]}
        containerClassName="h-[51vw] sm:h-auto lg:h-[340px]"
        imageClassName="h-[51vw] sm:h-auto lg:h-[340px]"
        priority
        lightbox
      />
    </div>
  )
}
