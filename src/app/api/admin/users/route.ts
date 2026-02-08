import { NextResponse } from 'next/server';
import { requireAdmin, hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - List all users
export async function GET() {
    try {
        await requireAdmin();

        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, users });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create new user
export async function POST(request: Request) {
    try {
        await requireAdmin();

        const body = await request.json();
        const { username, password, role } = body;

        // Validate
        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: 'Username and password are required' },
                { status: 400 }
            );
        }

        if (username.length < 3) {
            return NextResponse.json(
                { success: false, error: 'Username must be at least 3 characters' },
                { status: 400 }
            );
        }

        if (password.length < 4) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 4 characters' },
                { status: 400 }
            );
        }

        // Check if username exists
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Username already exists' },
                { status: 400 }
            );
        }

        // Create user
        const hashedPassword = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: role === 'ADMIN' ? 'ADMIN' : 'PLAYER',
            },
            select: {
                id: true,
                username: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
        console.error('Create user error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
