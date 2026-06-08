import { type User } from '../../user'

export type IdeaCategory =
  | 'Веб-дизайн'
  | 'Мобильные приложения'
  | 'Бренд-дизайн'
  | 'Иллюстрация'
  | 'UI/UX'
  | 'Архитектура'
  | 'Интерьер'

export type FilterCategory = 'Все' | IdeaCategory

export type Tag = {
  id: string | number
  name: string
}

export type CreateIdeaPayload = {
  title: string
  description: string
  cover_image_URL: string | null
  tags: Tag['id'][]
}

export type IdeaComment = {
  id: string
  ideaId: string
  author: User | string | number
  text: string
  created_at: string
}

export type Idea = {
  id: string
  title: string
  previewTitle: string
  description: string
  category: IdeaCategory
  tags: string[]
  author: User | string | number
  role: string
  likes: number
  comments: number
  isLikedByCurrentUser: boolean
  stage: string
  coverLabel: string
  cover: string
}
