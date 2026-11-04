// The caller commits the returned phase in the same transaction as finalize().
// Every external step is safe to replay if the process dies before that commit.
export async function publishStep(job, transport, finalize) {
  if (job.phase === 'validated') {
    await transport.store(job.config, job.banner);
    return 'stored';
  }
  if (job.phase === 'stored') {
    await transport.point({
      projectId: job.project_id,
      releaseId: job.release_id,
      configHash: job.banner.configHash,
      generation: String(job.generation),
      verifiedUntil: new Date(job.verified_until).toISOString(),
      allowedOrigins: ['https://' + job.domain],
    });
    return 'pointed';
  }
  if (job.phase === 'pointed') {
    await transport.invalidate(job.project_id);
    return 'invalidated';
  }
  if (job.phase === 'invalidated') {
    await finalize();
    return 'completed';
  }
  if (job.phase === 'completed') return 'completed';
  throw new Error('Unknown publication phase');
}
