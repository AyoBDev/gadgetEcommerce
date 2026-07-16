import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';

// Must run per request: without this, Next statically optimizes the GET
// handler and bakes the BUILD-TIME result into the output — on builders with
// no database access that would permanently serve a 500 and fail every
// deploy health check.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const payload = await getPayloadClient();
    await payload.find({ collection: 'categories', limit: 1, depth: 0 });
    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: (err as Error).message }, { status: 500 });
  }
}
