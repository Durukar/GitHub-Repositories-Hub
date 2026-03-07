import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ThemeProvider, useTheme } from './theme-provider'

// Componente auxiliar para expor o hook
function ThemeConsumer() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme('dark')}>dark</button>
      <button onClick={() => setTheme('light')}>light</button>
      <button onClick={() => setTheme('system')}>system</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    vi.restoreAllMocks()
  })

  it('usa o defaultTheme quando não há valor salvo no localStorage', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeConsumer />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  it('usa o tema salvo no localStorage quando disponível', () => {
    localStorage.setItem('vite-ui-theme', 'dark')

    render(
      <ThemeProvider defaultTheme="light">
        <ThemeConsumer />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  it('usa a storageKey customizada para ler o localStorage', () => {
    localStorage.setItem('my-app-theme', 'dark')

    render(
      <ThemeProvider storageKey="my-app-theme" defaultTheme="light">
        <ThemeConsumer />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  it('adiciona a classe "dark" no documentElement ao setar tema dark', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider defaultTheme="light">
        <ThemeConsumer />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'dark' }))

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('adiciona a classe "light" no documentElement ao setar tema light', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeConsumer />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'light' }))

    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('persiste o tema escolhido no localStorage', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider defaultTheme="light">
        <ThemeConsumer />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'dark' }))

    expect(localStorage.getItem('vite-ui-theme')).toBe('dark')
  })

  it('aplica a classe "dark" quando tema system e sistema prefere dark', async () => {
    const user = userEvent.setup()

    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    render(
      <ThemeProvider defaultTheme="light">
        <ThemeConsumer />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'system' }))

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('aplica a classe "light" quando tema system e sistema prefere light', async () => {
    const user = userEvent.setup()

    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: false, // sistema prefere light
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeConsumer />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'system' }))

    expect(document.documentElement.classList.contains('light')).toBe(true)
  })
})

describe('useTheme', () => {
  it('retorna o tema e setTheme quando dentro do ThemeProvider', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeConsumer />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  it('retorna o estado inicial (system) quando usado fora do ThemeProvider', () => {
    // createContext é inicializado com initialState (theme: 'system'), não lança erro
    render(<ThemeConsumer />)
    expect(screen.getByTestId('theme').textContent).toBe('system')
  })

  it('retorna theme e setTheme como funções/valores válidos', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeConsumer />
      </ThemeProvider>,
    )

    const themeEl = screen.getByTestId('theme')
    expect(['dark', 'light', 'system']).toContain(themeEl.textContent)
    expect(screen.getByRole('button', { name: 'dark' })).toBeInTheDocument()
  })
})
