import { BrowserRouter, Route, Routes } from 'react-router'
import { ListReposPage } from '@/pages/List-Repos-Page'
import { GeralLayout } from '../layouts/GeralLayout'

const RouterApp = () => {
	return (
		<BrowserRouter>
			<Routes>
				<Route path='/'>
					<Route element={<GeralLayout />}>
						<Route index element={<ListReposPage />} />
					</Route>
				</Route>
			</Routes>
		</BrowserRouter>
	)
}

export { RouterApp }
