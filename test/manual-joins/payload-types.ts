export interface Post {
  id: string
  title: string
  category: string
}

export interface Category {
  id: string
  name: string
  posts: { docs: Post[] }
}
