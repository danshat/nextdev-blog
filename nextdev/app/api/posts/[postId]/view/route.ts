import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  postId: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { postId } = await params;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  try {
    const res = await fetch(`${backendUrl}/posts/${postId}/view`, {
      method: 'POST',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to increment view' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Increment view error:', error);
    return NextResponse.json(
      { error: 'Failed to increment view' },
      { status: 500 }
    );
  }
}
