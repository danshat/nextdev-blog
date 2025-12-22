import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  postId: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { postId } = await params;
  const formData = await req.formData();
  const is_positive = formData.get('is_positive') === 'true';

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  try {
    const backendFormData = new FormData();
    backendFormData.append('is_positive', String(is_positive));

    const res = await fetch(`${backendUrl}/posts/${postId}/rate`, {
      method: 'POST',
      body: backendFormData,
      headers: {
        Cookie: req.headers.get('cookie') || '',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to rate post' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Rating error:', error);
    return NextResponse.json(
      { error: 'Failed to rate post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { postId } = await params;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  try {
    const res = await fetch(`${backendUrl}/posts/${postId}/rate`, {
      method: 'DELETE',
      headers: {
        Cookie: req.headers.get('cookie') || '',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to remove rating' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Remove rating error:', error);
    return NextResponse.json(
      { error: 'Failed to remove rating' },
      { status: 500 }
    );
  }
}
