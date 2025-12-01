'use server'

import { revalidateTag, revalidatePath } from 'next/cache'

export async function revalidateFooterTag() {
  revalidateTag('global_footer')
}

export async function revalidateHeaderTag() {
  revalidateTag('global_header')
}

export async function revalidatePage(slug: string) {
  revalidateTag(`pages_${slug}`)
  revalidatePath(`/${slug}`)
}

export async function revalidatePost(slug: string) {
  revalidateTag(`posts_${slug}`)
  revalidatePath(`/posts/${slug}`)
  revalidateTag('posts-sitemap')
}

export async function revalidateRedirects() {
  revalidateTag('redirects')
}
