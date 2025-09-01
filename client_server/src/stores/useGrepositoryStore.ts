import { create } from 'zustand'

interface GitRepo {
	id: number
	name: string
	url: string
	private: boolean
}

type GrState = {
	gRepo: GitRepo
}

type Action = {
	updateGrepo: (newGrepo: GitRepo) => void
}

const useGrStore = create<GrState & Action>(set => ({
	gRepo: {
		id: 0,
		name: '',
		url: '',
		private: false
	},
	updateGrepo: newGRepo =>
		set(() => ({
			gRepo: newGRepo
		}))
}))
