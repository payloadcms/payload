'use client'
import { FC } from 'react'

import { Project } from '../../../../payload-types'
import { formatMonth } from '../../../_utils/format'
import { ProjectRoles } from './projectRole'

interface ProjectDetailsHeadlineProps {
  project: Project
}

export const ProjectDetailsHeadline: FC<ProjectDetailsHeadlineProps> = ({
  project,
}: ProjectDetailsHeadlineProps) => {
  return (
    <div className="relative z-0 text-foreground lg:pb-8 lg:pr-16 w-full lg:w-1/2">
      <h1 className="font-bold leading-[30-px] text-2xl lg:text-5xl">{project.title}</h1>
      {project.startDate && (
        <p className="leading-6 text-base pt-2">
          {formatMonth(project.startDate)}
          {project.endDate && ` - ${formatMonth(project.endDate)}`}
        </p>
      )}
      <ProjectRoles roles={project.role} />
    </div>
  )
}
