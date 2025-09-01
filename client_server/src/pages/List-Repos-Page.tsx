import { type AnyFieldApi, useForm } from '@tanstack/react-form'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Toaster, toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface GitRepo {
	id: number
	name: string
	url: string
	private: boolean
}

function ListReposPage() {
	const [repository, setRespositorys] = useState<GitRepo[]>([])
	const form = useForm({
		defaultValues: {
			userG: '',
			tokenG: ''
		},
		onSubmit: async ({ value }) => {
			await new Promise(resolve => setTimeout(resolve, 1000))
			console.log(`Dados do formulario: `, value)
		}
	})
	return (
		<div className='flex items-center justify-between'>
			<form
				onSubmit={e => {
					e.preventDefault()
					e.stopPropagation()
					form.handleSubmit()
				}}
				className='flex items-center gap-2'
			>
				<form.Field
					name='userG'
					validators={{
						onChange: ({ value }) =>
							!value
								? 'Usuario github é obrigatorio'
								: value.length < 3
									? 'Usuario do github de possuir pelo menos 3 caracteres'
									: undefined,
						onChangeAsyncDebounceMs: 500,
						onChangeAsync: async ({ value }) => {
							await new Promise(resolve => setTimeout(resolve, 1000))
							return value.includes('error') && 'O nick "error" nao é permitido'
						}
					}}
					// biome-ignore lint/correctness/noChildrenProp: <explanation>
					children={field => {
						return (
							<>
								{/* <label htmlFor={field.name}>Usuario github:</label> */}
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={e => field.handleChange(e.target.value)}
									className='w-auto'
									placeholder='Usuario GitHub'
								/>
								<FieldToaster field={field} />
							</>
						)
					}}
				/>

				<form.Field
					name='tokenG'
					validators={{
						onChange: ({ value }) =>
							!value ? 'Token é obrigatorio' : value.length < 3 ? 'O Token deve conter mais de 3 caractees' : undefined,
						onChangeAsyncDebounceMs: 500,
						onChangeAsync: async ({ value }) => {
							await new Promise(resolve => setTimeout(resolve, 1000))
							return value.includes('error') && 'Nenhum error'
						}
					}}
					// biome-ignore lint/correctness/noChildrenProp: <explanation>
					children={field => {
						return (
							<>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={e => field.handleChange(e.target.value)}
									className='w-auto'
									placeholder='insira o tokenAPI do github'
								/>
								<FieldToaster field={field} />
							</>
						)
					}}
				/>

				<Button type='submit'>
					<Search className='w-4 h-4 mr-2' />
					Localizar repositorios
				</Button>
			</form>
			<Toaster position='top-right' expand={true} />
		</div>
	)
}

function FieldToaster({ field }: { field: AnyFieldApi }) {
	useEffect(() => {
		if (field.state.meta.errors.length > 0 && field.state.meta.isTouched) {
			toast.error(field.state.meta.errors[0])
		}
	}, [field.state.meta.errors.length, field.state.meta.isTouched, field.state.meta.errors[0]])

	return null
}

export { ListReposPage }
