"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Tables, InsertTables, UpdateTables } from "@/lib/supabase/types"

export type Contact = Tables<"contacts">

export type ContactInsert = Omit<InsertTables<"contacts">, "id" | "user_id" | "created_at" | "updated_at">

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError
      setContacts(data ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch contacts"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const addContact = useCallback(
    async (contact: ContactInsert) => {
      try {
        setError(null)

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error("Not authenticated")

        const { data, error: insertError } = await supabase
          .from("contacts")
          .insert({ ...contact, user_id: user.id })
          .select()
          .single()

        if (insertError) throw insertError

        setContacts((prev) => [data, ...prev])
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add contact"
        setError(message)
        throw err
      }
    },
    [supabase]
  )

  const updateContact = useCallback(
    async (id: string, updates: UpdateTables<"contacts">) => {
      try {
        setError(null)

        const { data, error: updateError } = await supabase
          .from("contacts")
          .update(updates)
          .eq("id", id)
          .select()
          .single()

        if (updateError) throw updateError

        setContacts((prev) =>
          prev.map((c) => (c.id === id ? data : c))
        )
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update contact"
        setError(message)
        throw err
      }
    },
    [supabase]
  )

  const deleteContact = useCallback(
    async (id: string) => {
      try {
        setError(null)

        const { error: deleteError } = await supabase
          .from("contacts")
          .delete()
          .eq("id", id)

        if (deleteError) throw deleteError

        setContacts((prev) => prev.filter((c) => c.id !== id))
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete contact"
        setError(message)
        throw err
      }
    },
    [supabase]
  )

  const deleteMany = useCallback(
    async (ids: string[]) => {
      try {
        setError(null)

        const { error: deleteError } = await supabase
          .from("contacts")
          .delete()
          .in("id", ids)

        if (deleteError) throw deleteError

        setContacts((prev) => prev.filter((c) => !ids.includes(c.id)))
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete contacts"
        setError(message)
        throw err
      }
    },
    [supabase]
  )

  const searchContacts = useCallback(
    async (query: string) => {
      try {
        setLoading(true)
        setError(null)

        if (!query.trim()) {
          await fetchContacts()
          return
        }

        const searchTerm = `%${query}%`

        const { data, error: searchError } = await supabase
          .from("contacts")
          .select("*")
          .or(
            `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},company.ilike.${searchTerm}`
          )
          .order("created_at", { ascending: false })

        if (searchError) throw searchError
        setContacts(data ?? [])
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to search contacts"
        setError(message)
      } finally {
        setLoading(false)
      }
    },
    [supabase, fetchContacts]
  )

  const refreshContacts = useCallback(() => {
    return fetchContacts()
  }, [fetchContacts])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  return {
    contacts,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    deleteMany,
    searchContacts,
    refreshContacts,
  }
}
