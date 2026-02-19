import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const webhookSecret = request.headers.get("x-webhook-secret");

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing x-webhook-secret header" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Find a data_source of type 'webhook' whose config contains the matching secret
  const { data: dataSources, error: fetchError } = await supabase
    .from("data_sources")
    .select("*")
    .eq("type", "webhook")
    .eq("is_active", true);

  if (fetchError) {
    console.error("[webhook] Error fetching data sources:", fetchError.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  // Match the webhook secret against data source configs
  const matchingSource = dataSources?.find((ds) => {
    const config = ds.config as Record<string, unknown> | null;
    return config?.webhook_secret === webhookSecret;
  });

  if (!matchingSource) {
    return NextResponse.json(
      { error: "Invalid webhook secret" },
      { status: 403 }
    );
  }

  // Log the received data (storage implementation in a future phase)
  console.log(`[webhook] Received data for source "${matchingSource.name}" (${matchingSource.id}):`, {
    source_id: matchingSource.id,
    source_name: matchingSource.name,
    payload_preview: JSON.stringify(body).substring(0, 500),
    received_at: new Date().toISOString(),
  });

  // Update last_synced_at on the data source
  await supabase
    .from("data_sources")
    .update({
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchingSource.id);

  return NextResponse.json({
    received: true,
    source_id: matchingSource.id,
    source_name: matchingSource.name,
  });
}
