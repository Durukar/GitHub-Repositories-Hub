import { useState } from 'react'
import axios from 'axios'

export interface GitRepo {
  id: number
  name: string
  url: string
  html_url: string
  private: boolean
  owner: {
    login: string;
    avatar_url: string
  }
}

export function useGitHubRepos() {
  const [repository, setRepositorys] = useState<GitRepo[]>()
  const [loading, setLoading] = useState(false)

  const clearRepos = () => {
    setRepositorys(undefined)
  }

  const fetchGitRepos = async (token: string) => {
    try {
      setLoading(true)
      setRepositorys([])
      const response = await axios.get<GitRepo[]>(
        'https://api.github.com/user/repos',
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
          params: {
            visibility: 'all',
            per_page: 100,
          },
        },
      )
      setRepositorys(response.data)
    } catch (error) {
      console.error('Error: ', error)
    } finally {
      setLoading(false)
    }
  }

  const updateGitRepos = async (
    ownerName: string,
    projectName: string,
    status: boolean,
    token: string,
  ) => {
    try {
      if (!repository) {
        return
      }

      setLoading(true)
      const response = await axios.patch<GitRepo>(
        `https://api.github.com/repos/${ownerName}/${projectName}`,
        {
          private: status,
        },
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      )

      setRepositorys((prev) => {
        const idx = prev?.findIndex((repo) => repo.id === response.data.id)
        if (idx !== undefined && idx >= 0) {
          prev?.splice(idx, 1, response.data)
        }

        return [...(prev || [])]
      })
    } catch (error) {
      console.error('Error update Repositories: ', error)
    } finally {
      setLoading(false)
    }
  }

  return { repository, loading, fetchGitRepos, updateGitRepos, clearRepos }
}
