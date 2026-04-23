import { startTransition, useDeferredValue, useState } from 'react'

import { AppHeader } from '../components/AppHeader'
import { FilterBar } from '../components/FilterBar'
import { IdeaFeed } from '../components/IdeaFeed'
import { IDEA_CATEGORIES, ideas } from '../data/ideas'
import { type FilterCategory } from '../types/idea'
import { filterIdeas } from '../utils/filterIdeas'

function App() {
  const [titleQuery, setTitleQuery] = useState('')
  const [tagQuery, setTagQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('Все')

  const deferredTitleQuery = useDeferredValue(titleQuery)
  const deferredTagQuery = useDeferredValue(tagQuery)

  const filteredIdeas = filterIdeas({
    ideas,
    titleQuery: deferredTitleQuery,
    tagQuery: deferredTagQuery,
    category: activeCategory,
  })

  const handleCategoryChange = (category: FilterCategory) => {
    startTransition(() => {
      setActiveCategory(category)
    })
  }

  const handleResetFilters = () => {
    startTransition(() => {
      setTitleQuery('')
      setTagQuery('')
      setActiveCategory('Все')
    })
  }

  return (
    <div className="mx-auto min-h-screen max-w-[1380px] px-4 py-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[34px] border border-white/60 bg-white/70 shadow-[0_24px_80px_-36px_rgba(41,20,73,0.45)] backdrop-blur-xl">
        <AppHeader
          titleQuery={titleQuery}
          onTitleQueryChange={setTitleQuery}
        />

        <main className="space-y-6 border-t border-slate-200/70 px-3 py-4 sm:px-5 sm:py-5 lg:px-6">
          <FilterBar
            categories={IDEA_CATEGORIES}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            tagQuery={tagQuery}
            onTagQueryChange={setTagQuery}
            resultsCount={filteredIdeas.length}
            onResetFilters={handleResetFilters}
          />
          <IdeaFeed
            ideas={filteredIdeas}
            titleQuery={titleQuery}
            tagQuery={tagQuery}
            activeCategory={activeCategory}
          />
        </main>
      </div>
    </div>
  )
}

export default App
