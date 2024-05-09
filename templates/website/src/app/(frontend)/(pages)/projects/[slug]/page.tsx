import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import type { Project } from '../../../../../payload-types'

import { Blocks } from '../../../../_components/Blocks'
import { PayloadRedirects } from '../../../../_components/PayloadRedirects'
import { ProjectHero } from '../../../../_heros/ProjectHero'
import { generateMeta } from '../../../../_utilities/generateMeta'

const getCachedProjectBySlug = async ({ slug, draft }) => {
  const payload = await getPayload({ config: configPromise })
  const projects = await payload.find({
    collection: 'projects',
    draft,
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return projects.docs?.[0] || null
}

export default async function Project({ params: { slug } }) {
  const url = '/projects/' + slug
  const { isEnabled: draft } = draftMode()

  const project = await getCachedProjectBySlug({
    slug,
    draft,
  })

  if (!project) {
    notFound()
  }

  const { layout, relatedProjects } = project

  return (
    <React.Fragment>
      <PayloadRedirects url={url} />
      <ProjectHero project={project} />
      <Blocks
        blocks={[
          ...layout,
          {
            blockName: 'Related Projects',
            blockType: 'relatedPosts',
            docs: relatedProjects,
            introContent: [
              {
                type: 'h4',
                children: [
                  {
                    text: 'Related projects',
                  },
                ],
              },
              {
                type: 'p',
                children: [
                  {
                    text: 'The projects displayed here are individually selected for this page. Admins can select any number of related projects to display here and the layout will adjust accordingly. Alternatively, you could swap this out for the "Archive" block to automatically populate projects by category complete with pagination. To manage related projects, ',
                  },
                  {
                    type: 'link',
                    children: [
                      {
                        text: 'navigate to the admin dashboard',
                      },
                    ],
                    url: `/admin/collections/projects/${project.id}`,
                  },
                  {
                    text: '.',
                  },
                ],
              },
            ],
            relationTo: 'projects',
          },
        ]}
      />
    </React.Fragment>
  )
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const projects = await payload.find({
    collection: 'projects',
  })

  return projects.docs?.map(({ slug }) => slug)
}

export async function generateMetadata({ params: { slug } }): Promise<Metadata> {
  const { isEnabled: draft } = draftMode()

  const project = await getCachedProjectBySlug({
    slug,
    draft,
  })

  return generateMeta({ doc: project })
}
