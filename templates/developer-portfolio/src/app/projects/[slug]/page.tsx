import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'

import { Media, Profile, Project } from '../../../payload/payload-types'
import { ProjectDetails } from '../../_components/content/projectDetails/projectDetails'
import { fetchProfile, fetchProject, fetchProjects } from '../../_utils/api'
import { parsePreviewOptions } from '../../_utils/preview'

// Force this page to be dynamic so that Next.js does not cache it
// See the note in '../../[slug]/page.tsx' about this
export const dynamic = 'force-dynamic'

interface ProjectPageProps {
  params: {
    slug: string
  }
  searchParams: Record<string, string>
}

export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
  let project: Project | null = null
  let profile: Profile | null = null

  try {
    ;[project, profile] = await Promise.all([
      fetchProject(params.slug, parsePreviewOptions(searchParams)),
      fetchProfile(),
    ])
  } catch (error) {
    console.error(error) // eslint-disable-line no-console
  }

  if (!project) {
    notFound()
  }

  return <ProjectDetails project={project} profile={profile} />
}

export async function generateStaticParams() {
  try {
    const pages = await fetchProjects()
    return pages.map(({ slug }) => ({ params: { slug } }))
  } catch (error) {
    return []
  }
}

export async function generateMetadata(
  { params, searchParams }: ProjectPageProps,
  parent?: ResolvingMetadata,
): Promise<Metadata> {
  let project: Project | null = null
  let previousTitle: string | null = null

  try {
    ;[project, previousTitle] = await Promise.all([
      fetchProject(params.slug, parsePreviewOptions(searchParams)),
      (await parent)?.title.absolute,
    ])
  } catch (error) {}

  const images: string[] = []
  if (project?.meta?.image) {
    images.push((project.meta.image as Media).url)
  } else if (project?.featuredImage) {
    images.push((project.featuredImage as Media).url)
  }

  const title = project?.meta?.title || project?.title || previousTitle
  const description = project?.meta?.description || 'Details on a portoflio project.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: 'article',
      modifiedTime: project.updatedAt,
    },
  }
}
