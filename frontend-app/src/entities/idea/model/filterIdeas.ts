import { type Idea } from './types'

type FilterIdeasOptions = {
  ideas: Idea[]
  searchQuery: string
  selectedTag: string
}

const normalizeText = (value: string) =>
  value.toLowerCase().replaceAll('#', '').replaceAll('ё', 'е').trim()

export function filterIdeas({
  ideas,
  searchQuery,
  selectedTag,
}: FilterIdeasOptions) {
  const normalizedSearchQuery = normalizeText(searchQuery)
  const normalizedSelectedTag = normalizeText(selectedTag)

  return ideas.filter((idea) => {
    const matchesSearch =
      normalizedSearchQuery.length === 0 ||
      normalizeText(idea.title).includes(normalizedSearchQuery) ||
      idea.tags.some((tag) => normalizeText(tag).includes(normalizedSearchQuery))
    const matchesSelectedTag =
      normalizedSelectedTag.length === 0 ||
      idea.tags.some((tag) => normalizeText(tag) === normalizedSelectedTag)

    return matchesSearch && matchesSelectedTag
  })
}
