import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing attachment id' }, { status: 400 })
    }

    const attachment = await prisma.attachment.findUnique({ where: { id } })
    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Fetch the file from Vercel Blob (or local path)
    const fileUrl = attachment.fileUrl.startsWith('http')
      ? attachment.fileUrl
      : `${request.nextUrl.origin}${attachment.fileUrl}`

    const res = await fetch(fileUrl)
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: 502 })
    }

    const blob = await res.blob()

    return new NextResponse(blob, {
      headers: {
        'Content-Type': attachment.fileType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
        'Content-Length': String(attachment.fileSize),
      },
    })
  } catch (err) {
    console.error('Download error:', err)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
