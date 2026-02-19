import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { jobId } = await params

  if (!jobId) {
    return NextResponse.json(
      { error: "jobId is required" },
      { status: 400 }
    )
  }

  try {
    const { scraperQueue } = await import("@/lib/queue")
    const job = await scraperQueue.getJob(jobId)

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      )
    }

    const state = await job.getState()
    const progress = job.progress

    return NextResponse.json({
      status: state,
      progress: typeof progress === "number" ? progress : 0,
      result: job.returnvalue ?? null,
    })
  } catch {
    // Queue not available - return mock status
    return NextResponse.json({
      status: "unknown",
      progress: 0,
      result: null,
      message:
        "Queue service unavailable. Configure REDIS_URL to enable job status tracking.",
    })
  }
}
