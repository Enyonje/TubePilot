import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getOrgContext } from '@tubepilot/auth';
import { prisma } from '@tubepilot/database';
import WorkspaceSwitcher from '../../components/WorkspaceSwitcher';

export default async function DashboardPage() {
  const ctx = await getOrgContext(await headers());
  if (!ctx) redirect('/sign-in');

  const memberships = await prisma.member.findMany({
    where: { userId: ctx.user.id },
    include: { organization: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const workspaces = memberships.map((m) => ({ id: m.organization.id, name: m.organization.name, role: m.role }));
  const active = workspaces.find((w) => w.id === ctx.organizationId);

  return (
    <>
      <h1>Welcome, {ctx.user.name}</h1>
      <p>
        Active workspace: <strong>{active?.name ?? 'none'}</strong>
        {ctx.role && <span className="muted"> · your role: {ctx.role}</span>}
      </p>
      <WorkspaceSwitcher workspaces={workspaces} activeId={ctx.organizationId} />
    </>
  );
}
