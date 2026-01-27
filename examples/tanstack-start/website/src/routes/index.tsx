import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

async function fetchPosts() {
  const response = await fetch('http://localhost:3000/api/posts?sort=createdAt&limit=0')
  if (!response.ok) {
    throw new Error('Failed to fetch posts')
  }
  return response.json()
}

async function createPost(title: string) {
  const response = await fetch('http://localhost:3000/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  })
  if (!response.ok) {
    throw new Error('Failed to create post')
  }
  return response.json()
}

async function deletePost(id: string) {
  const response = await fetch(`http://localhost:3000/api/posts/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete post')
  }
  return response.json()
}

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [newPostTitle, setNewPostTitle] = useState('')
  const queryClient = useQueryClient()

  const {
    data: postsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  const addPostMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      setNewPostTitle('')
    },
  })

  const deletePostMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  const handleAddPost = () => {
    if (newPostTitle.trim()) {
      addPostMutation.mutate(newPostTitle.trim())
    }
  }

  const handleDeletePost = (id: string) => {
    deletePostMutation.mutate(id)
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {(error as Error).message}</div>

  const posts = postsData?.docs || []

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Posts from Payload</h1>
      <div className="mb-4">
        <input
          type="text"
          value={newPostTitle}
          onChange={(e) => setNewPostTitle(e.target.value)}
          placeholder="New post title"
          className="border p-2 mr-2"
          disabled={addPostMutation.isPending}
        />
        <button
          onClick={handleAddPost}
          disabled={addPostMutation.isPending}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-blue-300"
        >
          {addPostMutation.isPending ? 'Adding...' : 'Add Post'}
        </button>
      </div>
      <ul className="space-y-2">
        {posts.map((post: any) => (
          <li key={post.id} className="flex items-center justify-between p-4 border rounded">
            <h3 className="text-lg">{post.title}</h3>
            <button
              onClick={() => handleDeletePost(post.id)}
              disabled={deletePostMutation.isPending}
              className="bg-red-500 text-white px-2 py-1 rounded disabled:bg-red-300"
            >
              {deletePostMutation.isPending ? 'Deleting...' : 'X'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
