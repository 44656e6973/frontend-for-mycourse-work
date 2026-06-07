import { type FilterCategory, type Idea } from './types'

export const IDEA_CATEGORIES: FilterCategory[] = [
  'Все',
  'Веб-дизайн',
  'Мобильные приложения',
  'Бренд-дизайн',
  'Иллюстрация',
  'UI/UX',
  'Архитектура',
  'Интерьер',
]

export const ideas: Idea[] = [
  {
    id: 'creative-portal',
    title: 'Современный веб-портал для креативных студий',
    previewTitle: 'Портал для студий и digital-команд',
    description:
      'Концепт платформы для публикации кейсов, заявок клиентов и внутренних презентаций. Сделан с акцентом на чистую типографику и быстрый доступ к портфолио.',
    category: 'Веб-дизайн',
    tags: ['web', 'минимализм', 'портфолио'],
    author: 'Анна Волкова',
    role: 'Lead designer',
    likes: 342,
    comments: 89,
    isLikedByCurrentUser: false,
    stage: 'Готово к показу',
    coverLabel: 'creative direction',
    cover:
      'linear-gradient(135deg, rgba(33,42,62,0.85) 0%, rgba(73,91,123,0.7) 45%, rgba(217,233,255,0.32) 100%), radial-gradient(circle at 70% 30%, rgba(255,255,255,0.4), transparent 35%), linear-gradient(135deg, #1e293b 0%, #475569 55%, #cbd5e1 100%)',
  },
  {
    id: 'shared-notes',
    title: 'Мобильное приложение для совместных заметок',
    previewTitle: 'Notes flow для распределенных команд',
    description:
      'Мобильный сценарий для быстрых заметок, списков задач и синхронизации встреч. Интерфейс строится вокруг карточек, жестов и цветовых статусов.',
    category: 'Мобильные приложения',
    tags: ['mobile', 'productivity', 'ios'],
    author: 'Егор Миронов',
    role: 'Product designer',
    likes: 287,
    comments: 64,
    isLikedByCurrentUser: false,
    stage: 'Идет тест',
    coverLabel: 'mobile product',
    cover:
      'linear-gradient(140deg, rgba(111,76,255,0.92) 0%, rgba(59,130,246,0.78) 52%, rgba(224,242,254,0.55) 100%), radial-gradient(circle at 25% 25%, rgba(255,255,255,0.35), transparent 28%)',
  },
  {
    id: 'cafe-brand',
    title: 'Айдентика городской кофейни с теплой графикой',
    previewTitle: 'Бренд-система для локального кафе',
    description:
      'Набор носителей, упаковки и паттернов с мягкими формами, винтажной палитрой и выразительной типографикой для небольшого районного бренда.',
    category: 'Бренд-дизайн',
    tags: ['бренд', 'упаковка', 'типографика'],
    author: 'Мария Ермакова',
    role: 'Brand designer',
    likes: 418,
    comments: 97,
    isLikedByCurrentUser: false,
    stage: 'Подготовка к печати',
    coverLabel: 'brand identity',
    cover:
      'linear-gradient(145deg, rgba(122,63,31,0.9) 0%, rgba(225,137,73,0.78) 48%, rgba(255,238,214,0.62) 100%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.32), transparent 30%)',
  },
  {
    id: 'editorial-illustrations',
    title: 'Серия редакционных иллюстраций для edu-медиа',
    previewTitle: 'Иллюстрации о карьере и обучении',
    description:
      'Набор сцен для материалов о смене профессии, выгорании и росте навыков. В основе проекта крупные фигуры, мягкие тени и богатые текстуры.',
    category: 'Иллюстрация',
    tags: ['иллюстрация', 'editorial', 'education'],
    author: 'Полина Соколова',
    role: 'Illustrator',
    likes: 236,
    comments: 41,
    isLikedByCurrentUser: false,
    stage: 'Концепт',
    coverLabel: 'editorial art',
    cover:
      'linear-gradient(150deg, rgba(245,99,132,0.88) 0%, rgba(168,85,247,0.78) 48%, rgba(255,241,242,0.52) 100%), radial-gradient(circle at 15% 80%, rgba(255,255,255,0.28), transparent 34%)',
  },
  {
    id: 'real-estate-dashboard',
    title: 'Дашборд для управления жилыми комплексами',
    previewTitle: 'Аналитика и сервисы для девелопера',
    description:
      'Интерфейс сочетает KPI-блоки, интерактивные таблицы и быстрые действия для менеджеров. Особое внимание уделено навигации и контрасту данных.',
    category: 'UI/UX',
    tags: ['dashboard', 'analytics', 'saas'],
    author: 'Денис Горбунов',
    role: 'UX architect',
    likes: 301,
    comments: 52,
    isLikedByCurrentUser: false,
    stage: 'UX review',
    coverLabel: 'data driven ui',
    cover:
      'linear-gradient(140deg, rgba(15,23,42,0.92) 0%, rgba(14,116,144,0.78) 52%, rgba(186,230,253,0.5) 100%), radial-gradient(circle at 78% 18%, rgba(255,255,255,0.35), transparent 30%)',
  },
  {
    id: 'country-house',
    title: 'Концепция загородного дома с панорамным светом',
    previewTitle: 'Дом с открытым первым этажом',
    description:
      'Архитектурная идея с длинной горизонталью, природными материалами и световыми колодцами. Подходит для презентации инвестору и частному заказчику.',
    category: 'Архитектура',
    tags: ['архитектура', 'house', 'wood'],
    author: 'Ирина Лаврова',
    role: 'Architect',
    likes: 198,
    comments: 33,
    isLikedByCurrentUser: false,
    stage: 'Визуализация',
    coverLabel: 'architectural concept',
    cover:
      'linear-gradient(145deg, rgba(41,37,36,0.88) 0%, rgba(120,113,108,0.72) 48%, rgba(245,245,244,0.58) 100%), radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3), transparent 25%)',
  },
  {
    id: 'coworking-interior',
    title: 'Интерьер коворкинга с модульными рабочими зонами',
    previewTitle: 'Гибкий интерьер для команд и фрилансеров',
    description:
      'Проект пространства с островами для фокуса, переговорными и мягкими lounge-зонами. Акцент сделан на трансформацию мебели и теплый свет.',
    category: 'Интерьер',
    tags: ['интерьер', 'coworking', 'furniture'],
    author: 'София Мельник',
    role: 'Interior designer',
    likes: 259,
    comments: 48,
    isLikedByCurrentUser: false,
    stage: 'Смета',
    coverLabel: 'interior system',
    cover:
      'linear-gradient(145deg, rgba(12,74,110,0.88) 0%, rgba(20,184,166,0.74) 52%, rgba(236,253,245,0.54) 100%), radial-gradient(circle at 75% 22%, rgba(255,255,255,0.38), transparent 30%)',
  },
  {
    id: 'product-landing',
    title: 'Лендинг для SaaS-платформы о клиентском опыте',
    previewTitle: 'Презентация продукта через сценарии',
    description:
      'Веб-концепт с крупными кейсами, интерактивным storytelling-блоком и акцентами на метриках. Подходит для маркетинговой команды и презентаций продажи.',
    category: 'Веб-дизайн',
    tags: ['saas', 'landing', 'ux'],
    author: 'Никита Фролов',
    role: 'Design lead',
    likes: 321,
    comments: 58,
    isLikedByCurrentUser: false,
    stage: 'A/B гипотеза',
    coverLabel: 'growth website',
    cover:
      'linear-gradient(145deg, rgba(91,33,182,0.92) 0%, rgba(219,39,119,0.7) 48%, rgba(251,207,232,0.55) 100%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.38), transparent 28%)',
  },
]
