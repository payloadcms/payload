export interface ReviewComment {
  path: string
  line: number
  body: string
}

export interface ReviewResult {
  summary: string
  comments: ReviewComment[]
}

export interface AIProvider {
  review(params: { systemPrompt: string; diff: string }): Promise<ReviewResult>
}
