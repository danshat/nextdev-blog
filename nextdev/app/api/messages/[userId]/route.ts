import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  userId: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { userId } = await params;
  const formData = await req.formData();
  const text = formData.get('text') as string;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  try {
    const backendFormData = new FormData();
    backendFormData.append('text', text);

    const res = await fetch(`${backendUrl}/messages/${userId}`, {
      method: 'POST',
      body: backendFormData,
      headers: {
        Cookie: req.headers.get('cookie') || '',
      },
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { userId } = await params;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  try {
    const res = await fetch(`${backendUrl}/messages/${userId}`, {
      headers: {
        Cookie: req.headers.get('cookie') || '',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch conversation' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}
