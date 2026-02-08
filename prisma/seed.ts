import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    console.log('🌱 Seeding database...');

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create or update admin user
    const admin = await prisma.user.upsert({
        where: { username: adminUsername },
        update: {
            password: hashedPassword,
            role: 'ADMIN',
            isActive: true,
        },
        create: {
            username: adminUsername,
            password: hashedPassword,
            role: 'ADMIN',
            isActive: true,
        },
    });

    console.log(`✅ Admin user created/updated: ${admin.username}`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Role: ${admin.role}`);
    console.log('');
    console.log('🎴 Database seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
