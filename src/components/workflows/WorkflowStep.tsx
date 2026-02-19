"use client"

import { useState } from "react"
import {
  Zap,
  Sparkles,
  Filter,
  Brain,
  Save,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type StepType =
  | "apify_scraper"
  | "enrichment"
  | "filter"
  | "ai_transform"
  | "save_contacts"

export interface WorkflowStepConfig {
  type: StepType
  config: Record<string, unknown>
}

interface WorkflowStepProps {
  step: WorkflowStepConfig
  index: number
  onUpdate: (index: number, step: WorkflowStepConfig) => void
  onRemove: (index: number) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  isFirst: boolean
  isLast: boolean
}

const STEP_ICONS: Record<StepType, React.ElementType> = {
  apify_scraper: Zap,
  enrichment: Sparkles,
  filter: Filter,
  ai_transform: Brain,
  save_contacts: Save,
}

const STEP_LABELS: Record<StepType, string> = {
  apify_scraper: "Apify Scraper",
  enrichment: "Enrichment",
  filter: "Filter",
  ai_transform: "AI Transform",
  save_contacts: "Save Contacts",
}

export function WorkflowStep({
  step,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: WorkflowStepProps) {
  const [collapsed, setCollapsed] = useState(false)

  const Icon = STEP_ICONS[step.type]

  const updateConfig = (key: string, value: unknown) => {
    onUpdate(index, {
      ...step,
      config: { ...step.config, [key]: value },
    })
  }

  const renderConfig = () => {
    switch (step.type) {
      case "apify_scraper":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor={`actor-id-${index}`}>Actor ID</Label>
              <Input
                id={`actor-id-${index}`}
                placeholder="e.g. apify/web-scraper"
                value={(step.config.actor_id as string) ?? ""}
                onChange={(e) => updateConfig("actor_id", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`input-config-${index}`}>
                Input Configuration (JSON)
              </Label>
              <Textarea
                id={`input-config-${index}`}
                placeholder='{"startUrls": [{"url": "https://example.com"}]}'
                value={(step.config.input_config as string) ?? ""}
                onChange={(e) => updateConfig("input_config", e.target.value)}
                rows={4}
              />
            </div>
          </div>
        )

      case "enrichment":
        return (
          <div className="space-y-3">
            <div>
              <Label>Provider</Label>
              <Select
                value={(step.config.provider as string) ?? ""}
                onValueChange={(value) => updateConfig("provider", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hunter">Hunter</SelectItem>
                  <SelectItem value="clearbit">Clearbit</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target Field</Label>
              <Select
                value={(step.config.target_field as string) ?? ""}
                onValueChange={(value) => updateConfig("target_field", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case "filter":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor={`filter-field-${index}`}>Field</Label>
              <Input
                id={`filter-field-${index}`}
                placeholder="e.g. email, company, job_title"
                value={(step.config.field as string) ?? ""}
                onChange={(e) => updateConfig("field", e.target.value)}
              />
            </div>
            <div>
              <Label>Operator</Label>
              <Select
                value={(step.config.operator as string) ?? ""}
                onValueChange={(value) => updateConfig("operator", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not_equals">Not Equals</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="gt">Greater Than</SelectItem>
                  <SelectItem value="lt">Less Than</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={`filter-value-${index}`}>Value</Label>
              <Input
                id={`filter-value-${index}`}
                placeholder="Filter value"
                value={(step.config.value as string) ?? ""}
                onChange={(e) => updateConfig("value", e.target.value)}
              />
            </div>
          </div>
        )

      case "ai_transform":
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor={`prompt-${index}`}>Transformation Prompt</Label>
              <Textarea
                id={`prompt-${index}`}
                placeholder="Describe how to transform the data using Claude..."
                value={(step.config.prompt as string) ?? ""}
                onChange={(e) => updateConfig("prompt", e.target.value)}
                rows={4}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Uses Claude (claude-sonnet-4-5-20250929) for data transformation
            </p>
          </div>
        )

      case "save_contacts":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`auto-map-${index}`}
                checked={(step.config.auto_map_fields as boolean) ?? true}
                onChange={(e) =>
                  updateConfig("auto_map_fields", e.target.checked)
                }
                className="rounded border-input"
              />
              <Label htmlFor={`auto-map-${index}`}>
                Auto-map fields to contacts
              </Label>
            </div>
            <div>
              <Label htmlFor={`tags-${index}`}>Tags (comma-separated)</Label>
              <Input
                id={`tags-${index}`}
                placeholder="e.g. scraped, lead, outbound"
                value={(step.config.tags as string) ?? ""}
                onChange={(e) => updateConfig("tags", e.target.value)}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {index + 1}
            </span>
            <Icon className="h-4 w-4" />
            <CardTitle className="text-sm">{STEP_LABELS[step.type]}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {step.type}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onMoveUp(index)}
              disabled={isFirst}
              title="Move up"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onMoveDown(index)}
              disabled={isLast}
              title="Move down"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronUp className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onRemove(index)}
              title="Remove step"
              className="text-destructive hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {!collapsed && <CardContent>{renderConfig()}</CardContent>}
    </Card>
  )
}
