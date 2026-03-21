import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

// Try to load a SQL adapter if available (recommended for Prisma v7)
async function buildAdapter() {
	const url = process.env.DATABASE_URL
	if ( !url ) return undefined

	try {
		const mod = await import( '@prisma/adapter-pg' )
		type AdapterCtor = new ( opts: { connectionString: string } ) => unknown
		const m = mod as { PrismaPg?: AdapterCtor; default?: AdapterCtor }
		const PrismaPgCtor = m.PrismaPg ?? m.default
		if ( PrismaPgCtor ) return new PrismaPgCtor( { connectionString: url } )
	} catch ( e ) {
		// adapter not installed
	}

	return undefined
}

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined
}

async function createPrismaClient() {
	// Prisma 7 with Query Compiler expects either an adapter or accelerateUrl.
	const adapter = await buildAdapter()
	const opts: Record<string, unknown> = { log: ['error'] }
	if ( adapter ) opts.adapter = adapter
	else if ( process.env.PRISMA_ACCELERATE_URL ) opts.accelerateUrl = process.env.PRISMA_ACCELERATE_URL
	else {
		throw new Error( 'Prisma client requires an adapter (e.g. @prisma/adapter-pg) or PRISMA_ACCELERATE_URL. Install an adapter or set PRISMA_ACCELERATE_URL.' )
	}

	return new PrismaClient( opts as unknown as ConstructorParameters<typeof PrismaClient>[0] )
}

// Use top-level await so callers receive a ready-to-use client instance.
const _prisma = globalForPrisma.prisma ?? await createPrismaClient()
if ( process.env.NODE_ENV !== 'production' ) globalForPrisma.prisma = _prisma

export const prisma = _prisma