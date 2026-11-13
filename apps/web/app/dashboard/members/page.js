import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getOrgContext, hasRolePermission } from '@tubepilot/auth';
import { prisma } from '@tubepilot/database';
import MembersClient from '../../../components/MembersClient';

export default async function MembersPage() {
  const ctx = await getOrgContext(await headers());
  if (!ctx) redirect('/sign-in');
  if (!ctx.organizationId) return <p>No active workspace.</p>;

  const [members, invitations] = await Promise.all([
    prisma.member.findMany({
      where: { organizationId: ctx.organizationId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.invitation.findMany({
      where: { organizationId: ctx.organizationId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <>
      <h1>Members</h1>
      <MembersClient
        currentUserId={ctx.user.id}
        canInvite={hasRolePermission(ctx.role, 'invitation', 'create')}
        canManage={hasRolePermission(ctx.role, 'member', 'update')}
        members={members.map((m) => ({ id: m.id, userId: m.userId, role: m.role, name: m.user.name, email: m.user.email }))}
        invitations={invitations.map((i) => ({ id: i.id, email: i.email, role: i.role, expiresAt: i.expiresAt.toISOString() }))}
      />
    </>
  );
}
