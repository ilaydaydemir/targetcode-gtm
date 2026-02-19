"use client"

import { useCallback, useRef, useState } from "react"
import { FileUp, Loader2, Upload } from "lucide-react"

import type { ContactInsert } from "@/hooks/useContacts"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (contacts: ContactInsert[]) => Promise<void>
}

const KNOWN_HEADERS: Record<string, keyof ContactInsert> = {
  first_name: "first_name",
  firstname: "first_name",
  "first name": "first_name",
  last_name: "last_name",
  lastname: "last_name",
  "last name": "last_name",
  email: "email",
  "email address": "email",
  phone: "phone",
  telephone: "phone",
  "phone number": "phone",
  company: "company",
  organization: "company",
  job_title: "job_title",
  jobtitle: "job_title",
  "job title": "job_title",
  title: "job_title",
  linkedin_url: "linkedin_url",
  linkedin: "linkedin_url",
  "linkedin url": "linkedin_url",
  website: "website",
  url: "website",
  location: "location",
  city: "location",
  address: "location",
  source: "source",
  tags: "tags",
  notes: "notes",
  status: "status",
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ",") {
        fields.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
  }

  fields.push(current.trim())
  return fields
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = parseCsvLine(lines[0])
  const rows = lines.slice(1).map(parseCsvLine)

  return { headers, rows }
}

function mapRowToContact(
  row: string[],
  headers: string[],
  columnMap: Map<number, keyof ContactInsert>
): ContactInsert {
  const contact: Record<string, unknown> = {
    first_name: null,
    last_name: null,
    email: null,
    phone: null,
    company: null,
    job_title: null,
    linkedin_url: null,
    website: null,
    location: null,
    source: null,
    tags: null,
    notes: null,
    status: null,
  }

  columnMap.forEach((field, colIndex) => {
    const value = row[colIndex]?.trim()
    if (!value) return

    if (field === "tags") {
      contact.tags = value
        .split(/[;,]/)
        .map((t) => t.trim())
        .filter(Boolean)
    } else {
      contact[field] = value
    }
  })

  return contact as unknown as ContactInsert
}

export function ImportDialog({
  open,
  onOpenChange,
  onImport,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([])
  const [parsedRows, setParsedRows] = useState<string[][]>([])
  const [columnMap, setColumnMap] = useState<Map<number, keyof ContactInsert>>(
    new Map()
  )
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setFile(null)
    setParsedHeaders([])
    setParsedRows([])
    setColumnMap(new Map())
    setImporting(false)
    setProgress(0)
    setDragOver(false)
  }, [])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) reset()
      onOpenChange(nextOpen)
    },
    [onOpenChange, reset]
  )

  const processFile = useCallback((selectedFile: File) => {
    setFile(selectedFile)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers, rows } = parseCsv(text)

      setParsedHeaders(headers)
      setParsedRows(rows)

      // Auto-detect column mapping
      const map = new Map<number, keyof ContactInsert>()
      headers.forEach((header, index) => {
        const normalized = header.toLowerCase().trim()
        const mapped = KNOWN_HEADERS[normalized]
        if (mapped) {
          map.set(index, mapped)
        }
      })
      setColumnMap(map)
    }
    reader.readAsText(selectedFile)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) processFile(selectedFile)
    },
    [processFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile && droppedFile.name.endsWith(".csv")) {
        processFile(droppedFile)
      }
    },
    [processFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleImport = useCallback(async () => {
    if (parsedRows.length === 0) return

    setImporting(true)
    setProgress(0)

    try {
      const contacts: ContactInsert[] = parsedRows.map((row) =>
        mapRowToContact(row, parsedHeaders, columnMap)
      )

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      await onImport(contacts)

      clearInterval(progressInterval)
      setProgress(100)

      setTimeout(() => {
        handleOpenChange(false)
      }, 500)
    } catch {
      setImporting(false)
      setProgress(0)
    }
  }, [parsedRows, parsedHeaders, columnMap, onImport, handleOpenChange])

  const previewRows = parsedRows.slice(0, 5)
  const mappedColumnIndices = Array.from(columnMap.keys())

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import contacts. Column headers will be
            auto-detected.
          </DialogDescription>
        </DialogHeader>

        {!file ? (
          <div
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="text-muted-foreground mb-4 size-10" />
            <p className="text-sm font-medium">
              Drag and drop a CSV file here, or click to browse
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Supports .csv files
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* File info */}
            <div className="bg-muted/50 flex items-center gap-3 rounded-lg border px-4 py-3">
              <FileUp className="text-muted-foreground size-5" />
              <div className="flex-1">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-muted-foreground text-xs">
                  {parsedRows.length} rows detected &middot;{" "}
                  {columnMap.size} columns mapped
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                disabled={importing}
              >
                Change file
              </Button>
            </div>

            {/* Column mapping summary */}
            {columnMap.size > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Detected columns:</p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(columnMap.entries()).map(([colIndex, field]) => (
                    <span
                      key={colIndex}
                      className="bg-muted rounded-md px-2 py-0.5 text-xs"
                    >
                      {parsedHeaders[colIndex]} &rarr; {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preview table */}
            {previewRows.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Preview (first {previewRows.length} rows):
                </p>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {parsedHeaders.map((header, i) => (
                          <TableHead
                            key={i}
                            className={
                              mappedColumnIndices.includes(i)
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }
                          >
                            {header}
                            {columnMap.has(i) && (
                              <span className="text-primary ml-1 text-xs">
                                ({columnMap.get(i)})
                              </span>
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {parsedHeaders.map((_, colIndex) => (
                            <TableCell key={colIndex} className="max-w-[200px] truncate">
                              {row[colIndex] ?? ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Progress */}
            {importing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <p className="text-sm">
                    Importing contacts... {progress}%
                  </p>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={importing}
          >
            Cancel
          </Button>
          {file && (
            <Button
              onClick={handleImport}
              disabled={importing || parsedRows.length === 0 || columnMap.size === 0}
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  Import {parsedRows.length} Contacts
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
