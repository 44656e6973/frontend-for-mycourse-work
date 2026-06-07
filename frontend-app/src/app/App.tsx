import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'

import { IDEA_CATEGORIES, filterIdeas, ideasApi } from '../entities/idea'
import { type CreateIdeaPayload, type FilterCategory, type Idea, type IdeaComment } from '../entities/idea'
import { type User, authApi } from '../entities/user'
import { AuthModal } from '../features/auth'
import { CreateIdeaPage } from '../features/idea-create'
import { FilterBar } from '../features/idea-filter'
import { ProfilePage } from '../features/profile'
import { AppHeader } from '../widgets/app-header'
import { IdeaFeed } from '../widgets/idea-feed'
import { AUTH_TOKENS_CHANGED_EVENT, tokenStorage } from '../shared/api/tokenStorage'

const CREATE_IDEA_PATH = '/ideas/new'
const PROFILE_PATH = '/profile'

type AppPage = 'feed' | 'create-idea' | 'profile'

function getPageFromLocation(): AppPage {
  if (window.location.pathname === CREATE_IDEA_PATH) {
    return 'create-idea'
  }

  if (window.location.pathname === PROFILE_PATH) {
    return 'profile'
  }

  return 'feed'
}

function getPathForPage(page: AppPage) {
  switch (page) {
    case 'create-idea':
      return CREATE_IDEA_PATH
    case 'profile':
      return PROFILE_PATH
    default:
      return '/'
  }
}

function getInitialRouteState() {
  const requestedPage = getPageFromLocation()

  if (requestedPage === 'create-idea' || requestedPage === 'profile') {
    window.history.replaceState(null, '', getPathForPage('feed'))

    return {
      page: 'feed' as AppPage,
      shouldOpenAuthModal: true,
    }
  }

  return {
    page: requestedPage,
    shouldOpenAuthModal: false,
  }
}

function App() {
  const [initialRoute] = useState(getInitialRouteState)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [isIdeasLoading, setIsIdeasLoading] = useState(true)
  const [ideasError, setIdeasError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(initialRoute.shouldOpenAuthModal)
  const [currentPage, setCurrentPage] = useState<AppPage>(initialRoute.page)
  const [titleQuery, setTitleQuery] = useState('')
  const [tagQuery, setTagQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<FilterCategory>(IDEA_CATEGORIES[0])

  const deferredTitleQuery = useDeferredValue(titleQuery)
  const deferredTagQuery = useDeferredValue(tagQuery)

  const navigateToPage = useCallback((page: AppPage, mode: 'push' | 'replace' = 'push') => {
    const nextPath = getPathForPage(page)

    if (window.location.pathname !== nextPath) {
      if (mode === 'replace') {
        window.history.replaceState(null, '', nextPath)
      } else {
        window.history.pushState(null, '', nextPath)
      }
    }

    setCurrentPage(page)
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      const requestedPage = getPageFromLocation()

      if ((requestedPage === 'create-idea' || requestedPage === 'profile') && !currentUser) {
        navigateToPage('feed', 'replace')
        setIsAuthModalOpen(true)
        return
      }

      setCurrentPage(requestedPage)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [currentUser, navigateToPage])

  useEffect(() => {
    const handleAuthTokensChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ hasTokens: boolean }>).detail

      if (detail?.hasTokens) {
        return
      }

      setCurrentUser(null)

      if (getPageFromLocation() === 'create-idea' || getPageFromLocation() === 'profile') {
        navigateToPage('feed', 'replace')
      }
    }

    window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, handleAuthTokensChanged)

    return () => {
      window.removeEventListener(AUTH_TOKENS_CHANGED_EVENT, handleAuthTokensChanged)
    }
  }, [navigateToPage])

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

  const handleOpenCreateIdea = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true)
      return
    }

    navigateToPage('create-idea')
  }

  const handleOpenProfile = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true)
      return
    }

    navigateToPage('profile')
  }

  const handleBackToFeed = () => {
    navigateToPage('feed')
  }

  const handleProfileUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser)
  }

  const handleRequireAuth = () => {
    setIsAuthModalOpen(true)
  }

  const handleToggleIdeaLike = async (idea: Idea) => {
    if (!currentUser || !tokenStorage.hasTokens()) {
      setIsAuthModalOpen(true)
      throw new Error('Войдите, чтобы поставить лайк')
    }

    const likeState = await ideasApi.toggleIdeaLike(idea)

    setIdeas((currentIdeas) =>
      currentIdeas.map((currentIdea) =>
        currentIdea.id === idea.id
          ? {
              ...currentIdea,
              likes: likeState.likes,
              isLikedByCurrentUser: likeState.isLikedByCurrentUser,
            }
          : currentIdea,
      ),
    )
  }

  const handleLoadIdeaComments = (ideaId: string) => ideasApi.getIdeaComments(ideaId)

  const handleCreateIdeaComment = async (ideaId: string, text: string): Promise<IdeaComment> => {
    if (!currentUser || !tokenStorage.hasTokens()) {
      setIsAuthModalOpen(true)
      throw new Error('Войдите, чтобы написать комментарий')
    }

    const createdComment = await ideasApi.createIdeaComment(ideaId, text, currentUser)

    setIdeas((currentIdeas) =>
      currentIdeas.map((currentIdea) =>
        currentIdea.id === ideaId
          ? {
              ...currentIdea,
              comments: currentIdea.comments + 1,
            }
          : currentIdea,
      ),
    )

    return createdComment
  }

  const handleCreateIdea = async (payload: CreateIdeaPayload, selectedTags: string[]) => {
    if (!currentUser || !tokenStorage.hasTokens()) {
      setIsAuthModalOpen(true)
      throw new Error('Войдите заново, чтобы создать идею')
    }

    const createdIdea = await ideasApi.createIdea(payload, currentUser, selectedTags)

    startTransition(() => {
      setIdeas((currentIdeas) => [createdIdea, ...currentIdeas])
      setTitleQuery('')
      setTagQuery('')
      setActiveCategory(IDEA_CATEGORIES[0])
    })

    navigateToPage('feed')
  }

  const handleLogout = async () => {
    console.log('Starting logout...')
    try {
      await authApi.logout()
      console.log('Logout API call successful')
    } catch (error) {
      console.error('Logout API error:', error)
      // Даже если запрос ошибётся, очищаем токены локально
    } finally {
      console.log('Clearing tokens and resetting user')
      tokenStorage.clearTokens()
      setCurrentUser(null)
      navigateToPage('feed')
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-[1380px] px-4 py-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[34px] border border-white/60 bg-white/70 shadow-[0_24px_80px_-36px_rgba(41,20,73,0.45)] backdrop-blur-xl">
        <AppHeader
          titleQuery={titleQuery}
          currentUser={currentUser}
          isCreateButtonVisible={currentPage !== 'create-idea'}
          isSearchVisible={currentPage === 'feed'}
          onTitleQueryChange={setTitleQuery}
          onAuthClick={() => setIsAuthModalOpen(true)}
          onCreateIdeaClick={handleOpenCreateIdea}
          onProfileClick={handleOpenProfile}
          onLogout={handleLogout}
        />

        <main className="space-y-6 border-t border-slate-200/70 px-3 py-4 sm:px-5 sm:py-5 lg:px-6">
          {currentPage === 'create-idea' && currentUser ? (
            <CreateIdeaPage
              currentUser={currentUser}
              onBack={handleBackToFeed}
              onCreateIdea={handleCreateIdea}
            />
          ) : currentPage === 'profile' && currentUser ? (
            <ProfilePage
              currentUser={currentUser}
              onBack={handleBackToFeed}
              onProfileUpdate={handleProfileUpdate}
            />
          ) : (
            <>
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
                currentUser={currentUser}
                onRequireAuth={handleRequireAuth}
                onToggleLike={handleToggleIdeaLike}
                onLoadComments={handleLoadIdeaComments}
                onCreateComment={handleCreateIdeaComment}
              />
            </>
          )}
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
