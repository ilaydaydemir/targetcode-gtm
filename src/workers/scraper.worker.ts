import { Worker, type Job } from "bullmq"
import { connection } from "@/lib/queue"
import { runApifyActor, getApifyRunResult } from "@/lib/apify"

interface ScraperJobData {
  actorId: string
  input: Record<string, unknown>
  userId: string
}

async function pollForCompletion(
  runId: string,
  job: Job<ScraperJobData>,
  maxAttempts = 60,
  intervalMs = 5000
): Promise<unknown[]> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs))

    const progress = Math.min(
      10 + Math.round((attempt / maxAttempts) * 80),
      90
    )
    await job.updateProgress(progress)

    try {
      const results = await getApifyRunResult(runId)
      if (Array.isArray(results) && results.length > 0) {
        return results
      }
    } catch {
      // Run not yet complete, keep polling
    }
  }

  throw new Error("Apify run timed out waiting for completion")
}

async function processScraperJob(job: Job<ScraperJobData>) {
  const { actorId, input } = job.data

  console.log(`[scraper.worker] Starting job ${job.id} for actor ${actorId}`)

  await job.updateProgress(5)

  // Start the Apify actor run
  const runData = await runApifyActor(actorId, input)
  const runId = runData?.data?.id

  if (!runId) {
    throw new Error("Failed to start Apify actor run - no run ID returned")
  }

  await job.updateProgress(10)

  // Poll for completion
  const results = await pollForCompletion(runId, job)

  await job.updateProgress(100)

  console.log(
    `[scraper.worker] Job ${job.id} completed with ${results.length} results`
  )

  return {
    actorId,
    runId,
    items_found: results.length,
    results,
  }
}

// Only start the worker if Redis is configured
if (process.env.REDIS_URL) {
  const scraperWorker = new Worker<ScraperJobData>(
    "scraper",
    processScraperJob,
    {
      connection,
      concurrency: 3,
    }
  )

  scraperWorker.on("completed", (job) => {
    console.log(`[scraper.worker] Job ${job.id} completed successfully`)
  })

  scraperWorker.on("failed", (job, error) => {
    console.error(
      `[scraper.worker] Job ${job?.id} failed:`,
      error.message
    )
  })

  console.log("[scraper.worker] Worker started and listening for jobs")

  // Export for external reference
  module.exports = { scraperWorker }
}
