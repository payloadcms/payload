import { FC } from 'react'

import { Project, Technology } from '../../../../payload/payload-types'

export interface TechnologiesUsedProps {
  technologies: Project['technologiesUsed']
}

export const TechnologiesUsed: FC<TechnologiesUsedProps> = ({ technologies }) => {
  return (
    <div>
      <div className="flex justify-start w-full font-medium lg:text-xl">
        <h4>Technologies Used</h4>
      </div>
      <ul className="flex gap-5 lg:text-xl flex-wrap mt-5 mb-4 lg:mb-6 w-full max-w-[532px] text-primary">
        {technologies.map(technology => (
          <li
            className="border border-primary dark:border-foreground px-5 py-1 lg:py-2 rounded-md "
            key={(technology as Technology).id}
          >
            {(technology as Technology).name}
          </li>
        ))}
      </ul>
    </div>
  )
}
