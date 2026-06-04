import { type FilterCategory, type Idea } from './types'

type FilterIdeasOptions = {
  ideas: Idea[]
  titleQuery: string
  tagQuery: string
  category: FilterCategory
}

const normalizeText = (value: string) =>
  value.toLowerCase().replaceAll('#', '').replaceAll('ё', 'е').trim()

export function filterIdeas({
  ideas,
  titleQuery,
  tagQuery,
  category,
}: FilterIdeasOptions) {
  const normalizedTitleQuery = normalizeText(titleQuery)
  const normalizedTagQuery = normalizeText(tagQuery)

  return ideas.filter((idea) => {
    const matchesCategory = category === 'Все' || idea.category === category
    const matchesTitle =
      normalizedTitleQuery.length === 0 ||
      normalizeText(idea.title).includes(normalizedTitleQuery)
    const matchesTag =
      normalizedTagQuery.length === 0 ||
      idea.tags.some((tag) => normalizeText(tag).includes(normalizedTagQuery))

    return matchesCategory && matchesTitle && matchesTag
  })
}
