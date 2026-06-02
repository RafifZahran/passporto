import { NextRequest, NextResponse } from 'next/server';

const GO_API = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080';

/**
 * POST /api/simulate-webhook
 *
 * Proxies a mock payment gateway webhook to the Go backend.
 * This allows the frontend's "Simulate Payment" button to trigger
 * the real async webhook handler in Go without needing an external gateway.
 *
 * In production this endpoint would be disabled — real webhooks come directly
 * from Midtrans / Xendit to POST /api/v1/webhook/payment on the Go backend.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const res = await fetch(`${GO_API}/api/v1/webhook/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to reach backend webhook endpoint' },
      { status: 502 }
    );
  }
}
