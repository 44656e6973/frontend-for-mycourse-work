export type IdeaCategory =
  | 'Веб-дизайн'
  | 'Мобильные приложения'
  | 'Бренд-дизайн'
  | 'Иллюстрация'
  | 'UI/UX'
  | 'Архитектура'
  | 'Интерьер'

export type FilterCategory = 'Все' | IdeaCategory

export type Idea = {
  id: string
  title: string
  previewTitle: string
  description: string
  category: IdeaCategory
  tags: string[]
  author: string
  role: string
  likes: number
  comments: number
  stage: string
  coverLabel: string
  cover: string
}
