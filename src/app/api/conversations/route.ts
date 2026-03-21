import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
	try {
		const conversations = await prisma.conversation.findMany( {
			orderBy: { updatedAt: 'desc' },
			take: 50,
			include: {
				_count: { select: { messages: true } },
				messages: {
					orderBy: { createdAt: 'desc' },
					take: 1,
					select: { content: true, role: true, createdAt: true },
				},
			},
		} )
		return Response.json( conversations )
	} catch ( error ) {
		console.error( '[GET /api/conversations]', error )
		return Response.json( { error: 'Failed to fetch conversations' }, { status: 500 } )
	}
}

export async function DELETE( req: NextRequest ) {
	try {
		const { searchParams } = new URL( req.url )
		const id = searchParams.get( 'id' )
		if ( !id ) return Response.json( { error: 'ID required' }, { status: 400 } )

		await prisma.conversation.delete( { where: { id } } )
		return Response.json( { success: true } )
	} catch ( error ) {
		console.error( '[DELETE /api/conversations]', error )
		return Response.json( { error: 'Failed to delete conversation' }, { status: 500 } )
	}
}