"use client"

import { useState } from "react"
import {
  Plus,
  Play,
  Trash2,
  Settings2,
  Workflow as WorkflowIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useWorkflows, type Workflow } from "@/hooks/useWorkflows"
import { WorkflowBuilder } from "@/components/workflows/WorkflowBuilder"
import { WorkflowRunner } from "@/components/workflows/WorkflowRunner"
import type { WorkflowStepConfig } from "@/components/workflows/WorkflowStep"

type View = "list" | "builder" | "runner"

export default function WorkflowsPage() {
  const {
    workflows,
    runs,
    loading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    getWorkflowRuns,
  } = useWorkflows()

  const [view, setView] = useState<View>("list")
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null
  )

  const handleCreate = () => {
    setSelectedWorkflow(null)
    setView("builder")
  }

  const handleEdit = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setView("builder")
  }

  const handleRun = async (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    await getWorkflowRuns(workflow.id)
    setView("runner")
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return
    await deleteWorkflow(id)
  }

  const handleSave = async (data: {
    name: string
    description: string
    steps: WorkflowStepConfig[]
  }) => {
    if (selectedWorkflow) {
      await updateWorkflow(selectedWorkflow.id, data)
    } else {
      await createWorkflow(data)
    }
    setView("list")
    setSelectedWorkflow(null)
  }

  const handleCancel = () => {
    setView("list")
    setSelectedWorkflow(null)
  }

  const handleExecute = async () => {
    if (!selectedWorkflow) return
    await executeWorkflow(selectedWorkflow.id)
    await getWorkflowRuns(selectedWorkflow.id)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never"
    return new Date(dateStr).toLocaleDateString()
  }

  if (view === "builder") {
    return (
      <div className="p-6">
        <WorkflowBuilder
          workflow={selectedWorkflow ?? undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    )
  }

  if (view === "runner" && selectedWorkflow) {
    return (
      <div className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <Button variant="outline" onClick={handleCancel}>
            Back to List
          </Button>
          <h2 className="text-lg font-semibold">
            {selectedWorkflow.name}
          </h2>
        </div>
        <WorkflowRunner runs={runs} onExecute={handleExecute} />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">
            Build and manage automated data pipelines
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading workflows...
        </div>
      ) : workflows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <WorkflowIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No workflows yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first workflow to automate data collection and
              processing.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => {
            const steps = (workflow.steps as WorkflowStepConfig[] | null) ?? []

            return (
              <Card key={workflow.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {workflow.name}
                      </CardTitle>
                      {workflow.description && (
                        <CardDescription className="line-clamp-2">
                          {workflow.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge
                      variant={workflow.is_active ? "default" : "secondary"}
                    >
                      {workflow.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Steps</span>
                      <span className="font-medium text-foreground">
                        {steps.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Run</span>
                      <span className="font-medium text-foreground">
                        {formatDate(workflow.last_run_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(workflow)}
                    >
                      <Settings2 className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleRun(workflow)}
                    >
                      <Play className="mr-1 h-3 w-3" />
                      Run
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => handleDelete(workflow.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
