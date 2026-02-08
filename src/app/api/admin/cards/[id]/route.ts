import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';

// DELETE - Delete a card
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin();

        const { id } = await params;

        // Find card
        const card = await prisma.card.findUnique({ where: { id } });
        if (!card) {
            return NextResponse.json(
                { success: false, error: 'Card not found' },
                { status: 404 }
            );
        }

        // Delete file from filesystem
        try {
            const filepath = path.join(process.cwd(), 'public', 'cards', card.filename);
            await unlink(filepath);
        } catch (err) {
            // File might not exist, continue anyway
            console.warn('Could not delete file:', err);
        }

        // Soft delete from database (set isActive to false)
        await prisma.card.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
        console.error('Delete card error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
