"use client"

import { useEffect, useRef, useState } from "react"
import { Play, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { WorkflowRun } from "@/hooks/useWorkflows"

interface WorkflowRunnerProps {
  runs: WorkflowRun[]
  onExecute: () => void
}

const STATUS_CONFIG: Record<
  string,
  { color: string; icon: React.ElementType; label: string }
> = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending" },
  running: { color: "bg-blue-100 text-blue-800 animate-pulse", icon: Loader2, label: "Running" },
  completed: { color: "bg-green-100 text-green-800", icon: CheckCircle2, label: "Completed" },
  failed: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Failed" },
}

function formatTimestamp(ts: string | null): string {
  if (!ts) return "-"
  return new Date(ts).toLocaleString()
}

export function WorkflowRunner({ runs, onExecute }: WorkflowRunnerProps) {
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
  const [executing, setExecuting] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const hasRunningJobs = runs.some(
    (r) => r.status === "running" || r.status === "pending"
  )

  useEffect(() => {
    if (hasRunningJobs) {
      intervalRef.current = setInterval(() => {
        // Parent component should re-fetch runs;
        // this triggers a re-render cycle via the runs prop change
      }, 3000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [hasRunningJobs])

  const handleExecute = async () => {
    try {
      setExecuting(true)
      await onExecute()
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Workflow Runs</h3>
        <Button onClick={handleExecute} disabled={executing}>
          {executing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {executing ? "Starting..." : "Run Workflow"}
        </Button>
      </div>

      {runs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No runs yet. Click &quot;Run Workflow&quot; to start.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => {
            const statusConfig = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.pending
            const StatusIcon = statusConfig.icon
            const result = run.result as Record<string, unknown> | null
            const isExpanded = expandedRunId === run.id

            return (
              <Card
                key={run.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() =>
                  setExpandedRunId(isExpanded ? null : run.id)
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4" />
                      <CardTitle className="text-sm">
                        Run {run.id.slice(0, 8)}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={statusConfig.color}
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{run.progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${run.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">Started:</span>{" "}
                      {formatTimestamp(run.started_at)}
                    </div>
                    <div>
                      <span className="font-medium">Completed:</span>{" "}
                      {formatTimestamp(run.completed_at)}
                    </div>
                  </div>

                  {/* Result summary */}
                  {result && (
                    <div className="flex gap-4 text-xs">
                      {result.items_processed != null && (
                        <span>
                          <span className="font-medium">Processed:</span>{" "}
                          {String(result.items_processed)}
                        </span>
                      )}
                      {result.items_found != null && (
                        <span>
                          <span className="font-medium">Found:</span>{" "}
                          {String(result.items_found)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Error message */}
                  {run.error_message && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                      {run.error_message}
                    </div>
                  )}

                  {/* Expanded result JSON */}
                  {isExpanded && result && (
                    <div className="mt-2">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        Full Result
                      </p>
                      <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
