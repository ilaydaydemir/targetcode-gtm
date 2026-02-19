import { Worker, type Job } from "bullmq"
import { connection } from "@/lib/queue"
import { runApifyActor, getApifyRunResult } from "@/lib/apify"
import { anthropic, MODELS } from "@/lib/claude"
import { createClient } from "@supabase/supabase-js"
import type { Database, Json } from "@/lib/supabase/types"

interface WorkflowStep {
  type: "apify_scraper" | "enrichment" | "filter" | "ai_transform" | "save_contacts"
  config: Record<string, unknown>
}

interface WorkflowJobData {
  workflowId: string
  runId: string
  userId: string
  steps: WorkflowStep[]
}

// Create a service-role Supabase client for the worker
function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function updateRunStatus(
  runId: string,
  updates: {
    status?: "pending" | "running" | "completed" | "failed"
    progress?: number
    result?: Json
    error_message?: string | null
    completed_at?: string | null
  }
) {
  const supabase = getSupabase()
  await supabase.from("workflow_runs").update(updates).eq("id", runId)
}

async function executeApifyScraper(
  config: Record<string, unknown>
): Promise<unknown[]> {
  const actorId = config.actor_id as string
  if (!actorId) throw new Error("No actor_id specified for apify_scraper step")

  let inputConfig: Record<string, unknown> = {}
  if (typeof config.input_config === "string") {
    try {
      inputConfig = JSON.parse(config.input_config)
    } catch {
      throw new Error("Invalid JSON in apify_scraper input_config")
    }
  } else if (typeof config.input_config === "object" && config.input_config) {
    inputConfig = config.input_config as Record<string, unknown>
  }

  const runData = await runApifyActor(actorId, inputConfig)
  const runId = runData?.data?.id
  if (!runId) throw new Error("Failed to start Apify run")

  // Poll for completion
  for (let i = 0; i < 60; i++) {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    try {
      const results = await getApifyRunResult(runId)
      if (Array.isArray(results) && results.length > 0) {
        return results
      }
    } catch {
      // Still running
    }
  }

  throw new Error("Apify run timed out")
}

function executeFilter(
  data: unknown[],
  config: Record<string, unknown>
): unknown[] {
  const field = config.field as string
  const operator = config.operator as string
  const value = config.value as string

  if (!field || !operator) return data

  return data.filter((item) => {
    const record = item as Record<string, unknown>
    const fieldValue = record[field]

    switch (operator) {
      case "equals":
        return String(fieldValue) === value
      case "not_equals":
        return String(fieldValue) !== value
      case "contains":
        return String(fieldValue ?? "")
          .toLowerCase()
          .includes((value ?? "").toLowerCase())
      case "gt":
        return Number(fieldValue) > Number(value)
      case "lt":
        return Number(fieldValue) < Number(value)
      default:
        return true
    }
  })
}

async function executeAiTransform(
  data: unknown[],
  config: Record<string, unknown>
): Promise<unknown[]> {
  const prompt = config.prompt as string
  if (!prompt) throw new Error("No prompt specified for ai_transform step")

  const response = await anthropic.messages.create({
    model: MODELS.chat,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `${prompt}\n\nData to transform:\n${JSON.stringify(data, null, 2)}\n\nReturn the transformed data as a JSON array.`,
      },
    ],
  })

  const textBlock = response.content.find((block) => block.type === "text")
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude")
  }

  try {
    // Try to extract JSON from the response
    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(textBlock.text)
  } catch {
    throw new Error("Failed to parse AI transform response as JSON")
  }
}

async function executeSaveContacts(
  data: unknown[],
  config: Record<string, unknown>,
  userId: string
): Promise<{ saved: number }> {
  const supabase = getSupabase()
  const tagsRaw = config.tags as string | undefined
  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : []

  const contacts = data.map((item) => {
    const record = item as Record<string, unknown>
    return {
      user_id: userId,
      first_name: (record.first_name ?? record.firstName ?? null) as string | null,
      last_name: (record.last_name ?? record.lastName ?? null) as string | null,
      email: (record.email ?? null) as string | null,
      phone: (record.phone ?? null) as string | null,
      company: (record.company ?? record.organization ?? null) as string | null,
      job_title: (record.job_title ?? record.jobTitle ?? record.title ?? null) as string | null,
      linkedin_url: (record.linkedin_url ?? record.linkedinUrl ?? null) as string | null,
      website: (record.website ?? null) as string | null,
      location: (record.location ?? null) as string | null,
      source: "workflow" as const,
      tags,
    }
  })

  const { error } = await supabase.from("contacts").insert(contacts)
  if (error) throw new Error(`Failed to save contacts: ${error.message}`)

  return { saved: contacts.length }
}

async function processWorkflowJob(job: Job<WorkflowJobData>) {
  const { workflowId, runId, userId, steps } = job.data

  console.log(`[workflow.worker] Starting workflow ${workflowId}, run ${runId}`)

  const supabase = getSupabase()

  // Mark as running
  await updateRunStatus(runId, { status: "running", progress: 0 })

  let currentData: unknown[] = []
  const totalSteps = steps.length

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const stepProgress = Math.round(((i + 1) / totalSteps) * 100)

      console.log(
        `[workflow.worker] Executing step ${i + 1}/${totalSteps}: ${step.type}`
      )

      switch (step.type) {
        case "apify_scraper":
          currentData = await executeApifyScraper(step.config)
          break

        case "enrichment":
          // Placeholder - enrichment would call external APIs
          console.log(
            `[workflow.worker] Enrichment step: would enrich ${currentData.length} items via ${step.config.provider ?? "unknown"} provider`
          )
          break

        case "filter":
          currentData = executeFilter(currentData, step.config)
          break

        case "ai_transform":
          currentData = await executeAiTransform(currentData, step.config)
          break

        case "save_contacts":
          await executeSaveContacts(currentData, step.config, userId)
          break
      }

      await job.updateProgress(stepProgress)
      await updateRunStatus(runId, { progress: stepProgress })
    }

    // Mark as completed
    await updateRunStatus(runId, {
      status: "completed",
      progress: 100,
      result: {
        items_processed: currentData.length,
        items_found: currentData.length,
      },
      completed_at: new Date().toISOString(),
    })

    // Update workflow last_run_at
    await supabase
      .from("workflows")
      .update({
        last_run_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", workflowId)

    console.log(
      `[workflow.worker] Workflow ${workflowId} run ${runId} completed successfully`
    )

    return {
      items_processed: currentData.length,
      items_found: currentData.length,
    }
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred"

    console.error(
      `[workflow.worker] Workflow ${workflowId} run ${runId} failed:`,
      errorMessage
    )

    await updateRunStatus(runId, {
      status: "failed",
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })

    throw err
  }
}

// Only start the worker if Redis is configured
if (process.env.REDIS_URL) {
  const workflowWorker = new Worker<WorkflowJobData>(
    "workflow",
    processWorkflowJob,
    {
      connection,
      concurrency: 2,
    }
  )

  workflowWorker.on("completed", (job) => {
    console.log(
      `[workflow.worker] Job ${job.id} completed successfully`
    )
  })

  workflowWorker.on("failed", (job, error) => {
    console.error(
      `[workflow.worker] Job ${job?.id} failed:`,
      error.message
    )
  })

  console.log("[workflow.worker] Worker started and listening for jobs")

  module.exports = { workflowWorker }
}
