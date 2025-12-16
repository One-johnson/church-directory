import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
): Promise<NextResponse> {
  try {
    const token = params.token;

    if (!token) {
      return NextResponse.json(
        { error: 'Invalid approval link' },
        { status: 400 }
      );
    }

    // Approve user via token
    const result = await convex.mutation(api.userApprovals.approveUserAccountByToken, {
      token,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to approve account' },
        { status: 500 }
      );
    }

    // Return success page
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Approved - UD Professionals Directory</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 48px;
            max-width: 500px;
            width: 100%;
            text-align: center;
          }
          .icon {
            font-size: 72px;
            margin-bottom: 24px;
            animation: bounce 1s ease-in-out;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          h1 {
            color: #1f2937;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 16px;
          }
          p {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 32px;
          }
          .user-name {
            color: #4f46e5;
            font-weight: 600;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🎉</div>
          <h1>Account Approved!</h1>
          <p>
            <span class="user-name">${result.userName}</span> has been successfully approved and can now access their account.
          </p>
          <p>
            An email confirmation has been sent to the user with their login details.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="button">
            Visit UD Professionals Directory
          </a>
          <div class="footer">
            Thank you for approving this registration!<br>
            UD Professionals Directory Team
          </div>
        </div>
      </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error: any) {
    console.error('Approval error:', error);

    // Return error page
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Approval Error - UD Professionals Directory</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 48px;
            max-width: 500px;
            width: 100%;
            text-align: center;
          }
          .icon {
            font-size: 72px;
            margin-bottom: 24px;
          }
          h1 {
            color: #1f2937;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 16px;
          }
          p {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 32px;
          }
          .error-message {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 16px;
            color: #dc2626;
            font-size: 14px;
            margin-bottom: 24px;
          }
          .button {
            display: inline-block;
            background: #4f46e5;
            color: white;
            padding: 16px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">❌</div>
          <h1>Approval Failed</h1>
          <p>
            We couldn't approve this account. This link may have already been used or expired.
          </p>
          <div class="error-message">
            ${error.message || 'Unknown error occurred'}
          </div>
          <p>
            Please contact your admin or try again later.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="button">
            Go to Homepage
          </a>
        </div>
      </body>
      </html>
      `,
      {
        status: 400,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  }
}
