"use client"

import { useState } from "react"
import {
  Plus,
  Zap,
  Sparkles,
  Filter,
  Brain,
  Save,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  WorkflowStep,
  type WorkflowStepConfig,
  type StepType,
} from "@/components/workflows/WorkflowStep"
import type { Workflow } from "@/hooks/useWorkflows"

interface WorkflowBuilderProps {
  workflow?: Workflow
  onSave: (data: {
    name: string
    description: string
    steps: WorkflowStepConfig[]
  }) => void
  onCancel: () => void
}

const STEP_TYPE_OPTIONS: {
  type: StepType
  label: string
  icon: React.ElementType
}[] = [
  { type: "apify_scraper", label: "Apify Scraper", icon: Zap },
  { type: "enrichment", label: "Enrichment", icon: Sparkles },
  { type: "filter", label: "Filter", icon: Filter },
  { type: "ai_transform", label: "AI Transform", icon: Brain },
  { type: "save_contacts", label: "Save Contacts", icon: Save },
]

export function WorkflowBuilder({
  workflow,
  onSave,
  onCancel,
}: WorkflowBuilderProps) {
  const [name, setName] = useState(workflow?.name ?? "")
  const [description, setDescription] = useState(
    workflow?.description ?? ""
  )
  const [steps, setSteps] = useState<WorkflowStepConfig[]>(
    (workflow?.steps as WorkflowStepConfig[] | undefined) ?? []
  )
  const [showStepMenu, setShowStepMenu] = useState(false)

  const addStep = (type: StepType) => {
    setSteps((prev) => [...prev, { type, config: {} }])
    setShowStepMenu(false)
  }

  const updateStep = (index: number, step: WorkflowStepConfig) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? step : s)))
  }

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  const moveStepUp = (index: number) => {
    if (index === 0) return
    setSteps((prev) => {
      const updated = [...prev]
      const temp = updated[index - 1]
      updated[index - 1] = updated[index]
      updated[index] = temp
      return updated
    })
  }

  const moveStepDown = (index: number) => {
    if (index === steps.length - 1) return
    setSteps((prev) => {
      const updated = [...prev]
      const temp = updated[index + 1]
      updated[index + 1] = updated[index]
      updated[index] = temp
      return updated
    })
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), description: description.trim(), steps })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {workflow ? "Edit Workflow" : "Create Workflow"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="workflow-name">Name</Label>
            <Input
              id="workflow-name"
              placeholder="Workflow name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="workflow-description">Description</Label>
            <Textarea
              id="workflow-description"
              placeholder="Describe what this workflow does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">
          Steps ({steps.length})
        </h3>

        {steps.map((step, index) => (
          <WorkflowStep
            key={index}
            step={step}
            index={index}
            onUpdate={updateStep}
            onRemove={removeStep}
            onMoveUp={moveStepUp}
            onMoveDown={moveStepDown}
            isFirst={index === 0}
            isLast={index === steps.length - 1}
          />
        ))}

        <div className="relative">
          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setShowStepMenu(!showStepMenu)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Step
          </Button>

          {showStepMenu && (
            <Card className="absolute left-0 right-0 top-full z-10 mt-1">
              <CardContent className="p-2">
                <div className="grid gap-1">
                  {STEP_TYPE_OPTIONS.map(({ type, label, icon: StepIcon }) => (
                    <Button
                      key={type}
                      variant="ghost"
                      className="justify-start"
                      onClick={() => addStep(type)}
                    >
                      <StepIcon className="mr-2 h-4 w-4" />
                      {label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!name.trim()}>
          <Save className="mr-2 h-4 w-4" />
          {workflow ? "Update Workflow" : "Save Workflow"}
        </Button>
      </div>
    </div>
  )
}
