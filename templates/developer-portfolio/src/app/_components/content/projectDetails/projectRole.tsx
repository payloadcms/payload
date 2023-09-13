import { FC } from 'react'

import { Project } from '../../../../payload-types'

interface ProjectRolesProps {
  roles: Project['role']
}
export const ProjectRoles: FC<ProjectRolesProps> = ({ roles }) => {
  return (
    <h4 className="text-primary font-medium leading-tight lg:text-2xl pt-3">
      {roles
        .map(
          role =>
            ({
              uiUxDesigner: 'Lead UI/UX Designer',
              frontEndDeveloper: 'Front-End Developer',
              backEndDeveloper: 'Back-End Developer',
            }[role] ?? ''),
        )
        .join(', ')}
    </h4>
  )
}
