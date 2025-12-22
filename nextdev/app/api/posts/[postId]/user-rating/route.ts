import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  postId: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { postId } = await params;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  try {
    const res = await fetch(`${backendUrl}/posts/${postId}/user-rating`, {
      headers: {
        Cookie: req.headers.get('cookie') || '',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { rated: false },
        { status: 200 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get user rating error:', error);
    return NextResponse.json(
      { rated: false },
      { status: 200 }
    );
  }
}
