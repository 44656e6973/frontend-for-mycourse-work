import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react'

import { IDEA_CATEGORIES, filterIdeas, ideasApi } from '../entities/idea'
import { type FilterCategory, type Idea } from '../entities/idea'
import { type User } from '../entities/user'
import { AuthModal } from '../features/auth'
import { FilterBar } from '../features/idea-filter'
import { AppHeader } from '../widgets/app-header'
import { IdeaFeed } from '../widgets/idea-feed'

function App() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [isIdeasLoading, setIsIdeasLoading] = useState(true)
  const [ideasError, setIdeasError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [titleQuery, setTitleQuery] = useState('')
  const [tagQuery, setTagQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<FilterCategory>(IDEA_CATEGORIES[0])

  const deferredTitleQuery = useDeferredValue(titleQuery)
  const deferredTagQuery = useDeferredValue(tagQuery)

  useEffect(() => {
    let isMounted = true

    ideasApi
      .getIdeas()
      .then((loadedIdeas) => {
        if (!isMounted) {
          return
        }

        setIdeas(loadedIdeas)
        setIdeasError(null)
      })
      .catch(() => {
        if (isMounted) {
          setIdeasError('Не удалось загрузить идеи')
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsIdeasLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const filteredIdeas = useMemo(
    () =>
      filterIdeas({
        ideas,
        titleQuery: deferredTitleQuery,
        tagQuery: deferredTagQuery,
        category: activeCategory,
      }),
    [activeCategory, deferredTagQuery, deferredTitleQuery, ideas],
  )

  const handleCategoryChange = (category: FilterCategory) => {
    startTransition(() => {
      setActiveCategory(category)
    })
  }

  const handleResetFilters = () => {
    startTransition(() => {
      setTitleQuery('')
      setTagQuery('')
      setActiveCategory(IDEA_CATEGORIES[0])
    })
  }

  return (
    <div className="mx-auto min-h-screen max-w-[1380px] px-4 py-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[34px] border border-white/60 bg-white/70 shadow-[0_24px_80px_-36px_rgba(41,20,73,0.45)] backdrop-blur-xl">
        <AppHeader
          titleQuery={titleQuery}
          currentUser={currentUser}
          onTitleQueryChange={setTitleQuery}
          onAuthClick={() => setIsAuthModalOpen(true)}
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
            activeCategory={activeCategory}
            isLoading={isIdeasLoading}
            errorMessage={ideasError}
          />
        </main>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={setCurrentUser}
      />
    </div>
  )
}

export default App
