"use client"

import { useCallback, useState } from "react"
import { Loader2, Plus, Upload, Users } from "lucide-react"

import { useContacts } from "@/hooks/useContacts"
import type { Contact, ContactInsert } from "@/hooks/useContacts"
import { Button } from "@/components/ui/button"
import { ContactsTable } from "@/components/contacts/ContactsTable"
import { ContactForm } from "@/components/contacts/ContactForm"
import { ImportDialog } from "@/components/contacts/ImportDialog"

export default function ContactsPage() {
  const {
    contacts,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    deleteMany,
    searchContacts,
  } = useContacts()

  const [formOpen, setFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const handleAddNew = useCallback(() => {
    setEditingContact(null)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((contact: Contact) => {
    setEditingContact(contact)
    setFormOpen(true)
  }, [])

  const handleSave = useCallback(
    async (data: ContactInsert) => {
      if (editingContact) {
        await updateContact(editingContact.id, data)
      } else {
        await addContact(data)
      }
    },
    [editingContact, addContact, updateContact]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteContact(id)
    },
    [deleteContact]
  )

  const handleBulkDelete = useCallback(
    async (ids: string[]) => {
      await deleteMany(ids)
    },
    [deleteMany]
  )

  const handleSearch = useCallback(
    (query: string) => {
      searchContacts(query)
    },
    [searchContacts]
  )

  const handleImport = useCallback(
    async (importedContacts: ContactInsert[]) => {
      for (const contact of importedContacts) {
        await addContact({
          ...contact,
          source: "csv",
        })
      }
    },
    [addContact]
  )

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground text-sm">
            {contacts.length} total contact{contacts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 size-4" />
            Import CSV
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 size-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg border border-red-200 px-4 py-3 text-sm dark:border-red-900">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      ) : (
        <ContactsTable
          contacts={contacts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onSearch={handleSearch}
        />
      )}

      {/* Contact Form Dialog */}
      <ContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
        contact={editingContact}
        onSave={handleSave}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
      />
    </div>
  )
}
