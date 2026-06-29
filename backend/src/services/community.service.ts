import { prisma } from '../utils/prisma';

export const CommunityService = {
  async list(userId: string, filter?: string) {
    return prisma.community.findMany({
      where: filter && filter !== 'All' ? {
        OR: [
          { name: { contains: filter, mode: 'insensitive' } },
        ],
      } : undefined,
      include: {
        _count: { select: { members: true } },
        members: { where: { userId }, select: { role: true } },
        interest: true,
      },
      orderBy: { memberCount: 'desc' },
      take: 50,
    });
  },

  async join(communityId: string, userId: string) {
    await prisma.$transaction([
      prisma.communityMember.create({ data: { communityId, userId } }),
      prisma.community.update({ where: { id: communityId }, data: { memberCount: { increment: 1 } } }),
    ]);
    return { message: 'Joined' };
  },

  async leave(communityId: string, userId: string) {
    await prisma.$transaction([
      prisma.communityMember.delete({ where: { communityId_userId: { communityId, userId } } }),
      prisma.community.update({ where: { id: communityId }, data: { memberCount: { decrement: 1 } } }),
    ]);
    return { message: 'Left' };
  },

  async getPosts(communityId: string, userId: string, cursor?: string) {
    const posts = await prisma.post.findMany({
      where: { communityId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, username: true } },
        likes: { where: { userId }, select: { userId: true } },
        _count: { select: { comments: true, likes: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 21,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = posts.length > 20;
    return { posts: posts.slice(0, 20), nextCursor: hasMore ? posts[19]?.id : null };
  },

  async createPost(communityId: string, authorId: string, content: string, mediaUrls: string[]) {
    const membership = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: authorId } },
    });
    if (!membership) throw new Error('NOT_MEMBER');
    return prisma.post.create({ data: { communityId, authorId, content, mediaUrls } });
  },

  async likePost(postId: string, userId: string) {
    const existing = await prisma.postLike.findUnique({ where: { postId_userId: { postId, userId } } });
    if (existing) {
      await prisma.$transaction([
        prisma.postLike.delete({ where: { postId_userId: { postId, userId } } }),
        prisma.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } }),
      ]);
      return { liked: false };
    }
    await prisma.$transaction([
      prisma.postLike.create({ data: { postId, userId } }),
      prisma.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } }),
    ]);
    return { liked: true };
  },

  async addComment(postId: string, authorId: string, content: string) {
    const [comment] = await prisma.$transaction([
      prisma.comment.create({ data: { postId, authorId, content } }),
      prisma.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } }),
    ]);
    return comment;
  },
};
