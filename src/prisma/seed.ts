import { PrismaClient, UserRole, TestimonyStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Create dummy user (subject)
    const user = await prisma.user.create({
        data: {
            id: randomUUID(),
            fullName: 'John Doe',
            email: 'john.doe@example.com',
            phone: '9999999999',
            role: UserRole.CONSUMER,
        },
    });

    console.log(`Created user: ${user.id} - ${user.fullName}`);

    // 2. Create dummy testimony authored by same user
    const testimony = await prisma.testimony.create({
        data: {
            id: randomUUID(),
            authorId: user.id,
            subjectId: user.id,
            content: 'This is a sample testimony for seeding purposes.',
            category: 'SERVICE_QUALITY',
            status: TestimonyStatus.PENDING,
            embedId: 'embed123sample', // simple static embedId for testing
        },
    });

    console.log(`Created testimony: ${testimony.id} - ${testimony.content}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
