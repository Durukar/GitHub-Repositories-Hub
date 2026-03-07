import { Github, Lock, Globe, ExternalLink, ChevronLeft, ChevronRight, Copy, Check, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeProvider } from './components/theme/theme-provider'
import { ThemeToggle } from './components/theme/theme-toggle'
import { Button } from './components/ui/button'
import { Checkbox } from './components/ui/checkbox'
import { useGitHubRepos } from './hooks/useGitHubRepos'
import { useGitHubAuth } from './hooks/useGitHubAuth'
import './style.css'

export function App() {
  const { repository, loading, fetchGitRepos, updateGitRepos, clearRepos } = useGitHubRepos()
  const { status, token, userCode, verificationUri, error, login, logout } = useGitHubAuth()

  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set())
  const [typedTitle, setTypedTitle] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [copied, setCopied] = useState(false)
  const itemsPerPage = 25

  const isAuthenticated = status === 'authenticated'
  const isLoggingIn = status === 'requesting' || status === 'pending_user_action'

  const totalPages = repository ? Math.ceil(repository.length / itemsPerPage) : 0
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedRepos = repository?.slice(startIndex, startIndex + itemsPerPage)

  // Auto-fetch quando autenticado
  useEffect(() => {
    if (isAuthenticated && token && !repository) {
      fetchGitRepos(token)
    }
  }, [isAuthenticated, token])

  useEffect(() => {
    if (repository && repository.length > 0) {
      setTypedTitle('')
      const textToType = repository[0].owner?.login || ''
      let currentText = ''
      let i = 0
      const typingInterval = setInterval(() => {
        if (i < textToType.length) {
          currentText += textToType.charAt(i)
          setTypedTitle(currentText)
          i++
        } else {
          clearInterval(typingInterval)
        }
      }, 100)
      return () => clearInterval(typingInterval)
    } else {
      setTypedTitle('')
    }
  }, [repository])

  const handleClear = () => {
    setSelectedRepos(new Set())
    clearRepos()
    setTypedTitle('')
    setCurrentPage(1)
  }

  const handleLogout = () => {
    logout()
    handleClear()
  }


  const handleCopyCode = async () => {
    if (!userCode) return
    await navigator.clipboard.writeText(userCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const firstRepoOwnerAvatar = repository && repository.length > 0 ? repository[0].owner?.avatar_url : null

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedRepos)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRepos(newSelected)
  }

  const toggleAll = () => {
    if (!paginatedRepos || paginatedRepos.length === 0) return

    const allCurrentPageSelected = paginatedRepos.every((r) => selectedRepos.has(r.id))

    if (allCurrentPageSelected) {
      const newSelected = new Set(selectedRepos)
      paginatedRepos.forEach((r) => newSelected.delete(r.id))
      setSelectedRepos(newSelected)
    } else {
      const newSelected = new Set(selectedRepos)
      paginatedRepos.forEach((r) => newSelected.add(r.id))
      setSelectedRepos(newSelected)
    }
  }

  const handleBulkAction = async (makePrivate: boolean) => {
    if (!repository || !token) return
    const reposToUpdate = repository.filter((r) => selectedRepos.has(r.id))

    for (const repo of reposToUpdate) {
      if (repo.private !== makePrivate) {
        await updateGitRepos(repo.owner.login, repo.name, makePrivate, token)
      }
    }
    setSelectedRepos(new Set())
  }

  return (
    <ThemeProvider storageKey="gitHubRepositories" defaultTheme="dark">
      <div className="min-h-screen bg-background text-muted-foreground font-sans relative transition-colors duration-200 pb-4">

        <header className="sticky top-0 z-40 bg-background/60 backdrop-blur-md border-b border-border/40 pt-10 pb-6 px-10 mb-8">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between mb-8 relative">
              <h1 className="text-xl font-bold flex items-center gap-0 text-foreground drop-shadow-sm font-mono tracking-tight">
                GHH - GitHub Hub
                {typedTitle && (
                  <span className="text-foreground font-normal ml-2">{typedTitle}</span>
                )}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  className="inline-block w-2.5 h-5 bg-foreground align-middle ml-1"
                />
              </h1>
              <div className="flex items-center gap-4">
                <ThemeToggle />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              {/* Área de Perfil e Autenticação (Minimalista / Corporativo) */}
              <div className="flex justify-end items-center h-10">
                {isAuthenticated ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="flex items-center gap-3">
                      {firstRepoOwnerAvatar ? (
                        <div className="w-8 h-8 rounded-sm overflow-hidden border border-border shrink-0 shadow-sm">
                          <img src={firstRepoOwnerAvatar} alt="User Avatar" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-sm bg-muted border border-border flex items-center justify-center shrink-0 shadow-sm">
                          <Github className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="w-px h-5 bg-border" />

                    <Button
                      type="button"
                      onClick={handleLogout}
                      variant="ghost"
                      className="h-9 px-4 text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                    >
                      Logout
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Button
                      type="button"
                      onClick={login}
                      disabled={isLoggingIn}
                      variant="default"
                      className="h-10 px-5 text-sm font-medium shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 rounded-md disabled:opacity-70"
                    >
                      {isLoggingIn ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        >
                          <Github className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <Github className="w-4 h-4" />
                      )}
                      {isLoggingIn ? 'Conectando...' : 'Login com GitHub'}
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Painel de erro */}
        <AnimatePresence>
          {status === 'error' && error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="max-w-[1200px] mx-auto px-10 mb-6"
            >
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive flex-1">{error}</p>
                <button
                  type="button"
                  onClick={login}
                  className="text-xs text-destructive underline hover:no-underline shrink-0"
                >
                  Tentar novamente
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Painel Device Flow */}
        <AnimatePresence>
          {status === 'pending_user_action' && userCode && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="max-w-[1200px] mx-auto px-10 mb-6"
            >
              <div className="bg-card/80 backdrop-blur-md border border-border/60 rounded-xl p-6 flex items-center gap-6">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">
                    Acesse o GitHub e insira o codigo abaixo para autorizar:
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-mono text-2xl font-bold tracking-widest text-foreground bg-muted px-4 py-2 rounded-lg border border-border/60">
                      {userCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Copiar codigo"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-2 h-2 rounded-full bg-primary"
                    />
                    Aguardando autorizacao...
                  </div>
                  {verificationUri && (
                    <a
                      href={verificationUri}
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 px-4 rounded-md bg-primary/90 hover:bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                      <Github className="w-4 h-4" /> Abrir GitHub
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="max-w-[1200px] mx-auto px-10">
          <div className="w-full">

            <div
              className="grid gap-4 pb-3 mb-2 text-xs font-medium text-muted-foreground border-b border-border"
              style={{ gridTemplateColumns: '50px minmax(200px, 3.5fr) 100px 100px minmax(150px, 2fr) 150px' }}
            >
              <div className="pl-4">
                <Checkbox
                  checked={(paginatedRepos?.length ?? 0) > 0 && paginatedRepos?.every(r => selectedRepos.has(r.id))}
                  onCheckedChange={toggleAll}
                  disabled={!paginatedRepos?.length || loading}
                  className="rounded-[3px] border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary"
                />
              </div>
              <div>Repository</div>
              <div className="text-center">Visibility</div>
              <div className="text-center">Status</div>
              <div className="text-center min-w-0">URL</div>
              <div className="text-right pr-4">Repository ID</div>
            </div>

            <div className="flex flex-col min-h-[500px]">
              <AnimatePresence mode="wait">
                {(!paginatedRepos || paginatedRepos.length === 0) && !loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-20 text-center text-muted-foreground text-sm"
                  >
                    {isAuthenticated
                      ? 'Nenhum repositorio encontrado.'
                      : 'Faca login com o GitHub para visualizar seus repositorios.'}
                  </motion.div>
                )}

                {paginatedRepos?.map((repo, index) => {
                  const isSelected = selectedRepos.has(repo.id)
                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.99 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.2) }}
                      key={repo.id}
                      className={`grid gap-4 py-3 items-center rounded-md transition-all duration-200 text-sm border border-transparent hover:border-border/50 hover:-translate-y-[2px] hover:shadow-lg hover:shadow-black/5 ${isSelected ? 'bg-muted/80 shadow-md border-border/50' : 'hover:bg-muted/40'}`}
                      style={{ gridTemplateColumns: '50px minmax(200px, 3.5fr) 100px 100px minmax(150px, 2fr) 150px' }}
                    >
                      <div className="pl-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(repo.id)}
                          disabled={loading}
                          className="rounded-[3px] border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary"
                        />
                      </div>
                      <div className="flex items-center gap-3 font-medium text-foreground min-w-0 pr-4">
                        <Github className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{repo.name}</span>
                      </div>

                      <div className="flex justify-center">
                        {repo.private ? (
                          <span className="relative overflow-hidden inline-flex items-center px-2.5 py-0.5 rounded-sm text-[10px] uppercase font-bold bg-secondary text-secondary-foreground">
                            <span className="relative z-10">PRIVATE</span>
                            <span className="animate-wave absolute inset-0 pointer-events-none" />
                          </span>
                        ) : (
                          <span className="relative overflow-hidden inline-flex items-center px-2.5 py-0.5 rounded-sm text-[10px] uppercase font-bold bg-primary text-primary-foreground">
                            <span className="relative z-10">PUBLIC</span>
                            <span className="animate-wave absolute inset-0 pointer-events-none" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <span className="w-5 h-5 rounded-sm flex items-center justify-center bg-muted border border-border text-[9px] font-bold text-foreground">A</span>
                        Active
                      </div>

                      <div className="flex justify-center min-w-0">
                        <a
                          href={repo.html_url || repo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group truncate"
                        >
                          <span className="truncate">View Repo</span>
                          <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                        </a>
                      </div>

                      <div className="font-mono text-xs text-muted-foreground text-right pr-4">
                        {repo.id}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between py-4 mt-2 border-t border-border/40">
                <div className="text-sm text-muted-foreground">
                  Showing{' '}
                  <span className="font-medium text-foreground">{startIndex + 1}</span> to{' '}
                  <span className="font-medium text-foreground">
                    {Math.min(startIndex + itemsPerPage, repository?.length || 0)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium text-foreground">{repository?.length}</span>{' '}
                  repositories
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                    className="h-8 px-3 text-xs bg-card border-border hover:bg-muted"
                  >
                    <ChevronLeft className="w-3 h-3 mr-1" /> Previous
                  </Button>
                  <div className="flex items-center justify-center min-w-[32px] h-8 text-xs font-medium rounded-md bg-muted/50 border border-border/50 text-foreground">
                    {currentPage} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || loading}
                    className="h-8 px-3 text-xs bg-card border-border hover:bg-muted"
                  >
                    Next <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Painel de acoes em massa */}
        <AnimatePresence>
          {selectedRepos.size > 0 && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
            >
              <div className="bg-card/70 backdrop-blur-md border border-border/60 shadow-2xl shadow-black/20 rounded-lg flex items-center gap-2 min-w-[360px] p-2">
                <div className="flex items-center gap-3 px-3 text-muted-foreground text-sm font-medium">
                  <div className="bg-muted text-foreground w-6 h-6 rounded-sm flex items-center justify-center text-xs border border-border/50 shadow-sm">
                    {selectedRepos.size}
                  </div>
                  selected
                </div>

                <div className="flex gap-1 flex-1 px-2 border-l border-border">
                  <Button
                    onClick={() => handleBulkAction(false)}
                    disabled={loading || !repository?.some(r => selectedRepos.has(r.id) && r.private)}
                    variant="ghost"
                    className="flex-1 h-8 bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors disabled:opacity-30 rounded-[4px] font-medium"
                  >
                    <Globe className="w-3.5 h-3.5 mr-2" /> Make Public
                  </Button>
                  <Button
                    onClick={() => handleBulkAction(true)}
                    disabled={loading || !repository?.some(r => selectedRepos.has(r.id) && !r.private)}
                    variant="ghost"
                    className="flex-1 h-8 bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground text-xs transition-colors disabled:opacity-30 rounded-[4px] font-medium"
                  >
                    <Lock className="w-3.5 h-3.5 mr-2" /> Make Private
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ThemeProvider>
  )
}

export default App
