'use client'
import { useState } from 'react'
import { Lightbulb, Settings2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface CreateProjectDialogProps {
	open: boolean
	onCloseAction: () => void
	onCreateAction: ( name: string, category: string ) => void
}

const CATEGORIES = [
	{ label: 'Investing', emoji: '💹' },
	{ label: 'Homework', emoji: '🎓' },
	{ label: 'Writing', emoji: '✍️' },
	{ label: 'Travel', emoji: '✈️' },
	{ label: 'Work', emoji: '💼' },
	{ label: 'Personal', emoji: '🌱' },
]

export function CreateProjectDialog( { open, onCloseAction, onCreateAction }: CreateProjectDialogProps ) {
	const [name, setName]         = useState( '' )
	const [selected, setSelected] = useState<string | null>( null )

	function handleCreate() {
		if ( !name.trim() ) return
		onCreateAction( name.trim(), selected ?? '' )
		setName( '' )
		setSelected( null )
		onCloseAction()
	}

	return (
		<Dialog open={open} onOpenChange={( v ) => !v && onCloseAction()}>
			<DialogContent className="max-w-md bg-[#1c1c1e] border border-white/10 rounded-2xl p-0 gap-0 [&>button]:hidden">

				{/* Header */}
				<DialogHeader className="flex-row items-center justify-between px-5 pt-5 pb-4 space-y-0">
					<DialogTitle className="text-base font-semibold text-zinc-100 tracking-tight">
						Create project
					</DialogTitle>
					<DialogDescription className="sr-only">
						Create a new project to organize your chats and files.
					</DialogDescription>
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="w-7 h-7 text-zinc-500 hover:text-zinc-300 hover:bg-white/8 rounded-lg"
						>
							<Settings2 className="w-4 h-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={onCloseAction}
							className="w-7 h-7 text-zinc-500 hover:text-zinc-300 hover:bg-white/8 rounded-lg"
						>
							✕
						</Button>
					</div>
				</DialogHeader>

				<div className="px-5 pb-5 space-y-4">
					{/* Project name input */}
					<div className="space-y-1.5">
						<Label className="text-xs font-medium text-zinc-400">Project name</Label>
						<div className="relative">
							<Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
							<Input
								value={name}
								onChange={( e ) => setName( e.target.value )}
								onKeyDown={( e ) => e.key === 'Enter' && handleCreate()}
								placeholder="Copenhagen Trip"
								autoFocus
								className="pl-9 h-10 rounded-xl bg-[#2a2a2d] border-white/8 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-white/20 focus-visible:ring-1 focus-visible:ring-offset-0"
							/>
						</div>
					</div>

					{/* Category chips — shadcn Badge as toggle */}
					<div className="flex flex-wrap gap-2">
						{CATEGORIES.map( ( cat ) => (
							<Badge
								key={cat.label}
								variant="outline"
								onClick={() => setSelected( selected === cat.label ? null : cat.label )}
								className={cn(
									'cursor-pointer gap-1.5 px-3 h-8 rounded-full text-xs font-medium transition-all select-none',
									selected === cat.label
										? 'bg-white/10 border-white/20 text-zinc-100 hover:bg-white/15'
										: 'bg-transparent border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
								)}
							>
								<span>{cat.emoji}</span>
								<span>{cat.label}</span>
							</Badge>
						) )}
					</div>

					{/* Info banner */}
					<div className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-[#252528] border border-white/6">
						<Lightbulb className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
						<p className="text-[11px] text-zinc-500 leading-relaxed">
							Projects keep chats, files, and custom instructions in one place. Use them for ongoing work, or just to keep things tidy.
						</p>
					</div>

					{/* Create button */}
					<div className="flex justify-end pt-1">
						<Button
							onClick={handleCreate}
							disabled={!name.trim()}
							className="px-4 h-9 rounded-xl text-sm font-medium bg-zinc-200 text-zinc-900 hover:bg-white disabled:bg-zinc-700 disabled:text-zinc-500"
						>
							Create project
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}