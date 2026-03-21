import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
	_req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const conversation = await prisma.conversation.findUnique( {
			where: { id: params.id },
			include: {
				messages: {
					orderBy: { createdAt: 'asc' },
				},
			},
		} )
		if ( !conversation ) return Response.json( { error: 'Not found' }, { status: 404 } )
		return Response.json( conversation )
	} catch ( error ) {
		console.error( '[GET /api/conversations/[id]]', error )
		return Response.json( { error: 'Failed to fetch conversation' }, { status: 500 } )
	}
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { title, systemPrompt } = await req.json()
		const updated = await prisma.conversation.update( {
			where: { id: params.id },
			data: {
				...( title && { title } ),
				...( systemPrompt !== undefined && { systemPrompt } ),
			},
		} )
		return Response.json( updated )
	} catch ( error ) {
		console.error( '[PATCH /api/conversations/[id]]', error )
		return Response.json( { error: 'Failed to update conversation' }, { status: 500 } )
	}
}