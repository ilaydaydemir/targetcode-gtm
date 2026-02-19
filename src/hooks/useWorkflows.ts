"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Tables } from "@/lib/supabase/types"

export type Workflow = Tables<"workflows">
export type WorkflowRun = Tables<"workflow_runs">

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setWorkflows(data ?? [])
    } catch (err) {
      console.error("Failed to fetch workflows:", err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const createWorkflow = useCallback(
    async (workflow: {
      name: string
      description?: string
      steps: unknown[]
    }) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error("Not authenticated")

        const { data, error } = await supabase
          .from("workflows")
          .insert({
            user_id: user.id,
            name: workflow.name,
            description: workflow.description ?? null,
            steps: workflow.steps as Tables<"workflows">["steps"],
          })
          .select()
          .single()

        if (error) throw error

        setWorkflows((prev) => [data, ...prev])
        return data
      } catch (err) {
        console.error("Failed to create workflow:", err)
        throw err
      }
    },
    [supabase]
  )

  const updateWorkflow = useCallback(
    async (
      id: string,
      updates: {
        name?: string
        description?: string
        steps?: unknown[]
        is_active?: boolean
      }
    ) => {
      try {
        const { data, error } = await supabase
          .from("workflows")
          .update({
            ...updates,
            steps: updates.steps as Tables<"workflows">["steps"],
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single()

        if (error) throw error

        setWorkflows((prev) =>
          prev.map((w) => (w.id === id ? data : w))
        )
        return data
      } catch (err) {
        console.error("Failed to update workflow:", err)
        throw err
      }
    },
    [supabase]
  )

  const deleteWorkflow = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from("workflows")
          .delete()
          .eq("id", id)

        if (error) throw error

        setWorkflows((prev) => prev.filter((w) => w.id !== id))
      } catch (err) {
        console.error("Failed to delete workflow:", err)
        throw err
      }
    },
    [supabase]
  )

  const executeWorkflow = useCallback(
    async (workflowId: string) => {
      try {
        const res = await fetch("/api/workflows/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workflowId }),
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || "Failed to execute workflow")
        }

        return await res.json()
      } catch (err) {
        console.error("Failed to execute workflow:", err)
        throw err
      }
    },
    []
  )

  const getWorkflowRuns = useCallback(
    async (workflowId: string) => {
      try {
        const { data, error } = await supabase
          .from("workflow_runs")
          .select("*")
          .eq("workflow_id", workflowId)
          .order("created_at", { ascending: false })

        if (error) throw error

        setRuns(data ?? [])
        return data ?? []
      } catch (err) {
        console.error("Failed to fetch workflow runs:", err)
        throw err
      }
    },
    [supabase]
  )

  useEffect(() => {
    fetchWorkflows()
  }, [fetchWorkflows])

  return {
    workflows,
    runs,
    loading,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    getWorkflowRuns,
  }
}
