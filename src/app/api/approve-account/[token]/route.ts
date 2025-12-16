import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
): Promise<Response> {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        { error: 'Invalid approval link' },
        { status: 400 }
      );
    }

    // Approve user via token
    const result = await convex.mutation(
      api.userApprovals.approveUserAccountByToken,
      { token }
    );

    if (!result?.success) {
      return NextResponse.json(
        { error: 'Failed to approve account' },
        { status: 500 }
      );
    }

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Account Approved - UD Professionals Directory</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: #fff;
            border-radius: 16px;
            padding: 48px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,.3);
          }
          .icon { font-size: 72px; }
          h1 { margin: 16px 0; }
          .user-name { color: #4f46e5; font-weight: 600; }
          a {
            display: inline-block;
            margin-top: 24px;
            padding: 14px 28px;
            border-radius: 8px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            text-decoration: none;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🎉</div>
          <h1>Account Approved!</h1>
          <p>
            <span class="user-name">${result.userName}</span> has been successfully approved.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}">
            Visit UD Professionals Directory
          </a>
        </div>
      </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error: any) {
    console.error('Approval error:', error);

    return new NextResponse(
      `
      <html>
        <body style="font-family: system-ui; text-align: center; padding: 40px;">
          <h1>❌ Approval Failed</h1>
          <p>${error?.message ?? 'Unknown error occurred'}</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}">
            Go Home
          </a>
        </body>
      </html>
      `,
      {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
