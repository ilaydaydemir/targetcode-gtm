const APIFY_BASE_URL = 'https://api.apify.com/v2'

export async function runApifyActor(
  actorId: string,
  input: Record<string, unknown>
) {
  const token = process.env.APIFY_API_TOKEN
  if (!token) throw new Error('APIFY_API_TOKEN not configured')

  const res = await fetch(`${APIFY_BASE_URL}/acts/${actorId}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  })

  if (!res.ok) throw new Error(`Apify error: ${res.statusText}`)
  return res.json()
}

export async function getApifyRunResult(runId: string) {
  const token = process.env.APIFY_API_TOKEN
  if (!token) throw new Error('APIFY_API_TOKEN not configured')

  const res = await fetch(
    `${APIFY_BASE_URL}/actor-runs/${runId}/dataset/items`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (!res.ok) throw new Error(`Apify error: ${res.statusText}`)
  return res.json()
}
