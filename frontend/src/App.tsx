import axios from 'axios'
import { PersonStanding, Search } from 'lucide-react'
import React, { useState } from 'react'

import { ThemeProvider } from './components/theme/theme-provider'
import { ThemeToggle } from './components/theme/theme-toggle'
import { Button } from './components/ui/button'
import { Checkbox } from './components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog'
import { Input } from './components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './components/ui/table'

interface GitRepo {
  id: number
  name: string
  url: string
  private: boolean
}

export function App() {
  const [repository, setRepositorys] = useState<GitRepo[]>()
  const [token, setToken] = useState<string>('')
  const [user, setUser] = useState<string>('')
  const [checkBoxSelected, setCheckBoxSelected] = useState<{
    [key: number]: boolean
  }>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleTokenGitHub = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value)
  }

  const handleUserGitHub = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser(e.target.value)
  }

  const handleStatusChange = (id: number) => {
    setCheckBoxSelected((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }))
  }

  const handleChangeStatus = async (
    user: string,
    name: string,
    status: boolean,
  ) => {
    await updateGitRepos(user, name, status)
  }

  const fetchGitRepos = async () => {
    try {
      setLoading(true)
      setRepositorys([])
      setCheckBoxSelected({})
      const response = await axios.get<GitRepo[]>(
        'https://api.github.com/user/repos',
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
          params: {
            visibility: 'all',
            per_page: 25,
          },
        },
      )
      setRepositorys(response.data)
    } catch (error) {
      console.error('Error: ', error)
    }
    setLoading(false)
  }

  const updateGitRepos = async (
    name: string,
    projectName: string,
    status: boolean,
  ) => {
    try {
      if (!repository) {
        return
      }

      setLoading(true)
      const response = await axios.patch<GitRepo>(
        `https://api.github.com/repos/${name}/${projectName}`,
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

      setCheckBoxSelected({})
      setRepositorys((prev) => {
        const idx = prev?.findIndex((repo) => repo.id === response.data.id)
        if (idx !== undefined && idx >= 0) {
          prev?.splice(idx, 1, response.data)
        }

        return [...(prev || [])]
      })
    } catch (error) {
      console.error('Error update Repositories: ', error)
    }

    setLoading(false)
  }

  // Descomentar caso queira realizar testes de fetch na api do GitHub
  // useEffect(() => {
  //   if (token && user) {
  //     const timer = setInterval(fetchGitRepos, 3000)

  //     return () => {
  //       clearInterval(timer)
  //     }
  //   }
  // })

  return (
    <ThemeProvider storageKey="gitHubRepositories" defaultTheme="dark">
      <div className="p-6 max-w-5xl mx-auto space-y-2">
        <div className="ml-auto flex items-center gap-2">
          <h1 className="text-3xl font-bold mr-auto">
            GitHub Repositories HUB
          </h1>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between">
          <form className="flex items-center gap-2" onSubmit={handleSubmit}>
            <Input
              name="user"
              placeholder="Usuario GitHub"
              className="w-auto"
              value={user}
              onChange={handleUserGitHub}
            />
            <Input
              name="token"
              placeholder="Token do github"
              className="w-auto"
              value={token}
              onChange={handleTokenGitHub}
            />

            <Button type="submit" onClick={fetchGitRepos} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              Localizar repositorios
            </Button>
          </form>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="link">
                <PersonStanding className="w-4 h-4 mr-2" />
                Dev
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Infos do criador</DialogTitle>
              <DialogDescription>Lucas D</DialogDescription>
            </DialogContent>
          </Dialog>
        </div>
        <div className="border rounded-lg p-2 h-full">
          <Table>
            <TableHeader>
              <TableHead>Repo ID</TableHead>
              <TableHead>Repo Name</TableHead>
              <TableHead>Repo URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="m">Mudar Status</TableHead>
            </TableHeader>
            <TableBody>
              {repository?.map((c, i) => {
                return (
                  <TableRow key={i}>
                    <TableCell>{c.id}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.url}</TableCell>
                    <TableCell>{c.private ? 'Privado' : 'Publico'}</TableCell>
                    <TableCell
                      className="flex gap-5 justify-between items-center"
                      key={i}
                    >
                      <Checkbox
                        disabled={loading}
                        onClick={() => handleStatusChange(c.id)}
                        checked={checkBoxSelected[c.id] || false}
                      />
                      <Button
                        disabled={!checkBoxSelected[c.id] || loading}
                        onClick={() =>
                          handleChangeStatus(user, c.name, !c.private)
                        }
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                      >
                        Aplicar
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
