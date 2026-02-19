import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()

    if (!Array.isArray(body.contacts)) {
      return NextResponse.json(
        { error: "Request body must include a 'contacts' array" },
        { status: 400 }
      )
    }

    const contactsToInsert = body.contacts.map(
      (contact: Record<string, unknown>) => ({
        ...contact,
        user_id: user.id,
        source: "csv",
      })
    )

    const { data, error } = await supabase
      .from("contacts")
      .insert(contactsToInsert)
      .select()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: `Successfully imported ${data.length} contacts`,
        count: data.length,
        data,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
