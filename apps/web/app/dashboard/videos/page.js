import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getOrgContext, hasRolePermission } from '@tubepilot/auth';
import { prisma } from '@tubepilot/database';
import NewVideoForm from '../../../components/NewVideoForm';

export const dynamic = 'force-dynamic';

export default async function VideosPage() {
  const ctx = await getOrgContext(await headers());
  if (!ctx) redirect('/sign-in');
  if (!ctx.organizationId) return <p>No active workspace.</p>;

  const [videos, channels] = await Promise.all([
    prisma.video.findMany({
      where: { channel: { organizationId: ctx.organizationId } },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: { channel: { select: { title: true } } },
    }),
    prisma.channel.findMany({ where: { organizationId: ctx.organizationId }, select: { id: true, title: true }, orderBy: { createdAt: 'asc' } }),
  ]);

  return (
    <>
      <h1>Videos</h1>
      <NewVideoForm channels={channels} canCreate={hasRolePermission(ctx.role, 'video', 'create')} />
      {videos.length === 0 ? (
        <p className="muted">No videos yet.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Video</th><th>Channel</th><th>Status</th><th>Updated</th></tr>
          </thead>
          <tbody>
            {videos.map((v) => (
              <tr key={v.id}>
                <td><Link href={`/dashboard/videos/${v.id}`}>{v.title}</Link></td>
                <td className="muted">{v.channel.title}</td>
                <td>{v.status}</td>
                <td className="muted">{v.updatedAt.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
