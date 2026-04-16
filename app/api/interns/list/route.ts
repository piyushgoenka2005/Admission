import { NextRequest, NextResponse } from 'next/server';
import { getAllInterns, invalidateCache } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    if (request.nextUrl.searchParams.get('force') === '1') {
      invalidateCache();
    }
    const interns = await getAllInterns();
    
    return NextResponse.json(
      { success: true, data: interns },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching interns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interns' },
      { status: 500 }
    );
  }
}
