import { apiClient } from '../../../shared/api/httpClient'
import { ideas as mockIdeas } from '../model/mockIdeas'
import { type Idea } from '../model/types'

export const ideasApi = {
  getIdeas: (): Promise<Idea[]> => {
    if (!apiClient.isConfigured) {
      return Promise.resolve(mockIdeas)
    }

    return apiClient.get<Idea[]>('/ideas')
  },
}
