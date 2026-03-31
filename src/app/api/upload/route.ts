import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { put, del } from '@vercel/blob'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string | null
    const incomeId = formData.get('incomeId') as string | null
    const expenseId = formData.get('expenseId') as string | null
    const milestoneId = formData.get('milestoneId') as string | null
    const category = (formData.get('category') as string) || 'receipt'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP and PDF files are allowed' }, { status: 400 })
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 })
    }

    let fileUrl: string
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN

    if (blobToken) {
      // Production: upload to Vercel Blob
      const blob = await put(`explore-interiors/${Date.now()}-${file.name}`, file, {
        access: 'private',
        token: blobToken,
      })
      fileUrl = blob.url
    } else {
      // Local dev: write to public/uploads
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const ext = file.name.split('.').pop() || 'bin'
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const uploadDir = join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadDir, { recursive: true })
      await writeFile(join(uploadDir, uniqueName), buffer)
      fileUrl = `/uploads/${uniqueName}`
    }

    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.name,
        fileUrl,
        fileType: file.type,
        fileSize: file.size,
        category,
        projectId,
        incomeId,
        expenseId,
        milestoneId,
      },
    })

    return NextResponse.json(attachment)
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing attachment ID' }, { status: 400 })
  }

  const attachment = await prisma.attachment.findUnique({ where: { id } })
  if (!attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  // Delete the file
  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    if (blobToken && attachment.fileUrl.startsWith('http')) {
      await del(attachment.fileUrl, { token: blobToken })
    } else {
      const filePath = join(process.cwd(), 'public', attachment.fileUrl)
      await unlink(filePath)
    }
  } catch {
    // File may already be deleted
  }

  await prisma.attachment.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
