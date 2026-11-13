import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getOrgContext, hasRolePermission } from '@tubepilot/auth';
import { prisma } from '@tubepilot/database';
import TopicsClient from '../../../components/TopicsClient';

export const dynamic = 'force-dynamic';

export default async function TopicsPage({ searchParams }) {
  const ctx = await getOrgContext(await headers());
  if (!ctx) redirect('/sign-in');
  if (!ctx.organizationId) return <p>No active workspace.</p>;
  const sp = await searchParams;

  const channels = await prisma.channel.findMany({
    where: { organizationId: ctx.organizationId },
    select: { id: true, title: true, niche: true, assumedRpmUsd: true },
    orderBy: { createdAt: 'asc' },
  });
  if (channels.length === 0) {
    return (
      <>
        <h1>Topics</h1>
        <p className="card">Create a channel profile first: <Link href="/dashboard/channels">Channels</Link>.</p>
      </>
    );
  }
  const channel = channels.find((c) => c.id === sp.channel) ?? channels[0];

  const [topics, runs] = await Promise.all([
    prisma.topic.findMany({
      where: { channelId: channel.id, status: { in: ['NEW', 'USED'] } },
      orderBy: [{ opportunityScore: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    }),
    prisma.researchRun.findMany({ where: { channelId: channel.id }, orderBy: { createdAt: 'desc' }, take: 5 }),
  ]);

  return (
    <>
      <h1>Topics</h1>
      <p className="row">
        {channels.map((c) => (
          <Link key={c.id} href={`/dashboard/topics?channel=${c.id}`}>
            <button className={c.id === channel.id ? 'primary' : ''}>{c.title}</button>
          </Link>
        ))}
      </p>
      <TopicsClient
        channel={{ id: channel.id, title: channel.title, niche: channel.niche, rpm: channel.assumedRpmUsd }}
        canRun={hasRolePermission(ctx.role, 'research', 'run')}
        canEditChannel={hasRolePermission(ctx.role, 'channel', 'update')}
        canCreateVideo={hasRolePermission(ctx.role, 'video', 'create')}
        runs={runs.map((r) => ({ id: r.id, status: r.status, requested: r.requested, researched: r.researched, note: r.note, error: r.error, createdAt: r.createdAt.toISOString() }))}
        topics={topics.map((t) => ({
          id: t.id,
          title: t.title,
          rationale: t.rationale,
          status: t.status,
          score: t.opportunityScore,
          demand: t.components?.demandScore ?? null,
          competition: t.competition,
          virality: t.viralityScore,
          lowSample: Boolean(t.components?.lowSample),
          revenue: t.components?.estimatedMonthlyRevenueUsd ?? null,
          sample: t.signals?.sample ?? 0,
          viewsPerDay: t.signals?.medianViewsPerDay ?? 0,
          largeShare: t.signals?.shareLargeChannels ?? null,
          topVideos: t.signals?.topVideos ?? [],
        }))}
      />
    </>
  );
}
