'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { Trash2, Plus, Send, Bot, User, Sparkles } from 'lucide-react'
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

export default function ChatPage() {
	const [conversations, setConversations] = useState<Conversation[]>( [] )
	const [activeConvId, setActiveConvId] = useState<string | null>( null )
	const [messages, setMessages] = useState<Message[]>( [] )
	const [input, setInput] = useState( '' )
	const [isStreaming, setIsStreaming] = useState( false )
	const [streamingContent, setStreamingContent] = useState( '' )
	const messagesEndRef = useRef<HTMLDivElement>( null )

	useEffect( () => {
		fetchConversations()
	}, [] )

	useEffect( () => {
		messagesEndRef.current?.scrollIntoView( { behavior: 'smooth' } )
	}, [messages, streamingContent] )

	async function fetchConversations() {
		try {
			const res = await fetch( '/api/conversations' )
			if ( !res.ok ) return
			const data = await res.json()
			setConversations( data )
		} catch ( err ) {
			console.error( 'fetchConversations error:', err )
		}
	}

	async function loadConversation( id: string ) {
		try {
			const res = await fetch( `/api/conversations/${id}` )
			if ( !res.ok ) return
			const data = await res.json()
			setActiveConvId( id )
			setMessages( data.messages ?? [] )
		} catch ( err ) {
			console.error( 'loadConversation error:', err )
		}
	}

	async function newConversation() {
		setActiveConvId( null )
		setMessages( [] )
		setInput( '' )
	}

	async function deleteConversation( id: string ) {
		await fetch( `/api/chat/${id}`, { method: 'DELETE' } )
		if ( activeConvId === id ) newConversation()
		fetchConversations()
	}

	async function sendMessage() {
		if ( !input.trim() || isStreaming ) return

		const userText = input.trim()
		setInput( '' )
		setIsStreaming( true )
		setStreamingContent( '' )

		setMessages( ( prev ) => [
			...prev,
			{
				id: `temp-${Date.now()}`,
				role: 'user',
				content: userText,
				createdAt: new Date(),
			},
		] )

		try {
			const res = await fetch( '/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( { message: userText, conversationId: activeConvId } ),
			} )

			const reader = res.body!.getReader()
			const decoder = new TextDecoder()
			let accumulated = ''

			while ( true ) {
				const { done, value } = await reader.read()
				if ( done ) break

				const lines = decoder.decode( value ).split( '\n' )
				for ( const line of lines ) {
					if ( !line.startsWith( 'data: ' ) ) continue
					const json = JSON.parse( line.slice( 6 ) )

					if ( json.type === 'init' ) {
						setActiveConvId( json.conversationId )
						fetchConversations()
					} else if ( json.type === 'text' ) {
						accumulated += json.text
						setStreamingContent( accumulated )
					} else if ( json.type === 'done' ) {
						setMessages( ( prev ) => [
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
		} catch ( err ) {
			console.error( err )
		} finally {
			setIsStreaming( false )
		}
	}

	function handleKeyDown( e: React.KeyboardEvent<HTMLTextAreaElement> ) {
		if ( e.key === 'Enter' && !e.shiftKey ) {
			e.preventDefault()
			sendMessage()
		}
	}

	const activeConv = conversations.find( ( c ) => c.id === activeConvId )

	return (
		<TooltipProvider>
			<div className="flex h-screen bg-background text-foreground">

				{/* Sidebar */}
				<aside className="w-64 border-r flex flex-col bg-muted/30">
					<div className="p-4 border-b">
						<Button onClick={newConversation} className="w-full" variant="default" size="sm">
							<Plus className="w-4 h-4 mr-2" />
              New Conversation
						</Button>
					</div>

					<ScrollArea className="flex-1">
						<div className="p-2 space-y-1">
							{conversations.map( ( conv ) => (
								<div
									key={conv.id}
									onClick={() => loadConversation( conv.id )}
									className={cn(
										'group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors',
										activeConvId === conv.id
											? 'bg-accent text-accent-foreground'
											: 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
									)}
								>
									<span className="truncate flex-1">{conv.title}</span>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-destructive"
												onClick={( e ) => { e.stopPropagation(); deleteConversation( conv.id ) }}
											>
												<Trash2 className="w-3 h-3" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>Delete</TooltipContent>
									</Tooltip>
								</div>
							) )}
						</div>
					</ScrollArea>

					<div className="p-4 border-t">
						<p className="text-xs text-muted-foreground text-center">Powered by Claude</p>
					</div>
				</aside>

				{/* Main */}
				<main className="flex-1 flex flex-col overflow-hidden">

					{/* Header */}
					<header className="px-6 py-4 border-b flex items-center justify-between bg-background">
						<h1 className="font-semibold text-sm">
							{activeConv?.title ?? 'New Conversation'}
						</h1>
						<Badge variant="secondary" className="text-xs">
              claude-sonnet-4-20250514
						</Badge>
					</header>

					{/* Messages */}
					<ScrollArea className="flex-1 px-6 py-6">
						<div className="space-y-6 max-w-3xl mx-auto">

							{messages.length === 0 && !isStreaming && (
								<div className="flex flex-col items-center justify-center h-96 gap-3">
									<Sparkles className="w-10 h-10 text-muted-foreground" />
									<p className="text-muted-foreground font-medium">AI Assistant</p>
									<p className="text-muted-foreground/60 text-sm">Mulai percakapan di bawah</p>
								</div>
							)}

							{messages.map( ( msg ) => (
								<div
									key={msg.id}
									className={cn( 'flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start' )}
								>
									{msg.role === 'assistant' && (
										<div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
											<Bot className="w-4 h-4 text-primary-foreground" />
										</div>
									)}
									<div className={cn(
										'max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed',
										msg.role === 'user'
											? 'bg-primary text-primary-foreground rounded-br-sm'
											: 'bg-muted text-foreground rounded-bl-sm'
									)}>
										<pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
										{msg.outputTokens && (
											<p className="mt-1 text-xs opacity-40">
												{msg.inputTokens}↑ {msg.outputTokens}↓ tokens
											</p>
										)}
									</div>
									{msg.role === 'user' && (
										<div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
											<User className="w-4 h-4 text-muted-foreground" />
										</div>
									)}
								</div>
							) )}

							{/* Streaming */}
							{isStreaming && streamingContent && (
								<div className="flex gap-3 justify-start">
									<div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
										<Bot className="w-4 h-4 text-primary-foreground" />
									</div>
									<div className="max-w-2xl px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed bg-muted text-foreground">
										<pre className="whitespace-pre-wrap font-sans">{streamingContent}</pre>
										<span className="inline-block w-1.5 h-4 bg-primary ml-1 animate-pulse rounded-sm" />
									</div>
								</div>
							)}

							<div ref={messagesEndRef} />
						</div>
					</ScrollArea>

					<Separator />

					{/* Input */}
					<div className="px-6 py-4 bg-background">
						<div className="flex gap-3 items-end max-w-3xl mx-auto">
							<Textarea
								value={input}
								onChange={( e ) => setInput( e.target.value )}
								onKeyDown={handleKeyDown}
								placeholder="Ketik pesan... (Enter kirim, Shift+Enter baris baru)"
								rows={1}
								disabled={isStreaming}
								className="flex-1 resize-none min-h-11 max-h-50"
							/>
							<Button
								onClick={sendMessage}
								disabled={isStreaming || !input.trim()}
								size="icon"
								className="h-11 w-11 shrink-0"
							>
								<Send className="w-4 h-4" />
							</Button>
						</div>
						<p className="text-xs text-muted-foreground text-center mt-2">
              Enter untuk kirim · Shift+Enter untuk baris baru
						</p>
					</div>

				</main>
			</div>
		</TooltipProvider>
	)
}