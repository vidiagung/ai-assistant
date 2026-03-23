'use client'
import { useState, useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
	useSidebar,
} from '@/components/ui/sidebar'
import {
	Trash2, Plus, Sparkles, MessageSquare,
	Zap, Search, Copy , FolderOpen, Code2,
	Download, ChevronsUpDown, Mic, AudioWaveform,
	SquarePen 
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Role = 'user' | 'assistant'

interface Message {
	id: string
	role: Role
	content: string
	inputTokens?: number
	outputTokens?: number
	createdAt: Date
}

interface Conversation {
	id: string
	title: string
	updatedAt: Date
}

/* ── Typing dots ── */
function TypingDots() {
	return (
		<span className="inline-flex items-center gap-1 px-1">
			{[0, 150, 300].map( ( delay, i ) => (
				<span key={i} className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce"
					style={{ animationDelay: `${delay}ms`, animationDuration: '1s' }} />
			) )}
		</span>
	)
}

/* ── Message bubble ── */
function MessageBubble( { msg }: { msg: Message } ) {
	const isUser = msg.role === 'user'
	return (
		<div className={cn( 'group flex gap-3 items-end', isUser ? 'flex-row-reverse' : 'flex-row' )}>
			<Avatar className="w-7 h-7 shrink-0 mb-0.5">
				<AvatarFallback className={cn(
					'text-[10px] font-semibold',
					isUser ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-700 text-zinc-200'
				)}>
					{isUser ? 'U' : <Zap className="w-3 h-3" />}
				</AvatarFallback>
			</Avatar>
			<div className={cn( 'flex flex-col gap-1 max-w-[72%]', isUser ? 'items-end' : 'items-start' )}>
				<div className={cn(
					'px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm',
					isUser
						? 'bg-zinc-200 text-zinc-900 rounded-br-sm'
						: 'bg-zinc-800 border border-white/8 text-zinc-100 rounded-bl-sm'
				)}>
					<pre className="whitespace-pre-wrap font-sans wrap-break-words">{msg.content}</pre>
				</div>
				{msg.outputTokens && (
					<span className="text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity px-1">
						{msg.inputTokens}↑ {msg.outputTokens}↓ tokens
					</span>
				)}
			</div>
		</div>
	)
}

/* ── Input bar (reusable) ── */
function InputBar( {
	textareaRef, input, setInput, isStreaming, mounted, sendMessage, handleKeyDown,
}: {
	textareaRef: React.RefObject<HTMLTextAreaElement | null>
	input: string
	setInput: ( v: string ) => void
	isStreaming: boolean
	mounted: boolean
	sendMessage: () => void
	handleKeyDown: ( e: React.KeyboardEvent<HTMLTextAreaElement> ) => void
} ) {
	return (
		<div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 shadow-lg">
			<button className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/8 transition-colors shrink-0">
				<Plus className="w-5 h-5" />
			</button>
			<textarea
				ref={textareaRef}
				value={input}
				onChange={( e ) => setInput( e.target.value )}
				onKeyDown={handleKeyDown}
				placeholder="Ask anything"
				rows={1}
				disabled={isStreaming}
				className="flex-1 resize-none bg-transparent outline-none border-none ring-0 text-base py-2 px-0 min-h-10 max-h-36 text-white placeholder:text-zinc-500"
			/>
			<button className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/8 transition-colors shrink-0">
				<Mic className="w-5 h-5" />
			</button>
			<button
				onClick={sendMessage}
				disabled={!mounted || isStreaming || !input.trim()}
				suppressHydrationWarning
				className={cn(
					'w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all duration-150',
					input.trim() && !isStreaming
						? 'bg-white text-black hover:bg-zinc-200 shadow'
						: 'bg-white/20 text-zinc-500 cursor-not-allowed'
				)}
			>
				<AudioWaveform className="w-5 h-5" />
			</button>
		</div>
	)
}

/* ── App sidebar ── */
function AppSidebar( {
	conversations, activeConvId, onNew, onLoad, onDelete,
}: {
	conversations: Conversation[]
	activeConvId: string | null
	onNew: () => void
	onLoad: ( id: string ) => void
	onDelete: ( id: string ) => void
} ) {
	const { state } = useSidebar()
	const isCollapsed = state === 'collapsed'

	return (
		<Sidebar collapsible="icon" className="bg-[#1a1a1a] border-r border-white/8">
			<SidebarHeader className="bg-[#1a1a1a]">
				<SidebarMenu>
					<SidebarMenuItem>
						{isCollapsed ? (
							<SidebarMenuButton tooltip="Expand" asChild>
								<SidebarTrigger className="w-full h-8" />
							</SidebarMenuButton>
						) : (
							<div className="flex items-center justify-between px-2 py-1">
								<span className="font-semibold text-sm text-zinc-100">AI Assistant</span>
								<SidebarTrigger className="h-7 w-7 text-zinc-500 hover:text-zinc-100" />
							</div>
						)}
					</SidebarMenuItem>
				</SidebarMenu>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton onClick={onNew} tooltip="New chat">
							<SquarePen  className="w-4 h-4" /><span>New chat</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton tooltip="Search">
							<Search className="w-4 h-4" /><span>Search</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton tooltip="Customize">
							<Copy className="w-4 h-4" /><span>Images</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent className="bg-[#1a1a1a]">
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{[
								{ icon: MessageSquare, label: 'Chats' },
								{ icon: FolderOpen, label: 'Projects' },
								{ icon: Sparkles, label: 'Artifacts' },
							].map( ( item ) => (
								<SidebarMenuItem key={item.label}>
									<SidebarMenuButton tooltip={item.label}>
										<item.icon className="w-4 h-4" /><span>{item.label}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							) )}
							<SidebarMenuItem>
								<SidebarMenuButton tooltip="Code">
									<Code2 className="w-4 h-4" /><span>Code</span>
									<Badge variant="outline" className="ml-auto text-[9px] h-4 px-1.5 group-data-[collapsible=icon]:hidden">Upgrade</Badge>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup className="flex-1">
					<SidebarGroupLabel>Recent chats</SidebarGroupLabel>
					<SidebarGroupContent>
						{conversations.length === 0 ? (
							<p className="text-xs text-sidebar-foreground/40 text-center py-6 px-4 leading-relaxed group-data-[collapsible=icon]:hidden">
								Your chats will show up here
							</p>
						) : (
							<SidebarMenu>
								{conversations.map( ( conv ) => (
									<SidebarMenuItem key={conv.id}>
										<SidebarMenuButton
											isActive={activeConvId === conv.id}
											onClick={() => onLoad( conv.id )}
											tooltip={conv.title}
										>
											<MessageSquare className="w-3.5 h-3.5 shrink-0" />
											<span className="truncate">{conv.title}</span>
										</SidebarMenuButton>
										<SidebarMenuAction
											onClick={( e ) => { e.stopPropagation(); onDelete( conv.id ) }}
											className="hover:text-destructive"
										>
											<Trash2 className="w-3.5 h-3.5" />
										</SidebarMenuAction>
									</SidebarMenuItem>
								) )}
							</SidebarMenu>
						)}
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="bg-[#1a1a1a] border-t border-white/8">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" tooltip="Kyoshiro Commander" className="h-auto py-2">
							<div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-sm">
								KC
							</div>
							<div className="flex-1 min-w-0 text-left">
								<p className="text-xs font-medium text-sidebar-foreground truncate leading-snug">Kyoshiro Commander</p>
								<p className="text-[10px] text-sidebar-foreground/50 leading-snug">Free plan</p>
							</div>
							<div className="flex items-center gap-0.5 shrink-0">
								<Tooltip>
									<TooltipTrigger asChild>
										<div className="w-6 h-6 flex items-center justify-center rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
											<Download className="w-3 h-3" />
										</div>
									</TooltipTrigger>
									<TooltipContent side="top" className="text-xs">Download app</TooltipContent>
								</Tooltip>
								<div className="w-6 h-6 flex items-center justify-center rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
									<ChevronsUpDown className="w-3 h-3" />
								</div>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	)
}

/* ── Main chat area ── */
function ChatArea( {
	conversations, activeConvId, messages, input, setInput,
	isStreaming, streamingContent, messagesEndRef, textareaRef,
	sendMessage, handleKeyDown, mounted,
}: {
	conversations: Conversation[]
	activeConvId: string | null
	messages: Message[]
	input: string
	setInput: ( v: string ) => void
	isStreaming: boolean
	streamingContent: string
	messagesEndRef: React.RefObject<HTMLDivElement | null>
	textareaRef: React.RefObject<HTMLTextAreaElement | null>
	sendMessage: () => void
	handleKeyDown: ( e: React.KeyboardEvent<HTMLTextAreaElement> ) => void
	mounted: boolean
} ) {
	const activeConv = conversations.find( ( c ) => c.id === activeConvId )

	return (
		<main className="flex-1 flex flex-col overflow-hidden min-w-0">
			{/* Header */}
			<header className="flex items-center gap-2 px-4 py-3 shrink-0">
				{activeConv
					? <h1 className="text-sm font-medium truncate">{activeConv.title}</h1>
					: <h1 className="text-sm font-medium text-muted-foreground">New Conversation</h1>
				}
			</header>

			{/* Messages / Empty */}
			<ScrollArea className="flex-1">
				<div className="max-w-3xl mx-auto px-6 py-6">
					{messages.length === 0 && !isStreaming ? (
						<div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] gap-10 select-none">
							<h1 className="text-[2rem] font-semibold tracking-tight text-foreground">
								What&apos;s on your mind today?
							</h1>
							<div className="w-full max-w-2xl">
								<InputBar
									textareaRef={textareaRef}
									input={input}
									setInput={setInput}
									isStreaming={isStreaming}
									mounted={mounted}
									sendMessage={sendMessage}
									handleKeyDown={handleKeyDown}
								/>
							</div>
						</div>
					) : (
						<div className="space-y-5">
							{messages.map( ( msg ) => <MessageBubble key={msg.id} msg={msg} /> )}
							{isStreaming && (
								<div className="flex gap-3 items-end">
									<Avatar className="w-7 h-7 shrink-0 mb-0.5">
										<AvatarFallback className="bg-zinc-700 text-zinc-200 text-[10px]">
											<Zap className="w-3 h-3" />
										</AvatarFallback>
									</Avatar>
									<div className="max-w-[72%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed bg-zinc-800 border border-white/8 text-zinc-100 shadow-sm">
										{streamingContent ? (
											<>
												<pre className="whitespace-pre-wrap font-sans wrap-break-words">{streamingContent}</pre>
												<span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse rounded-full align-middle opacity-50" />
											</>
										) : <TypingDots />}
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>
					)}
				</div>
			</ScrollArea>

			{/* Bottom input — only when chatting */}
			{( messages.length > 0 || isStreaming ) && (
				<div className="w-full flex justify-center px-6 pb-5 pt-3 shrink-0">
					<div className="w-full max-w-2xl">
						<InputBar
							textareaRef={textareaRef}
							input={input}
							setInput={setInput}
							isStreaming={isStreaming}
							mounted={mounted}
							sendMessage={sendMessage}
							handleKeyDown={handleKeyDown}
						/>
						<p className="text-[10px] text-zinc-700 text-center mt-2">
							Enter kirim · Shift+Enter baris baru
						</p>
					</div>
				</div>
			)}
		</main>
	)
}

/* ── Root ── */
export default function ChatPage() {
	const [conversations, setConversations] = useState<Conversation[]>( [] )
	const [activeConvId, setActiveConvId] = useState<string | null>( null )
	const [messages, setMessages] = useState<Message[]>( [] )
	const [input, setInput] = useState( '' )
	const [isStreaming, setIsStreaming] = useState( false )
	const [streamingContent, setStreamingContent] = useState( '' )
	const [mounted, setMounted] = useState( false )
	const messagesEndRef = useRef<HTMLDivElement>( null )
	const textareaRef = useRef<HTMLTextAreaElement>( null )

	useEffect( () => { setMounted( true ) }, [] )
	useEffect( () => { fetchConversations() }, [] )
	useEffect( () => { messagesEndRef.current?.scrollIntoView( { behavior: 'smooth' } ) }, [messages, streamingContent] )
	useEffect( () => {
		const el = textareaRef.current
		if ( !el ) return
		el.style.height = 'auto'
		el.style.height = Math.min( el.scrollHeight, 160 ) + 'px'
	}, [input] )
	useEffect( () => {
		document.documentElement.classList.add( 'dark' )
	}, [] )

	async function fetchConversations() {
		try {
			const res = await fetch( '/api/conversations' )
			if ( !res.ok ) return
			setConversations( await res.json() )
		} catch ( err ) { console.error( err ) }
	}

	async function loadConversation( id: string ) {
		try {
			const res = await fetch( `/api/conversations/${id}` )
			if ( !res.ok ) return
			const data = await res.json()
			setActiveConvId( id )
			setMessages( data.messages ?? [] )
		} catch ( err ) { console.error( err ) }
	}

	function newConversation() { setActiveConvId( null ); setMessages( [] ); setInput( '' ) }

	async function deleteConversation( id: string ) {
		await fetch( `/api/chat/${id}`, { method: 'DELETE' } )
		if ( activeConvId === id ) newConversation()
		fetchConversations()
	}

	async function sendMessage() {
		if ( !input.trim() || isStreaming ) return
		const userText = input.trim()
		setInput( '' ); setIsStreaming( true ); setStreamingContent( '' )
		setMessages( ( prev ) => [...prev, { id: `temp-${Date.now()}`, role: 'user', content: userText, createdAt: new Date() }] )

		try {
			const res = await fetch( '/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( { message: userText, conversationId: activeConvId } ),
			} )
			if ( !res.ok || !res.body ) return

			const reader = res.body.getReader()
			const decoder = new TextDecoder()
			let accumulated = '', buffer = ''

			while ( true ) {
				const { done, value } = await reader.read()
				if ( done ) break
				buffer += decoder.decode( value, { stream: true } )
				const lines = buffer.split( '\n' )
				buffer = lines.pop() ?? ''

				for ( const line of lines ) {
					const trimmed = line.trim()
					if ( !trimmed.startsWith( 'data: ' ) ) continue
					let json; try { json = JSON.parse( trimmed.slice( 6 ) ) } catch { continue }

					if ( json.type === 'init' ) { setActiveConvId( json.conversationId ); fetchConversations() }
					else if ( json.type === 'text' ) { accumulated += json.text; setStreamingContent( accumulated ) }
					else if ( json.type === 'done' ) {
						setMessages( ( prev ) => [...prev, {
							id: json.messageId, role: 'assistant', content: accumulated,
							inputTokens: json.inputTokens, outputTokens: json.outputTokens, createdAt: new Date(),
						}] )
						setStreamingContent( '' ); fetchConversations()
					}
				}
			}
		} catch ( err ) { console.error( err ) }
		finally { setIsStreaming( false ) }
	}

	function handleKeyDown( e: React.KeyboardEvent<HTMLTextAreaElement> ) {
		if ( e.key === 'Enter' && !e.shiftKey ) { e.preventDefault(); sendMessage() }
	}

	return (
		<TooltipProvider delayDuration={300}>
			<SidebarProvider defaultOpen={true}>
				<div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
					<AppSidebar
						conversations={conversations}
						activeConvId={activeConvId}
						onNew={newConversation}
						onLoad={loadConversation}
						onDelete={deleteConversation}
					/>
					<ChatArea
						conversations={conversations}
						activeConvId={activeConvId}
						messages={messages}
						input={input}
						setInput={setInput}
						isStreaming={isStreaming}
						streamingContent={streamingContent}
						messagesEndRef={messagesEndRef}
						textareaRef={textareaRef}
						sendMessage={sendMessage}
						handleKeyDown={handleKeyDown}
						mounted={mounted}
					/>
				</div>
			</SidebarProvider>
		</TooltipProvider>
	)
}