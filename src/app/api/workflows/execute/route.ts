import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { workflowId } = body

  if (!workflowId) {
    return NextResponse.json(
      { error: "workflowId is required" },
      { status: 400 }
    )
  }

  // Fetch the workflow
  const { data: workflow, error: workflowError } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", workflowId)
    .eq("user_id", user.id)
    .single()

  if (workflowError || !workflow) {
    return NextResponse.json(
      { error: "Workflow not found" },
      { status: 404 }
    )
  }

  // Create a workflow_run record
  const { data: run, error: runError } = await supabase
    .from("workflow_runs")
    .insert({
      user_id: user.id,
      workflow_id: workflowId,
      status: "pending" as const,
      progress: 0,
      result: {},
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (runError || !run) {
    return NextResponse.json(
      { error: "Failed to create workflow run" },
      { status: 500 }
    )
  }

  // Try to queue the job via BullMQ
  try {
    const { workflowQueue } = await import("@/lib/queue")
    await workflowQueue.add("execute", {
      workflowId: workflow.id,
      runId: run.id,
      userId: user.id,
      steps: workflow.steps,
    })

    return NextResponse.json({
      runId: run.id,
      status: "queued",
    })
  } catch {
    // Redis/BullMQ not available - return the run ID with a message
    return NextResponse.json({
      runId: run.id,
      status: "queued",
      message:
        "Job created but queue worker is not available. Configure REDIS_URL to enable background processing.",
    })
  }
}
