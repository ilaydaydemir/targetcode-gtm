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
  const { actorId, input } = body

  if (!actorId) {
    return NextResponse.json(
      { error: "actorId is required" },
      { status: 400 }
    )
  }

  try {
    const { scraperQueue } = await import("@/lib/queue")
    const job = await scraperQueue.add("scrape", {
      actorId,
      input: input ?? {},
      userId: user.id,
    })

    return NextResponse.json({
      jobId: job.id,
      status: "queued",
    })
  } catch {
    return NextResponse.json(
      {
        error:
          "Queue service unavailable. Configure REDIS_URL to enable job queuing.",
      },
      { status: 503 }
    )
  }
}
