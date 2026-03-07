import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { useGitHubRepos, type GitRepo } from './useGitHubRepos'

const mock = new MockAdapter(axios)

const makeRepo = (overrides: Partial<GitRepo> = {}): GitRepo => ({
  id: 1,
  name: 'my-repo',
  url: 'https://api.github.com/repos/user/my-repo',
  html_url: 'https://github.com/user/my-repo',
  private: false,
  owner: { login: 'user', avatar_url: 'https://avatars.githubusercontent.com/u/1' },
  ...overrides,
})

describe('useGitHubRepos', () => {
  beforeEach(() => {
    mock.reset()
  })

  afterEach(() => {
    mock.reset()
  })

  // ── estado inicial ──────────────────────────────────────────────────────────

  it('começa com repository undefined e loading false', () => {
    const { result } = renderHook(() => useGitHubRepos())
    expect(result.current.repository).toBeUndefined()
    expect(result.current.loading).toBe(false)
  })

  // ── clearRepos ──────────────────────────────────────────────────────────────

  describe('clearRepos', () => {
    it('define repository como undefined', async () => {
      mock.onGet('https://api.github.com/user/repos').reply(200, [makeRepo()])

      const { result } = renderHook(() => useGitHubRepos())

      await act(async () => {
        await result.current.fetchGitRepos('token-123')
      })

      expect(result.current.repository).toHaveLength(1)

      act(() => {
        result.current.clearRepos()
      })

      expect(result.current.repository).toBeUndefined()
    })

    it('não altera loading ao limpar', () => {
      const { result } = renderHook(() => useGitHubRepos())

      act(() => {
        result.current.clearRepos()
      })

      expect(result.current.loading).toBe(false)
    })
  })

  // ── fetchGitRepos ───────────────────────────────────────────────────────────

  describe('fetchGitRepos', () => {
    it('define loading=true durante a requisição', async () => {
      let resolveRequest!: (value: any) => void
      mock.onGet('https://api.github.com/user/repos').reply(
        () => new Promise((resolve) => { resolveRequest = resolve }),
      )

      const { result } = renderHook(() => useGitHubRepos())

      act(() => {
        result.current.fetchGitRepos('token-123')
      })

      await waitFor(() => expect(result.current.loading).toBe(true))

      act(() => resolveRequest([200, []]))

      await waitFor(() => expect(result.current.loading).toBe(false))
    })

    it('preenche repository com os dados retornados pela API', async () => {
      const repos = [makeRepo({ id: 1 }), makeRepo({ id: 2, name: 'other-repo' })]
      mock.onGet('https://api.github.com/user/repos').reply(200, repos)

      const { result } = renderHook(() => useGitHubRepos())

      await act(async () => {
        await result.current.fetchGitRepos('token-123')
      })

      expect(result.current.repository).toHaveLength(2)
      expect(result.current.repository![0].name).toBe('my-repo')
      expect(result.current.repository![1].name).toBe('other-repo')
    })

    it('envia o token no header Authorization', async () => {
      mock.onGet('https://api.github.com/user/repos').reply((config) => {
        expect(config.headers?.Authorization).toBe('token meu-token')
        return [200, []]
      })

      const { result } = renderHook(() => useGitHubRepos())

      await act(async () => {
        await result.current.fetchGitRepos('meu-token')
      })
    })

    it('envia params visibility=all e per_page=100', async () => {
      mock.onGet('https://api.github.com/user/repos').reply((config) => {
        expect(config.params).toMatchObject({ visibility: 'all', per_page: 100 })
        return [200, []]
      })

      const { result } = renderHook(() => useGitHubRepos())

      await act(async () => {
        await result.current.fetchGitRepos('token-123')
      })
    })

    it('define loading=false após erro e mantém repository como []', async () => {
      mock.onGet('https://api.github.com/user/repos').reply(401)

      const { result } = renderHook(() => useGitHubRepos())

      await act(async () => {
        await result.current.fetchGitRepos('token-invalido')
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.repository).toEqual([])
    })

    it('limpa repository anterior ao buscar novamente', async () => {
      mock.onGet('https://api.github.com/user/repos').replyOnce(200, [makeRepo()])

      const { result } = renderHook(() => useGitHubRepos())

      await act(async () => {
        await result.current.fetchGitRepos('token-123')
      })

      expect(result.current.repository).toHaveLength(1)

      mock.onGet('https://api.github.com/user/repos').replyOnce(200, [])

      await act(async () => {
        await result.current.fetchGitRepos('token-123')
      })

      expect(result.current.repository).toHaveLength(0)
    })
  })

  // ── updateGitRepos ──────────────────────────────────────────────────────────

  describe('updateGitRepos', () => {
    it('não faz requisição se repository for undefined', async () => {
      mock.onPatch(/repos/).reply(200, {})

      const { result } = renderHook(() => useGitHubRepos())

      await act(async () => {
        await result.current.updateGitRepos('user', 'my-repo', true, 'token-123')
      })

      expect(mock.history.patch).toHaveLength(0)
    })

    it('atualiza o repositório correto no estado local', async () => {
      const repo1 = makeRepo({ id: 1, private: false })
      const repo2 = makeRepo({ id: 2, name: 'other', private: false })

      mock.onGet('https://api.github.com/user/repos').reply(200, [repo1, repo2])
      mock
        .onPatch('https://api.github.com/repos/user/my-repo')
        .reply(200, { ...repo1, private: true })

      const { result } = renderHook(() => useGitHubRepos())

      await act(async () => {
        await result.current.fetchGitRepos('token-123')
      })

      await act(async () => {
        await result.current.updateGitRepos('user', 'my-repo', true, 'token-123')
      })

      expect(result.current.repository![0].private).toBe(true)
      expect(result.current.repository![1].private).toBe(false)
    })

    it('envia o token no header e o status no body', async () => {
      const repo = makeRepo({ id: 1, private: false })

      mock.onGet('https://api.github.com/user/repos').reply(200, [repo])
      mock.onPatch('https://api.github.com/repos/user/my-repo').reply((config) => {
        expect(config.headers?.Authorization).toBe('token meu-token')
        expect(JSON.parse(config.data)).toEqual({ private: true })
        return [200, { ...repo, private: true }]
      })

      const { result } = renderHook(() => useGitHubRepos())

      await act(async () => {
        await result.current.fetchGitRepos('meu-token')
      })

      await act(async () => {
        await result.current.updateGitRepos('user', 'my-repo', true, 'meu-token')
      })
    })

    it('define loading=false após erro na atualização', async () => {
      const repo = makeRepo({ id: 1, private: false })

      mock.onGet('https://api.github.com/user/repos').reply(200, [repo])
      mock.onPatch('https://api.github.com/repos/user/my-repo').reply(422)

      const { result } = renderHook(() => useGitHubRepos())

      await act(async () => {
        await result.current.fetchGitRepos('token-123')
      })

      await act(async () => {
        await result.current.updateGitRepos('user', 'my-repo', true, 'token-123')
      })

      expect(result.current.loading).toBe(false)
    })
  })
})
