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
		console.error( '[GET /api/chat/[id]]', error )
		return Response.json( { error: 'Failed to fetch' }, { status: 500 } )
	}
}

export async function DELETE(
	_req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		await prisma.conversation.delete( { where: { id: params.id } } )
		return Response.json( { success: true } )
	} catch ( error ) {
		console.error( '[DELETE /api/chat/[id]]', error )
		return Response.json( { error: 'Failed to delete' }, { status: 500 } )
	}
}