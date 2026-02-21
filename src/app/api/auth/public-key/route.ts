import { NextResponse } from 'next/server';
import { getPublicKeyPem } from '@/server/auth/rsa';

export async function GET() {
  try {
    const publicKey = getPublicKeyPem();

    return NextResponse.json(
      { success: true, data: { publicKey } },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
        }
      }
    );
  } catch (error) {
    console.error('Public key error:', error);
    return NextResponse.json(
      { success: false, error: 'RSA key not configured' },
      { status: 500 }
    );
  }
}
