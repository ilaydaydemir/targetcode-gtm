"use client"

import { useCallback, useMemo, useState } from "react"
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  Users,
} from "lucide-react"

import type { Contact } from "@/hooks/useContacts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ContactsTableProps {
  contacts: Contact[]
  onEdit: (contact: Contact) => void
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
  onSearch: (query: string) => void
}

type SortField =
  | "name"
  | "email"
  | "company"
  | "job_title"
  | "status"
  | "source"
  | "created_at"

type SortDirection = "asc" | "desc"

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  contacted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  qualified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  converted: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  lost: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

const PAGE_SIZE = 20

function getContactName(contact: Contact): string {
  const parts = [contact.first_name, contact.last_name].filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : "---"
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function exportContactsCsv(contacts: Contact[], selectedIds: Set<string>) {
  const toExport = contacts.filter((c) => selectedIds.has(c.id))
  const headers = [
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Company",
    "Job Title",
    "LinkedIn URL",
    "Website",
    "Location",
    "Source",
    "Status",
    "Tags",
    "Notes",
  ]

  const rows = toExport.map((c) => [
    c.first_name ?? "",
    c.last_name ?? "",
    c.email ?? "",
    c.phone ?? "",
    c.company ?? "",
    c.job_title ?? "",
    c.linkedin_url ?? "",
    c.website ?? "",
    c.location ?? "",
    c.source ?? "",
    c.status ?? "",
    (c.tags ?? []).join(";"),
    (c.notes ?? "").replace(/"/g, '""'),
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell}"`).join(",")
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `contacts-export-${new Date().toISOString().split("T")[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function ContactsTable({
  contacts,
  onEdit,
  onDelete,
  onBulkDelete,
  onSearch,
}: ContactsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value)
      setCurrentPage(1)
      onSearch(value)
    },
    [onSearch]
  )

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      } else {
        setSortField(field)
        setSortDirection("asc")
      }
      setCurrentPage(1)
    },
    [sortField]
  )

  const sortedContacts = useMemo(() => {
    const sorted = [...contacts].sort((a, b) => {
      let aVal: string
      let bVal: string

      switch (sortField) {
        case "name":
          aVal = getContactName(a).toLowerCase()
          bVal = getContactName(b).toLowerCase()
          break
        case "email":
          aVal = (a.email ?? "").toLowerCase()
          bVal = (b.email ?? "").toLowerCase()
          break
        case "company":
          aVal = (a.company ?? "").toLowerCase()
          bVal = (b.company ?? "").toLowerCase()
          break
        case "job_title":
          aVal = (a.job_title ?? "").toLowerCase()
          bVal = (b.job_title ?? "").toLowerCase()
          break
        case "status":
          aVal = (a.status ?? "").toLowerCase()
          bVal = (b.status ?? "").toLowerCase()
          break
        case "source":
          aVal = (a.source ?? "").toLowerCase()
          bVal = (b.source ?? "").toLowerCase()
          break
        case "created_at":
          aVal = a.created_at
          bVal = b.created_at
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    return sorted
  }, [contacts, sortField, sortDirection])

  const totalPages = Math.max(1, Math.ceil(sortedContacts.length / PAGE_SIZE))
  const paginatedContacts = sortedContacts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const allOnPageSelected =
    paginatedContacts.length > 0 &&
    paginatedContacts.every((c) => selectedIds.has(c.id))

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allOnPageSelected) {
        paginatedContacts.forEach((c) => next.delete(c.id))
      } else {
        paginatedContacts.forEach((c) => next.add(c.id))
      }
      return next
    })
  }, [allOnPageSelected, paginatedContacts])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleBulkDelete = useCallback(() => {
    const ids = Array.from(selectedIds)
    onBulkDelete(ids)
    setSelectedIds(new Set())
  }, [selectedIds, onBulkDelete])

  const SortableHeader = ({
    field,
    children,
  }: {
    field: SortField
    children: React.ReactNode
  }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => toggleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-1 size-3.5" />
    </Button>
  )

  if (contacts.length === 0 && !searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Users className="text-muted-foreground mb-4 size-12" />
        <h3 className="text-lg font-semibold">No contacts yet</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Get started by adding your first contact or importing a CSV file.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-muted/50 flex items-center gap-3 rounded-lg border px-4 py-2">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
          >
            <Trash2 className="mr-1 size-3.5" />
            Delete Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportContactsCsv(contacts, selectedIds)}
          >
            <Download className="mr-1 size-3.5" />
            Export CSV
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleSelectAll}
                  className="size-4 rounded border"
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>
                <SortableHeader field="name">Name</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader field="email">Email</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader field="company">Company</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader field="job_title">Job Title</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader field="status">Status</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader field="source">Source</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader field="created_at">Created</SortableHeader>
              </TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <p className="text-muted-foreground text-sm">
                    No contacts found matching your search.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedContacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  data-state={selectedIds.has(contact.id) ? "selected" : undefined}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(contact.id)}
                      onChange={() => toggleSelect(contact.id)}
                      className="size-4 rounded border"
                      aria-label={`Select ${getContactName(contact)}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {getContactName(contact)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.email ?? "---"}
                  </TableCell>
                  <TableCell>{contact.company ?? "---"}</TableCell>
                  <TableCell>{contact.job_title ?? "---"}</TableCell>
                  <TableCell>
                    {contact.status ? (
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[contact.status] ?? ""}
                      >
                        {contact.status}
                      </Badge>
                    ) : (
                      "---"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.source ?? "---"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(contact.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(contact)}>
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDelete(contact.id)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-muted-foreground text-sm">
            Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(currentPage * PAGE_SIZE, sortedContacts.length)} of{" "}
            {sortedContacts.length} contacts
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="mr-1 size-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
