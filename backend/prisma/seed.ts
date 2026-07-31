import 'dotenv/config';
import { PrismaClient, InterestCategory } from '@prisma/client';
import bcrypt from 'bcrypt';
import { encrypt } from '../src/utils/encryption';

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
      where: { category: community.category as InterestCategory },
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

  // Seed Users for Local Testing
  console.log('Seeding mock users...');
  const mockPasswordHash = await bcrypt.hash('password123', 12);

  const mockUsersData = [
    {
      email: 'aarav@college.edu',
      name: 'Aarav Mehta',
      username: 'aarav_mehta',
      gender: 'MALE' as const,
      lookingFor: ['FRIENDS', 'NETWORKING'] as any,
      collegeName: 'IIT Delhi',
      collegeEmail: 'aarav@iitd.ac.in',
      bio: 'Deep learning researcher. Looking for a study buddy and gym partner.',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80',
      interests: ['Coding', 'AI/ML', 'Fitness', 'Cricket']
    },
    {
      email: 'ananya@college.edu',
      name: 'Ananya Roy',
      username: 'ananya_roy',
      gender: 'FEMALE' as const,
      lookingFor: ['DATING', 'FRIENDS'] as any,
      collegeName: 'IIT Delhi',
      collegeEmail: 'ananya@iitd.ac.in',
      bio: "Design student who loves painting, coffee, and EDM. Let's explore cafe spots!",
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      interests: ['UI/UX', 'Painting', 'EDM', 'Café-hopping', 'Photography']
    },
    {
      email: 'rohan@college.edu',
      name: 'Rohan Sharma',
      username: 'rohan_sharma',
      gender: 'MALE' as const,
      lookingFor: ['STUDY_BUDDY', 'FRIENDS'] as any,
      collegeName: 'IIT Delhi',
      collegeEmail: 'rohan@iitd.ac.in',
      bio: 'Acoustic guitar player, MUN enthusiast. Doing a minor in Finance.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      interests: ['Guitar', 'Music', 'Finance', 'MUNs']
    },
    {
      email: 'diya@college.edu',
      name: 'Diya Kapoor',
      username: 'diya_kapoor',
      gender: 'FEMALE' as const,
      lookingFor: ['FRIENDS', 'STUDY_BUDDY'] as any,
      collegeName: 'IIT Delhi',
      collegeEmail: 'diya@iitd.ac.in',
      bio: "Pre-final year student. Passionate about startups and UI/UX design. Let's connect!",
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
      interests: ['UI/UX', 'Entrepreneurship', 'Books', 'Traveling']
    },
    {
      email: 'kabir@college.edu',
      name: 'Kabir Singh',
      username: 'kabir_singh',
      gender: 'MALE' as const,
      lookingFor: ['FRIENDS', 'NETWORKING'] as any,
      collegeName: 'IIT Delhi',
      collegeEmail: 'kabir@iitd.ac.in',
      bio: 'Web developer & e-sports gamer. Up for badminton matches anytime.',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      interests: ['Coding', 'Gaming', 'Esports', 'Badminton']
    }
  ];

  for (const item of mockUsersData) {
    const { interests, ...userData } = item;
    let user = await prisma.user.findUnique({ where: { email: userData.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          username: userData.username,
          passwordHash: mockPasswordHash,
          gender: userData.gender,
          lookingFor: userData.lookingFor,
          collegeName: userData.collegeName,
          collegeEmail: encrypt(userData.collegeEmail),
          bio: userData.bio,
          avatarUrl: userData.avatarUrl,
          dateOfBirth: encrypt('2004-01-01'),
          isVerified: true,
          verifiedAt: new Date(),
          isActive: true,
        }
      });

      await prisma.userPrivacy.upsert({
        where: { userId: user.id },
        update: { discoverableBy: 'EVERYONE' },
        create: {
          userId: user.id,
          discoverableBy: 'EVERYONE',
        }
      });

      for (const name of interests) {
        const inst = await prisma.interest.findUnique({ where: { name } });
        if (inst) {
          await prisma.userInterest.upsert({
            where: {
              userId_interestId: {
                userId: user.id,
                interestId: inst.id,
              }
            },
            update: {},
            create: {
              userId: user.id,
              interestId: inst.id,
            }
          });
        }
      }
    }
  }
  console.log(`Seeded ${mockUsersData.length} mock users`);

  // Happening Around You — see BUILD_PLAN.md 1.9. These three are generic
  // placeholders (orientation / club fair / prom) safe to seed as real rows;
  // Shivansh owns replacing/adding real dates, venues and events before and
  // during arrival week. Scoped to the real campus name, not the "IIT Delhi"
  // mock-user placeholder used above — this seed is meant to be visible to a
  // genuinely BITS-verified account, not just other mock users.
  const REAL_CAMPUS = 'BITS Pilani — Hyderabad Campus';
  const now = new Date();
  const happeningSeed = [
    { title: 'Orientation Week kicks off', subtitle: 'Main Auditorium', emoji: '🎉', accent: '#6C3DFF', startAt: new Date(now.getTime() + 1 * 86400000) },
    { title: 'Club & Society Fair', subtitle: 'Central Lawn', emoji: '🎪', accent: '#FF6B9D', startAt: new Date(now.getTime() + 3 * 86400000) },
    { title: "Freshers' Night is coming", subtitle: 'Find your crew', emoji: '💃', accent: '#F59E0B', cta: 'Open Prom Radar', linkTo: '/app/prom', startAt: new Date(now.getTime() + 21 * 86400000) },
  ];
  const existingHappening = await prisma.happeningEvent.count({ where: { collegeName: REAL_CAMPUS } });
  if (existingHappening === 0) {
    await prisma.happeningEvent.createMany({
      data: happeningSeed.map((e) => ({ ...e, collegeName: REAL_CAMPUS })),
    });
    console.log(`Seeded ${happeningSeed.length} placeholder Happening events — replace with real dates/venues before launch`);
  }

  console.log('Database seeded successfully!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
