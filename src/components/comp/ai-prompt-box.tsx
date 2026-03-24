'use client'
import React from 'react'
import NextImage from 'next/image'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
	ArrowUp, Paperclip, Square, X, StopCircle,
	Mic, Globe, BrainCog, FolderCode,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

/* ── Inject scrollbar styles ── */
if ( typeof document !== 'undefined' ) {
	const s = document.createElement( 'style' )
	s.innerText = `
    *:focus-visible { outline-offset: 0 !important; }
    .ai-prompt-scroll::-webkit-scrollbar { width: 6px; }
    .ai-prompt-scroll::-webkit-scrollbar-track { background: transparent; }
    .ai-prompt-scroll::-webkit-scrollbar-thumb { background-color: #444; border-radius: 3px; }
    .ai-prompt-scroll::-webkit-scrollbar-thumb:hover { background-color: #555; }
  `
	document.head.appendChild( s )
}

/* ── Tooltip primitives ── */
const TooltipProvider = TooltipPrimitive.Provider
const Tooltip        = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger
const TooltipContent = React.forwardRef<
	React.ElementRef<typeof TooltipPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>( ( { className, sideOffset = 4, ...props }, ref ) => (
	<TooltipPrimitive.Content
		ref={ref}
		sideOffset={sideOffset}
		className={cn(
			'z-50 overflow-hidden rounded-md border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
			className
		)}
		{...props}
	/>
) )
TooltipContent.displayName = TooltipPrimitive.Content.displayName

/* ── Dialog primitives ── */
const Dialog       = DialogPrimitive.Root
const DialogPortal = DialogPrimitive.Portal

const DialogOverlay = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>( ( { className, ...props }, ref ) => (
	<DialogPrimitive.Overlay
		ref={ref}
		className={cn(
			'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
			className
		)}
		{...props}
	/>
) )
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>( ( { className, children, ...props }, ref ) => (
	<DialogPortal>
		<DialogOverlay />
		<DialogPrimitive.Content
			ref={ref}
			className={cn(
				'fixed left-[50%] top-[50%] z-50 w-full max-w-[90vw] md:max-w-200 translate-x-[-50%] translate-y-[-50%] border border-white/10 bg-zinc-900 p-0 shadow-xl rounded-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
				className
			)}
			{...props}
		>
			{children}
			<DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-full bg-zinc-800/80 p-2 hover:bg-zinc-700 transition-all">
				<X className="h-5 w-5 text-zinc-300" />
				<span className="sr-only">Close</span>
			</DialogPrimitive.Close>
		</DialogPrimitive.Content>
	</DialogPortal>
) )
DialogContent.displayName = DialogPrimitive.Content.displayName

/* ── VoiceRecorder ── */
interface VoiceRecorderProps {
	isRecording: boolean
	onStartRecording: () => void
	onStopRecording: ( duration: number ) => void
	visualizerBars?: number
}
const VoiceRecorder: React.FC<VoiceRecorderProps> = ( {
	isRecording, onStartRecording, onStopRecording, visualizerBars = 28,
} ) => {
	const [time, setTime] = React.useState( 0 )
	const timerRef = React.useRef<ReturnType<typeof setInterval> | null>( null )

	React.useEffect( () => {
		if ( isRecording ) {
			onStartRecording()
			timerRef.current = setInterval( () => setTime( t => t + 1 ), 1000 )
		} else {
			if ( timerRef.current ) { clearInterval( timerRef.current ); timerRef.current = null }
			onStopRecording( time )
			setTime( 0 )
		}
		return () => { if ( timerRef.current ) clearInterval( timerRef.current ) }
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isRecording] )

	const fmt = ( s: number ) =>
		`${Math.floor( s / 60 ).toString().padStart( 2, '0' )}:${( s % 60 ).toString().padStart( 2, '0' )}`

	return (
		<div className={cn(
			'flex flex-col items-center justify-center w-full transition-all duration-300 py-2',
			isRecording ? 'opacity-100' : 'opacity-0 h-0 pointer-events-none'
		)}>
			<div className="flex items-center gap-2 mb-2">
				<div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
				<span className="font-mono text-sm text-zinc-400">{fmt( time )}</span>
			</div>
			<div className="w-full h-8 flex items-center justify-center gap-0.5 px-4">
				{[...Array( visualizerBars )].map( ( _, i ) => (
					<div
						key={i}
						className="w-0.5 rounded-full bg-zinc-500 animate-pulse"
						style={{
							height: `${Math.max( 15, Math.random() * 100 )}%`,
							animationDelay: `${i * 0.05}s`,
							animationDuration: `${0.5 + Math.random() * 0.5}s`,
						}}
					/>
				) )}
			</div>
		</div>
	)
}

/* ── Image preview dialog ── */
const ImageViewDialog: React.FC<{ imageUrl: string | null; onClose: () => void }> = ( {
	imageUrl, onClose,
} ) => {
	if ( !imageUrl ) return null
	return (
		<Dialog open={!!imageUrl} onOpenChange={onClose}>
			<DialogContent>
				<DialogPrimitive.Title className="sr-only">Image Preview</DialogPrimitive.Title>
				<div className="relative w-full min-h-75 max-h-[80vh]">
					<NextImage
						src={imageUrl}
						alt="preview"
						fill
						unoptimized
						className="object-contain rounded-2xl"
					/>
				</div>
			</DialogContent>
		</Dialog>
	)
}

/* ── Divider ── */
const Divider = () => (
	<div className="h-4 w-px bg-white/10 mx-1 rounded-full" />
)

/* ── Types ── */
export interface PromptInputBoxProps {
	onSend?: ( message: string, files?: File[] ) => void
	isLoading?: boolean
	placeholder?: string
	className?: string
}

/* ── Main component ── */
export const PromptInputBox = React.forwardRef<HTMLDivElement, PromptInputBoxProps>(
	(
		{ onSend = () => {}, isLoading = false, placeholder = 'Ask anything', className },
		ref
	) => {
		const [input, setInput]                 = React.useState( '' )
		const [files, setFiles]                 = React.useState<File[]>( [] )
		const [filePreviews, setFilePreviews]   = React.useState<Record<string, string>>( {} )
		const [selectedImage, setSelectedImage] = React.useState<string | null>( null )
		const [isRecording, setIsRecording]     = React.useState( false )
		const [showSearch, setShowSearch]       = React.useState( false )
		const [showThink, setShowThink]         = React.useState( false )
		const [showCanvas, setShowCanvas]       = React.useState( false )
		const uploadRef   = React.useRef<HTMLInputElement>( null )
		const textareaRef = React.useRef<HTMLTextAreaElement>( null )

		/* auto-resize textarea */
		React.useEffect( () => {
			const el = textareaRef.current
			if ( !el ) return
			el.style.height = 'auto'
			el.style.height = Math.min( el.scrollHeight, 200 ) + 'px'
		}, [input] )

		const isImage = ( f: File ) => f.type.startsWith( 'image/' )

		const processFile = ( file: File ) => {
			if ( !isImage( file ) || file.size > 10 * 1024 * 1024 ) return
			setFiles( [file] )
			const reader = new FileReader()
			reader.onload = e => setFilePreviews( { [file.name]: e.target?.result as string } )
			reader.readAsDataURL( file )
		}

		const handleDrop = React.useCallback( ( e: React.DragEvent ) => {
			e.preventDefault(); e.stopPropagation()
			const imgs = Array.from( e.dataTransfer.files ).filter( isImage )
			if ( imgs[0] ) processFile( imgs[0] )
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [] )

		const handlePaste = React.useCallback( ( e: ClipboardEvent ) => {
			const items = e.clipboardData?.items
			if ( !items ) return
			for ( let i = 0; i < items.length; i++ ) {
				if ( items[i].type.startsWith( 'image' ) ) {
					const f = items[i].getAsFile()
					if ( f ) { e.preventDefault(); processFile( f ); break }
				}
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [] )

		React.useEffect( () => {
			document.addEventListener( 'paste', handlePaste )
			return () => document.removeEventListener( 'paste', handlePaste )
		}, [handlePaste] )

		const handleSubmit = () => {
			if ( !input.trim() && !files.length ) return
			let prefix = ''
			if ( showSearch )      prefix = '[Search: '
			else if ( showThink )  prefix = '[Think: '
			else if ( showCanvas ) prefix = '[Canvas: '
			const msg = prefix ? `${prefix}${input}]` : input
			onSend( msg, files )
			setInput( '' ); setFiles( [] ); setFilePreviews( {} )
		}

		const handleKeyDown = ( e: React.KeyboardEvent<HTMLTextAreaElement> ) => {
			if ( e.key === 'Enter' && !e.shiftKey ) { e.preventDefault(); handleSubmit() }
		}

		const toggle = ( mode: 'search' | 'think' | 'canvas' ) => {
			if ( mode === 'search' )      { setShowSearch( p => !p ); setShowThink( false ); setShowCanvas( false ) }
			else if ( mode === 'think' )  { setShowThink( p => !p ); setShowSearch( false ); setShowCanvas( false ) }
			else                          { setShowCanvas( p => !p ); setShowSearch( false ); setShowThink( false ) }
		}

		const hasContent = input.trim() !== '' || files.length > 0

		return (
			<TooltipProvider delayDuration={300}>
				<div
					ref={ref}
					className={cn(
						'flex items-center gap-2 backdrop-blur-md border rounded-full px-3 py-2 shadow-lg transition-all duration-200',
						isRecording
							? 'bg-zinc-900/80 border-red-500/40'
							: 'bg-white/5 border-white/10',
						className
					)}
					onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
					onDragLeave={e => { e.preventDefault(); e.stopPropagation() }}
					onDrop={handleDrop}
				>
					{/* ── Tombol lampiran ── */}
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								onClick={() => uploadRef.current?.click()}
								disabled={isRecording || isLoading}
								className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/8 transition-colors shrink-0 disabled:opacity-40"
							>
								<Paperclip className="w-5 h-5" />
								<input
									ref={uploadRef} type="file" className="hidden" accept="image/*"
									onChange={e => {
										if ( e.target.files?.[0] ) processFile( e.target.files[0] )
										if ( e.target ) e.target.value = ''
									}}
								/>
							</button>
						</TooltipTrigger>
						<TooltipContent>Attach image</TooltipContent>
					</Tooltip>

					{/* ── Preview gambar ── */}
					<AnimatePresence>
						{files.length > 0 && !isRecording && (
							<motion.div
								initial={{ width: 0, opacity: 0 }}
								animate={{ width: 'auto', opacity: 1 }}
								exit={{ width: 0, opacity: 0 }}
								className="flex gap-1 overflow-hidden"
							>
								{files.map( ( file, i ) =>
									filePreviews[file.name] ? (
										<div key={i} className="relative shrink-0">
											<div
												className="relative w-9 h-9 rounded-lg overflow-hidden cursor-pointer"
												onClick={() => setSelectedImage( filePreviews[file.name] )}
											>
												<NextImage
													src={filePreviews[file.name]}
													alt={file.name}
													fill
													unoptimized
													className="object-cover"
												/>
											</div>
											<button
												onClick={e => { e.stopPropagation(); setFiles( [] ); setFilePreviews( {} ) }}
												className="absolute -top-1 -right-1 rounded-full bg-black/80 p-0.5"
											>
												<X className="w-2.5 h-2.5 text-white" />
											</button>
										</div>
									) : null
								)}
							</motion.div>
						)}
					</AnimatePresence>

					{/* ── Textarea / Recording ── */}
					<div className="flex-1 min-w-0">
						{isRecording ? (
							<VoiceRecorder
								isRecording={isRecording}
								onStartRecording={() => {}}
								onStopRecording={duration => {
									setIsRecording( false )
									onSend( `[Voice message - ${duration}s]`, [] )
								}}
							/>
						) : (
							<textarea
								ref={textareaRef}
								value={input}
								onChange={e => setInput( e.target.value )}
								onKeyDown={handleKeyDown}
								placeholder={
									showSearch ? 'Search the web…' :
										showThink  ? 'Think deeply…'   :
											showCanvas ? 'Create on canvas…' :
												placeholder
								}
								rows={1}
								disabled={isLoading}
								className="ai-prompt-scroll w-full resize-none bg-transparent outline-none border-none ring-0 text-base py-2 px-0 min-h-10 max-h-48 text-white placeholder:text-zinc-500"
							/>
						)}
					</div>

					{/* ── Toggle mode ── */}
					{!isRecording && (
						<div className="flex items-center gap-0.5 shrink-0">
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										onClick={() => toggle( 'search' )}
										className={cn(
											'rounded-full flex items-center gap-1 px-2 py-1 h-8 border text-xs transition-all',
											showSearch
												? 'bg-sky-500/15 border-sky-500/60 text-sky-400'
												: 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
										)}
									>
										<motion.div
											animate={{ rotate: showSearch ? 360 : 0 }}
											transition={{ type: 'spring', stiffness: 260, damping: 25 }}
										>
											<Globe className="w-4 h-4" />
										</motion.div>
										<AnimatePresence>
											{showSearch && (
												<motion.span
													initial={{ width: 0, opacity: 0 }}
													animate={{ width: 'auto', opacity: 1 }}
													exit={{ width: 0, opacity: 0 }}
													className="overflow-hidden whitespace-nowrap"
												>
													Search
												</motion.span>
											)}
										</AnimatePresence>
									</button>
								</TooltipTrigger>
								<TooltipContent>Web search</TooltipContent>
							</Tooltip>

							<Divider />

							<Tooltip>
								<TooltipTrigger asChild>
									<button
										onClick={() => toggle( 'think' )}
										className={cn(
											'rounded-full flex items-center gap-1 px-2 py-1 h-8 border text-xs transition-all',
											showThink
												? 'bg-violet-500/15 border-violet-500/60 text-violet-400'
												: 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
										)}
									>
										<motion.div
											animate={{ rotate: showThink ? 360 : 0 }}
											transition={{ type: 'spring', stiffness: 260, damping: 25 }}
										>
											<BrainCog className="w-4 h-4" />
										</motion.div>
										<AnimatePresence>
											{showThink && (
												<motion.span
													initial={{ width: 0, opacity: 0 }}
													animate={{ width: 'auto', opacity: 1 }}
													exit={{ width: 0, opacity: 0 }}
													className="overflow-hidden whitespace-nowrap"
												>
													Think
												</motion.span>
											)}
										</AnimatePresence>
									</button>
								</TooltipTrigger>
								<TooltipContent>Deep reasoning</TooltipContent>
							</Tooltip>

							<Divider />

							<Tooltip>
								<TooltipTrigger asChild>
									<button
										onClick={() => toggle( 'canvas' )}
										className={cn(
											'rounded-full flex items-center gap-1 px-2 py-1 h-8 border text-xs transition-all',
											showCanvas
												? 'bg-orange-500/15 border-orange-500/60 text-orange-400'
												: 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
										)}
									>
										<motion.div
											animate={{ rotate: showCanvas ? 360 : 0 }}
											transition={{ type: 'spring', stiffness: 260, damping: 25 }}
										>
											<FolderCode className="w-4 h-4" />
										</motion.div>
										<AnimatePresence>
											{showCanvas && (
												<motion.span
													initial={{ width: 0, opacity: 0 }}
													animate={{ width: 'auto', opacity: 1 }}
													exit={{ width: 0, opacity: 0 }}
													className="overflow-hidden whitespace-nowrap"
												>
													Canvas
												</motion.span>
											)}
										</AnimatePresence>
									</button>
								</TooltipTrigger>
								<TooltipContent>Canvas mode</TooltipContent>
							</Tooltip>
						</div>
					)}

					{/* ── Tombol kirim / stop / mic ── */}
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								onClick={() => {
									if ( isLoading || isRecording ) { setIsRecording( false ); return }
									if ( hasContent ) { handleSubmit(); return }
									setIsRecording( true )
								}}
								className={cn(
									'w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all duration-150',
									isRecording
										? 'bg-transparent text-red-500 hover:bg-white/8'
										: hasContent || isLoading
											? 'bg-white text-black hover:bg-zinc-200 shadow'
											: 'bg-white/20 text-zinc-400 hover:bg-white/30'
								)}
							>
								{isLoading ? (
									<Square className="w-4 h-4 fill-current animate-pulse" />
								) : isRecording ? (
									<StopCircle className="w-5 h-5" />
								) : hasContent ? (
									<ArrowUp className="w-4 h-4" />
								) : (
									<Mic className="w-5 h-5" />
								)}
							</button>
						</TooltipTrigger>
						<TooltipContent>
							{isLoading ? 'Stop' : isRecording ? 'Stop recording' : hasContent ? 'Send' : 'Voice'}
						</TooltipContent>
					</Tooltip>
				</div>

				<ImageViewDialog imageUrl={selectedImage} onClose={() => setSelectedImage( null )} />
			</TooltipProvider>
		)
	}
)
PromptInputBox.displayName = 'PromptInputBox'