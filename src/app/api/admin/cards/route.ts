import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'cards');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// GET - List all cards
export async function GET() {
    try {
        await requireAdmin();

        const cards = await prisma.card.findMany({
            where: { isActive: true },
            select: {
                id: true,
                filename: true,
                imageUrl: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, cards });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Upload new cards
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const formData = await request.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No files provided' },
                { status: 400 }
            );
        }

        // Ensure upload directory exists
        await mkdir(UPLOAD_DIR, { recursive: true });

        const uploadedCards = [];

        for (const file of files) {
            // Validate file type
            if (!ALLOWED_TYPES.includes(file.type)) {
                continue; // Skip invalid files
            }

            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                continue; // Skip large files
            }

            // Generate unique filename
            const ext = file.name.split('.').pop() || 'jpg';
            const filename = `${nanoid(12)}.${ext}`;
            const filepath = path.join(UPLOAD_DIR, filename);

            // Convert file to buffer and save
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filepath, buffer);

            // Create database record
            const card = await prisma.card.create({
                data: {
                    filename,
                    imageUrl: `/cards/${filename}`,
                    uploaderId: user.id,
                },
                select: {
                    id: true,
                    filename: true,
                    imageUrl: true,
                    createdAt: true,
                },
            });

            uploadedCards.push(card);
        }

        if (uploadedCards.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No valid files were uploaded' },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true, cards: uploadedCards });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }
}
