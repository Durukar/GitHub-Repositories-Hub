import { create } from 'zustand'

const useAuthStore = create(set => ({
	user: null,
	token: null,
	isLoading: false,
	isAuthenticated: false,

	login: async (user: string, pass: string) => {
		set({ isLoading: true })

		try {
			await new Promise(resolve => setTimeout(resolve, 1000))

			if (user === 'example' && pass === '123456') {
				const mockUserData = {
					name: 'Example',
					email: 'example@mail.com'
				}

				const mockToken = 'jwt-example-token'

				set({
					user: mockUserData,
					token: mockToken,
					isAuthenticated: true,
					isLoading: false
				})

				return { success: true }
			} else {
				throw new Error('Invalid credentials')
			}
		} catch (e) {
			set({ isLoading: false, error: 'erro' })
			return { success: false, error: 'retorno de erro' }
		}
	}
}))

export { useAuthStore }
