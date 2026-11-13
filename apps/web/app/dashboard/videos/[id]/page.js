import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getOrgContext, hasRolePermission } from '@tubepilot/auth';
import { enabledTtsProviders, getEnv } from '@tubepilot/config';
import { prisma } from '@tubepilot/database';
import VideoActions from '../../../../components/VideoActions';
import RenderPanel from '../../../../components/RenderPanel';
import VoicePanel from '../../../../components/VoicePanel';

export const dynamic = 'force-dynamic';

export default async function VideoPage({ params }) {
  const { id } = await params;
  const ctx = await getOrgContext(await headers());
  if (!ctx) redirect('/sign-in');
  if (!ctx.organizationId) return <p>No active workspace.</p>;

  // Tenant scope: only videos whose channel belongs to the active workspace.
  const video = await prisma.video.findFirst({
    where: { id, channel: { organizationId: ctx.organizationId } },
    include: { channel: { select: { title: true } } },
  });
  if (!video) notFound();

  const [latest, versions, events] = await Promise.all([
    prisma.scriptVersion.findFirst({ where: { videoId: id }, orderBy: { version: 'desc' } }),
    prisma.scriptVersion.findMany({
      where: { videoId: id }, orderBy: { version: 'desc' },
      select: { id: true, version: true, source: true, provider: true, model: true, costUsd: true, createdAt: true },
    }),
    prisma.videoEvent.findMany({ where: { videoId: id }, orderBy: { createdAt: 'desc' }, take: 30 }),
  ]);

  const [stage, voiceAssets] = await Promise.all([
    prisma.productionStage.findUnique({ where: { videoId_stage: { videoId: id, stage: 'voice' } } }),
    prisma.mediaAsset.findMany({ where: { videoId: id, kind: 'voice_segment', active: true }, orderBy: { seq: 'asc' } }),
  ]);
  const [renderStage, renderAssets] = await Promise.all([
    prisma.productionStage.findUnique({ where: { videoId_stage: { videoId: id, stage: 'render' } } }),
    prisma.mediaAsset.findMany({ where: { videoId: id, kind: { in: ['render', 'subtitles'] }, active: true } }),
  ]);
  const renderAsset = renderAssets.find((a) => a.kind === 'render');
  const subtitleAsset = renderAssets.find((a) => a.kind === 'subtitles');
  const env = getEnv();
  const ttsProviders = enabledTtsProviders(env).map((name) => ({ name, defaultVoice: env[`TTS_${name.toUpperCase()}_VOICE`] }));

  const script = latest?.data?.script;
  const quality = latest?.data?.quality;
  const brief = video.brief ?? {};

  return (
    <>
      <p className="muted"><Link href="/dashboard/videos">← Videos</Link></p>
      <h1>{video.title}</h1>
      <p>
        <strong>{video.status}</strong> <span className="muted">· {video.channel.title} · {brief.targetMinutes ?? '?'} min target</span>
      </p>
      {video.status === 'FAILED' && <p className="error">Generation failed: {video.failureReason}</p>}
      {video.status === 'REJECTED' && <p className="card">Rejected: {video.failureReason}</p>}
      {video.status === 'SCRIPTING' && <p className="card">Writing the script… this page refreshes automatically.</p>}

      <VideoActions
        videoId={video.id}
        status={video.status}
        canGenerate={hasRolePermission(ctx.role, 'video', 'update')}
        canApprove={hasRolePermission(ctx.role, 'video', 'approve')}
        initialText={video.script ?? ''}
      />

      {['APPROVED', 'PRODUCING', 'RENDERED', 'PUBLISHED'].includes(video.status) && (
        <VoicePanel
          videoId={video.id}
          canGenerate={hasRolePermission(ctx.role, 'video', 'update')}
          providers={ttsProviders}
          stage={stage ? { state: stage.state, error: stage.error } : null}
          assets={voiceAssets.map((a) => ({ id: a.id, heading: a.meta?.heading ?? a.meta?.key ?? `Part ${a.seq + 1}`, durationMs: a.durationMs ?? 0, provider: a.provider, voice: a.meta?.voice ?? null }))}
          costUsd={voiceAssets.reduce((sum, a) => sum + Number(a.costUsd ?? 0), 0)}
        />
      )}

      {['PRODUCING', 'RENDERED', 'PUBLISHED'].includes(video.status) && (
        <RenderPanel
          videoId={video.id}
          canRender={hasRolePermission(ctx.role, 'video', 'update')}
          hasVoice={voiceAssets.length > 0}
          voiceBatchId={voiceAssets[0]?.batchId ?? null}
          stage={renderStage ? { state: renderStage.state, error: renderStage.error } : null}
          render={renderAsset ? { id: renderAsset.id, durationMs: renderAsset.durationMs ?? 0, bytes: renderAsset.bytes, voiceBatchId: renderAsset.meta?.voiceBatchId ?? null } : null}
          subtitlesId={subtitleAsset?.id ?? null}
        />
      )}

      {script && (
        <>
          {quality?.warnings?.length > 0 && (
            <div className="card">
              <strong>Review before approving</strong>
              <ul>{quality.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
            </div>
          )}
          {script.claimsToVerify?.length > 0 && (
            <div className="card">
              <strong>Facts to verify before publishing</strong>
              <ul>{script.claimsToVerify.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
          )}
          <h3>Title options</h3>
          <ul>{script.titleOptions.map((t) => <li key={t}>{t}</li>)}</ul>
          <h3>Hook</h3>
          <p>{script.hook}</p>
          <h3>Open loops</h3>
          <ul>{script.openLoops.map((l) => <li key={l}>{l}</li>)}</ul>
          {script.sections.map((s, i) => (
            <div key={i}>
              <h3>{s.heading}</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{s.narration}</p>
              {s.visualNotes && <p className="muted">Visuals: {s.visualNotes}</p>}
            </div>
          ))}
          <h3>Proof</h3>
          <p>{script.proof}</p>
          <h3>Cliffhanger</h3>
          <p>{script.cliffhanger}</p>
          <h3>Call to action</h3>
          <p>{script.cta}</p>
          <h3>Description</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{script.description}</p>
          <p className="muted">Tags: {script.tags.join(', ')}</p>
          {latest.data.edited && <p className="muted">The narration above the editor was edited by a person after generation; the structured sections show the original AI draft.</p>}
        </>
      )}

      {versions.length > 0 && (
        <>
          <h3>Versions</h3>
          <table>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id}>
                  <td>v{v.version}</td>
                  <td>{v.source}</td>
                  <td className="muted">{v.provider ? `${v.provider} / ${v.model}` : ''}</td>
                  <td className="muted">{v.costUsd != null ? `$${v.costUsd.toString()}` : ''}</td>
                  <td className="muted">{v.createdAt.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h3>Timeline</h3>
      <table>
        <tbody>
          {events.map((e) => (
            <tr key={e.id}>
              <td>{e.type}</td>
              <td className="muted">{e.createdAt.toLocaleString()}</td>
              <td className="muted">{e.payload?.reason ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
