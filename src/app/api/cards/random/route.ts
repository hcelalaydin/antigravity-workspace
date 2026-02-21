import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { shuffleArray } from '@/lib/utils';

// GET - Fetch random cards for home screen display
export async function GET() {
    try {
        // Fetch active cards and just their image URLs
        const activeCards = await prisma.card.findMany({
            where: { isActive: true },
            select: { imageUrl: true },
        });

        if (!activeCards || activeCards.length === 0) {
            return NextResponse.json({ success: true, cards: [] });
        }

        // Deduplicate cards by imageUrl
        const uniqueCards = [];
        const seenUrls = new Set();
        for (const card of activeCards) {
            if (!seenUrls.has(card.imageUrl)) {
                seenUrls.add(card.imageUrl);
                uniqueCards.push(card);
            }
        }

        // Shuffle out random cards
        const shuffled = shuffleArray(uniqueCards);

        // Take up to 5 cards for the display
        const randomSelection = shuffled.slice(0, 5).map(c => c.imageUrl);

        return NextResponse.json({ success: true, cards: randomSelection });
    } catch (error) {
        console.error('Fetch random cards error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
