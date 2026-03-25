'use client'
import { useState, useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AIPromptBox } from '@/components/comp/AIPromptBox'
import { CreateProjectDialog } from '@/components/comp/CreateProjectDialog'  // ← import dialog
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
	Trash2, MessageSquare,
	Zap, Search, Copy, Code2,
	Download, ChevronsUpDown,
	SquarePen, FolderPlus, LogIn,
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

interface Project {
	id: string
	name: string
	category: string
}

/* ── Typing dots ── */
function TypingDots() {
	return (
		<span className="inline-flex items-center gap-1 px-1">
			{[0, 150, 300].map( ( delay, i ) => (
				<span
					key={i}
					className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce"
					style={{ animationDelay: `${delay}ms`, animationDuration: '1s' }}
				/>
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

/* ── App sidebar ── */
function AppSidebar( {
	conversations,
	activeConvId,
	onNew,
	onLoad,
	onDelete,
	isLoggedIn,
	setShowLogin,
	onOpenCreateProject,  // ← prop baru
	projects,             // ← prop baru
}: {
	conversations: Conversation[]
	activeConvId: string | null
	onNew: () => void
	onLoad: ( id: string ) => void
	onDelete: ( id: string ) => void
	isLoggedIn: boolean
	setShowLogin: ( v: boolean ) => void
	onOpenCreateProject: () => void
	projects: Project[]
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
							<SquarePen className="w-4 h-4" /><span>New chat</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton tooltip="Search">
							<Search className="w-4 h-4" /><span>Search</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton tooltip="Images">
							<Copy className="w-4 h-4" /><span>Images</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton tooltip="Codex">
							<Code2 className="w-4 h-4" /><span>Codex</span>
							<Badge variant="outline" className="ml-auto text-[9px] h-4 px-1.5 group-data-[collapsible=icon]:hidden">
								Upgrade
							</Badge>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent className="bg-[#1a1a1a]">
				<SidebarGroup>
					<SidebarGroupLabel>Projects</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{/* ← klik tombol ini buka dialog */}
							<SidebarMenuItem>
								<SidebarMenuButton tooltip="New Projects" onClick={onOpenCreateProject}>
									<FolderPlus className="w-4 h-4" /><span>New Projects</span>
								</SidebarMenuButton>
							</SidebarMenuItem>

							{/* Render project yang sudah dibuat */}
							{projects.map( ( proj ) => (
								<SidebarMenuItem key={proj.id}>
									<SidebarMenuButton tooltip={proj.name}>
										<span className="text-xs">📁</span>
										<span className="truncate">{proj.name}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							) )}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarGroup className="flex-1">
					<SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
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

			<SidebarFooter className="bg-[#1a1a1a] border-white/8">
				{isLoggedIn ? (
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
				) : (
					<div className="px-3 py-3 space-y-3 group-data-[collapsible=icon]:hidden">
						<div>
							<p className="text-xs font-semibold text-zinc-200 leading-snug mb-1">Get responses tailored to you</p>
							<p className="text-[11px] text-zinc-500 leading-relaxed">
								Log in to get answers based on saved chats, plus create images and upload files.
							</p>
						</div>
						<button
							onClick={() => setShowLogin( true )}
							className="w-full h-9 rounded-full bg-[#3a3a3a] hover:bg-[#444] text-zinc-100 text-sm font-medium transition-colors border border-white/10 flex items-center justify-center gap-2"
						>
							Log In
							<LogIn className="w-4 h-4" />
						</button>
					</div>
				)}
			</SidebarFooter>
		</Sidebar>
	)
}

/* ── Main chat area ── */
function ChatArea( {
	conversations,
	activeConvId,
	messages,
	isStreaming,
	streamingContent,
	messagesEndRef,
	onSend,
}: {
	conversations: Conversation[]
	activeConvId: string | null
	messages: Message[]
	isStreaming: boolean
	streamingContent: string
	messagesEndRef: React.RefObject<HTMLDivElement | null>
	onSend: ( message: string, files?: File[] ) => void
} ) {
	const activeConv = conversations.find( ( c ) => c.id === activeConvId )

	return (
		<main className="flex-1 flex flex-col overflow-hidden min-w-0">
			<header className="flex items-center gap-2 px-4 py-3 shrink-0">
				{activeConv
					? <h1 className="text-sm font-medium truncate">{activeConv.title}</h1>
					: <h1 className="text-sm font-medium text-muted-foreground">New Conversation</h1>
				}
			</header>

			<ScrollArea className="flex-1">
				<div className="h-full px-6 py-6">
					{messages.length === 0 && !isStreaming ? (
						<div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] gap-10 select-none">
							<h1 className="text-[2rem] font-semibold tracking-tight text-foreground">
								What&apos;s on your mind today?
							</h1>
							<div className="w-full max-w-2xl mx-auto">
								<AIPromptBox
									onSend={onSend}
									isLoading={isStreaming}
									placeholder="Ask anything"
								/>
							</div>
							<p className="text-[10px] text-zinc-700 -mt-6">
								Enter kirim · Shift+Enter baris baru
							</p>
						</div>
					) : (
						<div className="max-w-3xl mx-auto space-y-5">
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

			{( messages.length > 0 || isStreaming ) && (
				<div className="w-full flex flex-col items-center px-6 pb-5 pt-3 shrink-0 gap-2">
					<div className="w-full max-w-2xl">
						<AIPromptBox
							onSend={onSend}
							isLoading={isStreaming}
							placeholder="Ask anything"
						/>
					</div>
					<p className="text-[10px] text-zinc-700">
						Enter kirim · Shift+Enter baris baru
					</p>
				</div>
			)}
		</main>
	)
}

/* ── Root ── */
export default function ChatPage() {
	const [conversations, setConversations] = useState<Conversation[]>( [] )
	const [activeConvId, setActiveConvId]   = useState<string | null>( null )
	const [messages, setMessages]           = useState<Message[]>( [] )
	const [isStreaming, setIsStreaming]      = useState( false )
	const [streamingContent, setStreamingContent] = useState( '' )
	const messagesEndRef = useRef<HTMLDivElement>( null )
	const [isLoggedIn, setIsLoggedIn] = useState( false )
	const [showLogin, setShowLogin]   = useState( false )

	// ── State untuk dialog & daftar project ──
	const [showCreateProject, setShowCreateProject] = useState( false )
	const [projects, setProjects] = useState<Project[]>( [] )

	useEffect( () => { fetchConversations() }, [] )
	useEffect( () => {
		messagesEndRef.current?.scrollIntoView( { behavior: 'smooth' } )
	}, [messages, streamingContent] )
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

	function newConversation() {
		setActiveConvId( null )
		setMessages( [] )
	}

	async function deleteConversation( id: string ) {
		await fetch( `/api/chat/${id}`, { method: 'DELETE' } )
		if ( activeConvId === id ) newConversation()
		fetchConversations()
	}

	// ── Handler saat project berhasil dibuat ──
	function handleCreateProject( name: string, category: string ) {
		const newProject: Project = {
			id: `proj-${Date.now()}`,
			name,
			category,
		}
		setProjects( prev => [...prev, newProject] )
	}

	async function handleSend( userText: string ) {
		if ( !userText.trim() || isStreaming ) return
		setIsStreaming( true )
		setStreamingContent( '' )
		setMessages( prev => [
			...prev,
			{ id: `temp-${Date.now()}`, role: 'user', content: userText, createdAt: new Date() },
		] )

		try {
			const res = await fetch( '/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( { message: userText, conversationId: activeConvId } ),
			} )
			if ( !res.ok || !res.body ) return

			const reader  = res.body.getReader()
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

					if ( json.type === 'init' ) {
						setActiveConvId( json.conversationId )
						fetchConversations()
					} else if ( json.type === 'text' ) {
						accumulated += json.text
						setStreamingContent( accumulated )
					} else if ( json.type === 'done' ) {
						setMessages( prev => [
							...prev,
							{
								id: json.messageId,
								role: 'assistant',
								content: accumulated,
								inputTokens: json.inputTokens,
								outputTokens: json.outputTokens,
								createdAt: new Date(),
							},
						] )
						setStreamingContent( '' )
						fetchConversations()
					}
				}
			}
		} catch ( err ) { console.error( err ) }
		finally { setIsStreaming( false ) }
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
						isLoggedIn={isLoggedIn}
						setShowLogin={setShowLogin}
						onOpenCreateProject={() => setShowCreateProject( true )}  // ← pass handler
						projects={projects}  // ← pass daftar project
					/>
					<ChatArea
						conversations={conversations}
						activeConvId={activeConvId}
						messages={messages}
						isStreaming={isStreaming}
						streamingContent={streamingContent}
						messagesEndRef={messagesEndRef}
						onSend={handleSend}
					/>
				</div>

				{/* Login modal */}
				{showLogin && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
						<div className="bg-white text-black p-6 rounded-xl w-75">
							<p className="mb-4 font-medium">Login dulu</p>
							<button
								onClick={() => { setIsLoggedIn( true ); setShowLogin( false ) }}
								className="w-full px-4 py-2 bg-black text-white rounded"
							>
								Login
							</button>
						</div>
					</div>
				)}

				{/* Create Project dialog ← ditambahkan di sini */}
				<CreateProjectDialog
					open={showCreateProject}
					onCloseAction={() => setShowCreateProject( false )}
					onCreateAction={handleCreateProject}
				/>

			</SidebarProvider>
		</TooltipProvider>
	)
}