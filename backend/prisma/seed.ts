import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INTERESTS = [
  { name: 'Coding', emoji: '💻', category: 'TECH' as const },
  { name: 'UI/UX', emoji: '🎨', category: 'TECH' as const },
  { name: 'AI/ML', emoji: '🤖', category: 'TECH' as const },
  { name: 'Photography', emoji: '📷', category: 'ARTS' as const },
  { name: 'Filmmaking', emoji: '🎬', category: 'ARTS' as const },
  { name: 'Dance', emoji: '💃', category: 'ARTS' as const },
  { name: 'Music', emoji: '🎵', category: 'MUSIC' as const },
  { name: 'Guitar', emoji: '🎸', category: 'MUSIC' as const },
  { name: 'Singing', emoji: '🎤', category: 'MUSIC' as const },
  { name: 'Cricket', emoji: '🏏', category: 'SPORTS' as const },
  { name: 'Football', emoji: '⚽', category: 'SPORTS' as const },
  { name: 'Badminton', emoji: '🏸', category: 'SPORTS' as const },
  { name: 'Basketball', emoji: '🏀', category: 'SPORTS' as const },
  { name: 'Chess', emoji: '♟️', category: 'GAMING' as const },
  { name: 'Gaming', emoji: '🎮', category: 'GAMING' as const },
  { name: 'Esports', emoji: '🕹️', category: 'GAMING' as const },
  { name: 'Anime', emoji: '🌸', category: 'OTHER' as const },
  { name: 'Books', emoji: '📚', category: 'ACADEMIA' as const },
  { name: 'Writing', emoji: '✍️', category: 'ARTS' as const },
  { name: 'Poetry', emoji: '📝', category: 'ARTS' as const },
  { name: 'Traveling', emoji: '✈️', category: 'TRAVEL' as const },
  { name: 'Trekking', emoji: '🥾', category: 'TRAVEL' as const },
  { name: 'Cooking', emoji: '🍳', category: 'FOOD' as const },
  { name: 'Baking', emoji: '🧁', category: 'FOOD' as const },
  { name: 'Fitness', emoji: '💪', category: 'SPORTS' as const },
  { name: 'Yoga', emoji: '🧘', category: 'SPORTS' as const },
  { name: 'Comedy', emoji: '😂', category: 'SOCIAL' as const },
  { name: 'Theatre', emoji: '🎭', category: 'ARTS' as const },
  { name: 'Painting', emoji: '🖌️', category: 'ARTS' as const },
  { name: 'Astronomy', emoji: '🔭', category: 'ACADEMIA' as const },
  { name: 'Finance', emoji: '💰', category: 'ACADEMIA' as const },
  { name: 'Entrepreneurship', emoji: '🚀', category: 'SOCIAL' as const },
  { name: 'Debate', emoji: '🎙️', category: 'SOCIAL' as const },
  { name: 'MUNs', emoji: '🌐', category: 'SOCIAL' as const },
  { name: 'Volunteering', emoji: '🤝', category: 'SOCIAL' as const },
  { name: 'Fashion', emoji: '👗', category: 'OTHER' as const },
  { name: 'Memes', emoji: '😆', category: 'SOCIAL' as const },
  { name: 'K-Pop', emoji: '🎵', category: 'MUSIC' as const },
  { name: 'Hip-Hop', emoji: '🎧', category: 'MUSIC' as const },
  { name: 'EDM', emoji: '🎶', category: 'MUSIC' as const },
  { name: 'Café-hopping', emoji: '☕', category: 'FOOD' as const },
  { name: 'Road Trips', emoji: '🚗', category: 'TRAVEL' as const },
  { name: 'Study Groups', emoji: '📖', category: 'ACADEMIA' as const },
  { name: 'Research', emoji: '🔬', category: 'ACADEMIA' as const },
];

const COMMUNITIES = [
  { name: 'Campus Coders', description: 'For students who love building things', category: 'TECH' },
  { name: 'Photography Club', description: 'Share your campus shots and learn together', category: 'ARTS' },
  { name: 'Music Lovers', description: 'From classical to EDM, all genres welcome', category: 'MUSIC' },
  { name: 'Cricket Maniacs', description: 'Live match discussions and pickup games', category: 'SPORTS' },
  { name: 'Book Worms', description: 'Monthly book clubs and reading lists', category: 'ACADEMIA' },
  { name: 'Startup Builders', description: 'Founders, dreamers, and hustlers', category: 'SOCIAL' },
  { name: 'Gaming Arena', description: 'Tournaments, tips, and team-ups', category: 'GAMING' },
  { name: 'Foodies Unite', description: 'Best spots near campus and recipes', category: 'FOOD' },
];

async function main() {
  console.log('Seeding database...');

  // Seed interests
  for (const interest of INTERESTS) {
    await prisma.interest.upsert({
      where: { name: interest.name },
      create: interest,
      update: interest,
    });
  }
  console.log(`Seeded ${INTERESTS.length} interests`);

  // Seed communities
  for (const community of COMMUNITIES) {
    const interest = await prisma.interest.findFirst({
      where: { category: community.category as Parameters<typeof prisma.interest.findFirst>[0]['where'] extends { category?: infer C } ? C : never },
    });
    await prisma.community.create({
      data: {
        name: community.name,
        description: community.description,
        interestId: interest?.id,
        isPublic: true,
      },
    }).catch(() => {});
  }
  console.log(`Seeded ${COMMUNITIES.length} communities`);

  console.log('Database seeded successfully!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
