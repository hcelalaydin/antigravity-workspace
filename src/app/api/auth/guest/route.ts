import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - Quick guest login (no password required)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username } = body;

        // Validate input
        if (!username || username.trim().length < 2) {
            return NextResponse.json(
                { success: false, error: 'Username must be at least 2 characters' },
                { status: 400 }
            );
        }

        const cleanUsername = username.trim().substring(0, 20); // Max 20 chars

        // Check if username exists
        let user = await prisma.user.findUnique({
            where: { username: cleanUsername },
        });

        if (user) {
            // If it's a guest user, allow login
            if (user.isGuest) {
                // Generate token for existing guest
                const token = generateToken({
                    userId: user.id,
                    username: user.username,
                    role: user.role,
                });

                const response = NextResponse.json({
                    success: true,
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role,
                    },
                });

                response.cookies.set('auth_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24, // 1 day for guests
                    path: '/',
                });

                return response;
            } else {
                // Regular user - need password
                return NextResponse.json(
                    { success: false, error: 'This username requires a password. Use login page.' },
                    { status: 400 }
                );
            }
        }

        // Create new guest user
        user = await prisma.user.create({
            data: {
                username: cleanUsername,
                password: '', // No password for guests
                role: 'PLAYER',
                isGuest: true,
            },
        });

        // Generate token
        const token = generateToken({
            userId: user.id,
            username: user.username,
            role: user.role,
        });

        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        });

        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 1 day for guests
            path: '/',
        });

        return response;
    } catch (error: any) {
        // Handle unique constraint error (race condition)
        if (error?.code === 'P2002') {
            return NextResponse.json(
                { success: false, error: 'Username already taken. Try another.' },
                { status: 400 }
            );
        }
        console.error('Guest login error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
