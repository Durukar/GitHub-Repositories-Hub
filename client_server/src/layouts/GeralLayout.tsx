import { Outlet } from 'react-router'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'

export function GeralLayout() {
	return (
		<ThemeProvider storageKey='gitHubRepositories' defaultTheme='dark'>
			<div className='p-6 max-w-5xl mx-auto space-y-2'>
				<div className='ml-auto flex items-center gap-2'>
					<h1 className='text-3xl font-bold mr-auto'>GitHub Respositories HUB</h1>
					<ThemeToggle />
				</div>
				<Outlet />
			</div>
		</ThemeProvider>
	)
}
