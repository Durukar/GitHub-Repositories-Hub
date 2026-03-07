import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import type { GitRepo } from './hooks/useGitHubRepos'
import type { UseGitHubAuthReturn } from './hooks/useGitHubAuth'

const mock = new MockAdapter(axios)

// Factory assíncrono garante que React está disponível mesmo após o hoisting do vi.mock.
// O cache de componentes garante referências estáveis entre renders — sem isso o Proxy
// retornaria uma nova função a cada acesso, forçando React a desmontar/remontar o elemento.
vi.mock('framer-motion', async () => {
  const React = await import('react')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cache: Record<string, React.ComponentType<any>> = {}

  return {
    motion: new Proxy(
      {},
      {
        get: (_target, tag: string) => {
          if (!cache[tag]) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cache[tag] = ({ children, ...props }: any) =>
              React.createElement(tag as any, props, children)
          }
          return cache[tag]
        },
      },
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  }
})

// Mock do useGitHubAuth — controlado por cada teste
const mockAuthReturn: UseGitHubAuthReturn = {
  status: 'authenticated',
  token: 'test-token',
  userCode: null,
  verificationUri: null,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
}

vi.mock('./hooks/useGitHubAuth', () => ({
  useGitHubAuth: () => mockAuthReturn,
}))

const makeRepo = (overrides: Partial<GitRepo> = {}): GitRepo => ({
  id: 1,
  name: 'my-repo',
  url: 'https://api.github.com/repos/user/my-repo',
  html_url: 'https://github.com/user/my-repo',
  private: false,
  owner: { login: 'user', avatar_url: 'https://avatars.githubusercontent.com/u/1' },
  ...overrides,
})

// Importar App depois dos vi.mock para garantir ordem correta
const { App } = await import('./App')

beforeEach(() => {
  mock.reset()
  localStorage.clear()
  // Resetar para estado autenticado por padrão nos testes de repositório
  mockAuthReturn.status = 'authenticated'
  mockAuthReturn.token = 'test-token'
  mockAuthReturn.userCode = null
  mockAuthReturn.verificationUri = null
  mockAuthReturn.error = null
  vi.mocked(mockAuthReturn.login).mockReset()
  vi.mocked(mockAuthReturn.logout).mockReset()
})

// ── tela de login (idle) ─────────────────────────────────────────────────────

describe('tela de login', () => {
  it('exibe botão "Login com GitHub" quando status é idle', () => {
    mockAuthReturn.status = 'idle'
    mockAuthReturn.token = null

    render(<App />)
    expect(screen.getByRole('button', { name: /login com github/i })).toBeInTheDocument()
  })

  it('chama login() ao clicar em "Login com GitHub"', async () => {
    const user = userEvent.setup()
    mockAuthReturn.status = 'idle'
    mockAuthReturn.token = null

    render(<App />)
    await user.click(screen.getByRole('button', { name: /login com github/i }))
    expect(mockAuthReturn.login).toHaveBeenCalledOnce()
  })

  it('exibe texto "Conectando..." durante o processo de login', () => {
    // Qualquer status diferente de idle, authenticated e error ativa isLoggingIn
    mockAuthReturn.status = 'pending_user_action'
    mockAuthReturn.token = null

    render(<App />)
    expect(screen.getByRole('button', { name: /conectando\.\.\./i })).toBeInTheDocument()
  })

  it('exibe botão "Logout" quando autenticado', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })

  it('chama logout() ao clicar em "Logout"', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /logout/i }))
    expect(mockAuthReturn.logout).toHaveBeenCalledOnce()
  })

  it('exibe o avatar do usuário quando autenticado e possui repositórios', async () => {
    mock.onGet('https://api.github.com/user/repos').reply(200, [
      makeRepo({ owner: { login: 'octocat', avatar_url: 'https://avatars.githubusercontent.com/u/583231' } })
    ])

    render(<App />)

    await waitFor(() => {
      const avatar = screen.getByAltText('User Avatar')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', 'https://avatars.githubusercontent.com/u/583231')
    })
  })
})

// ── painel de erro ───────────────────────────────────────────────────────────

describe('painel de erro', () => {
  it('exibe a mensagem de erro quando status é error', () => {
    mockAuthReturn.status = 'error'
    mockAuthReturn.token = null
    mockAuthReturn.error = 'access_denied'

    render(<App />)
    expect(screen.getByText('access_denied')).toBeInTheDocument()
  })

  it('chama login() ao clicar em "Tentar novamente"', async () => {
    const user = userEvent.setup()
    mockAuthReturn.status = 'error'
    mockAuthReturn.token = null
    mockAuthReturn.error = 'expired_token'

    render(<App />)
    await user.click(screen.getByRole('button', { name: /tentar novamente/i }))
    expect(mockAuthReturn.login).toHaveBeenCalledOnce()
  })
})

// ── painel de device flow (pending_user_action) ──────────────────────────────

describe('painel de Device Flow', () => {
  it('exibe o user_code quando status é pending_user_action', () => {
    mockAuthReturn.status = 'pending_user_action'
    mockAuthReturn.token = null
    mockAuthReturn.userCode = 'ABCD-1234'
    mockAuthReturn.verificationUri = 'https://github.com/login/device'

    render(<App />)
    expect(screen.getByText('ABCD-1234')).toBeInTheDocument()
  })

  it('exibe link para o GitHub quando status é pending_user_action', () => {
    mockAuthReturn.status = 'pending_user_action'
    mockAuthReturn.token = null
    mockAuthReturn.userCode = 'ABCD-1234'
    mockAuthReturn.verificationUri = 'https://github.com/login/device'

    render(<App />)
    const link = screen.getByRole('link', { name: /github/i })
    expect(link).toHaveAttribute('href', 'https://github.com/login/device')
  })
})

// ── auto-fetch de repositórios ───────────────────────────────────────────────

describe('auto-fetch de repositórios ao autenticar', () => {
  it('busca repositórios automaticamente ao montar com status authenticated', async () => {
    mock.onGet('https://api.github.com/user/repos').reply(200, [makeRepo()])

    render(<App />)

    await waitFor(() => expect(mock.history.get).toHaveLength(1))
    expect(mock.history.get[0].headers?.Authorization).toBe('token test-token')
  })

  it('não busca repositórios quando status é idle', async () => {
    mockAuthReturn.status = 'idle'
    mockAuthReturn.token = null

    render(<App />)

    await waitFor(() => expect(mock.history.get).toHaveLength(0))
  })
})

// ── toggleSelection ──────────────────────────────────────────────────────────

describe('toggleSelection', () => {
  it('seleciona um repositório ao clicar no checkbox do item', async () => {
    const user = userEvent.setup()
    mock.onGet('https://api.github.com/user/repos').reply(200, [makeRepo()])

    render(<App />)
    await waitFor(() => screen.getByText('my-repo'))

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1])

    await waitFor(() =>
      expect(screen.getByText('selected', { exact: false })).toBeInTheDocument(),
    )
  })

  it('deseleciona ao clicar novamente no mesmo repositório', async () => {
    const user = userEvent.setup()
    mock.onGet('https://api.github.com/user/repos').reply(200, [makeRepo()])

    render(<App />)
    await waitFor(() => screen.getByText('my-repo'))

    const itemCheckbox = screen.getAllByRole('checkbox')[1]
    expect(itemCheckbox).toHaveAttribute('aria-checked', 'false')

    await user.click(itemCheckbox)
    await waitFor(() => expect(itemCheckbox).toHaveAttribute('aria-checked', 'true'))

    await user.click(itemCheckbox)
    await waitFor(() => expect(itemCheckbox).toHaveAttribute('aria-checked', 'false'))
  })
})

// ── toggleAll ────────────────────────────────────────────────────────────────

describe('toggleAll', () => {
  it('seleciona todos os repositórios da página ao clicar no checkbox do header', async () => {
    const user = userEvent.setup()
    const repos = [
      makeRepo({ id: 1, name: 'repo-1' }),
      makeRepo({ id: 2, name: 'repo-2' }),
    ]
    mock.onGet('https://api.github.com/user/repos').reply(200, repos)

    render(<App />)
    await waitFor(() => screen.getByText('repo-1'))

    const headerCheckbox = screen.getAllByRole('checkbox')[0]
    await user.click(headerCheckbox)

    await waitFor(() =>
      expect(screen.getByText('selected', { exact: false })).toBeInTheDocument(),
    )
  })

  it('deseleciona todos ao clicar novamente quando todos estão selecionados', async () => {
    const user = userEvent.setup()
    const repos = [
      makeRepo({ id: 1, name: 'repo-1' }),
      makeRepo({ id: 2, name: 'repo-2' }),
    ]
    mock.onGet('https://api.github.com/user/repos').reply(200, repos)

    render(<App />)
    await waitFor(() => screen.getByText('repo-1'))

    const headerCheckbox = screen.getAllByRole('checkbox')[0]
    await user.click(headerCheckbox)
    await waitFor(() =>
      expect(screen.getByText('selected', { exact: false })).toBeInTheDocument(),
    )

    await user.click(headerCheckbox)
    await waitFor(() => expect(screen.queryByText('selected')).toBeNull())
  })

  it('checkbox do header fica desabilitado quando não há repositórios', async () => {
    mockAuthReturn.status = 'idle'
    mockAuthReturn.token = null

    render(<App />)
    const headerCheckbox = screen.getAllByRole('checkbox')[0]
    expect(headerCheckbox).toBeDisabled()
  })
})

// ── handleBulkAction ─────────────────────────────────────────────────────────

describe('handleBulkAction', () => {
  it('faz PATCH apenas nos repositórios públicos ao clicar em Make Private', async () => {
    const user = userEvent.setup()
    const repos = [
      makeRepo({ id: 1, name: 'repo-pub', private: false }),
      makeRepo({ id: 2, name: 'repo-priv', private: true }),
    ]
    mock.onGet('https://api.github.com/user/repos').reply(200, repos)
    mock
      .onPatch('https://api.github.com/repos/user/repo-pub')
      .reply(200, { ...repos[0], private: true })

    render(<App />)
    await waitFor(() => screen.getByText('repo-pub'))

    await user.click(screen.getAllByRole('checkbox')[0])
    await waitFor(() => screen.getByText('selected', { exact: false }))

    await user.click(screen.getByRole('button', { name: /make private/i }))

    await waitFor(() => expect(mock.history.patch).toHaveLength(1))
    expect(mock.history.patch[0].url).toContain('repo-pub')
  })

  it('faz PATCH apenas nos repositórios privados ao clicar em Make Public', async () => {
    const user = userEvent.setup()
    const repos = [
      makeRepo({ id: 1, name: 'repo-pub', private: false }),
      makeRepo({ id: 2, name: 'repo-priv', private: true }),
    ]
    mock.onGet('https://api.github.com/user/repos').reply(200, repos)
    mock
      .onPatch('https://api.github.com/repos/user/repo-priv')
      .reply(200, { ...repos[1], private: false })

    render(<App />)
    await waitFor(() => screen.getByText('repo-priv'))

    await user.click(screen.getAllByRole('checkbox')[0])
    await waitFor(() => screen.getByText('selected', { exact: false }))

    await user.click(screen.getByRole('button', { name: /make public/i }))

    await waitFor(() => expect(mock.history.patch).toHaveLength(1))
    expect(mock.history.patch[0].url).toContain('repo-priv')
  })

  it('limpa a seleção após executar a ação bulk', async () => {
    const user = userEvent.setup()
    const repos = [makeRepo({ id: 1, name: 'repo-pub', private: false })]
    mock.onGet('https://api.github.com/user/repos').reply(200, repos)
    mock
      .onPatch('https://api.github.com/repos/user/repo-pub')
      .reply(200, { ...repos[0], private: true })

    render(<App />)
    await waitFor(() => screen.getByText('repo-pub'))

    await user.click(screen.getAllByRole('checkbox')[0])
    await waitFor(() => screen.getByText('selected', { exact: false }))

    await user.click(screen.getByRole('button', { name: /make private/i }))

    await waitFor(() => expect(screen.queryByText('selected')).toBeNull())
  })
})
