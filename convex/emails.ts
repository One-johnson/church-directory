/**
 * Email Actions - SendGrid Integration
 *
 * Sends emails directly using SendGrid API from Convex actions
 * API key is stored in Convex environment variables
 */

import { action } from "./_generated/server";
import { v } from "convex/values";

// Get SendGrid configuration from environment variables
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "admin@churchmms.com";
const FROM_NAME =
  process.env.SENDGRID_FROM_NAME || "UD Professionals Directory";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://church-directory-ebon.vercel.app/";

if (!APP_URL) {
  throw new Error(
    "NEXT_PUBLIC_APP_URL is not set in Convex environment variables"
  );
}

interface EmailPayload {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  html?: string;
}

interface SendGridPayload {
  personalizations: Array<{
    to: Array<{ email: string; name?: string }>;
    subject: string;
  }>;
  from: {
    email: string;
    name: string;
  };
  content: Array<{
    type: string;
    value: string;
  }>;
}

/**
 * Send email directly via SendGrid API
 */
async function sendEmailViaSendGrid(payload: EmailPayload): Promise<boolean> {
  try {
    if (
      !SENDGRID_API_KEY ||
      SENDGRID_API_KEY === "YOUR_SENDGRID_API_KEY_HERE"
    ) {
      console.error(
        "SendGrid API key not configured. Please set SENDGRID_API_KEY in Convex environment variables."
      );
      return false;
    }

    const sendGridPayload: SendGridPayload = {
      personalizations: [
        {
          to: [
            {
              email: payload.to,
              name: payload.toName,
            },
          ],
          subject: payload.subject,
        },
      ],
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      content: [
        {
          type: "text/plain",
          value: payload.text,
        },
      ],
    };

    // Add HTML content if provided
    if (payload.html) {
      sendGridPayload.content.push({
        type: "text/html",
        value: payload.html,
      });
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sendGridPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SendGrid API Error:", errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
}

/**
 * Send registration approval email to pastor
 */
export const sendRegistrationEmail = action({
  args: {
    pastorEmail: v.string(),
    pastorName: v.string(),
    userName: v.string(),
    userEmail: v.string(),
    userPhone: v.optional(v.string()),
    denominationName: v.string(),
    branchName: v.string(),
    branchLocation: v.string(),
    approvalToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Direct pastor approval link with token
    const pastorApprovalLink = `${APP_URL}/api/approve-account/${args.approvalToken}`;
    const adminApprovalLink = `${APP_URL}/admin/account-approvals`;

    const email: EmailPayload = {
      to: args.pastorEmail,
      toName: args.pastorName,
      subject: `New Registration Approval Request - ${args.userName}`,
      text: `
Dear ${args.pastorName},

A new Professional has registered and requires your approval:

Professional's Details:
- Name: ${args.userName}
- Email: ${args.userEmail}
${args.userPhone ? `- Phone: ${args.userPhone}` : ""}
- Denomination: ${args.denominationName}
- Branch: ${args.branchName} (${args.branchLocation})

Please approve this registration by clicking the link below:
${pastorApprovalLink}

// Alternatively, your admin can approve at:
// ${adminApprovalLink}

Best regards,
UD Professionals Directory Team
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-label { font-weight: bold; color: #4F46E5; }
    .button { background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; font-size: 16px; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Registration Approval Request</h1>
    </div>
    <div class="content">
      <p>Dear ${args.pastorName},</p>
      <p>A new professional has registered at <strong>UD Professionals Directory</strong> and requires your approval:</p>
      
      <div class="details">
        <h3>Professional's Details</h3>
        <div class="detail-row">
          <span class="detail-label">Name:</span> ${args.userName}
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span> ${args.userEmail}
        </div>
       
        <div class="detail-row">
          <span class="detail-label">Denomination:</span> ${args.denominationName}
        </div>
        <div class="detail-row">
          <span class="detail-label">Branch:</span> ${args.branchName} (${args.branchLocation})
        </div>
      </div>

      <p style="text-align: center;">
        <a href="${pastorApprovalLink}" class="button">✅ Approve Registration</a>
      </p>
      
      // <p style="text-align: center; margin-top: 10px;">
      //   <a href="${adminApprovalLink}" style="color: #6b7280; text-decoration: underline; font-size: 14px;">Or view in admin panel</a>
      // </p>

      <p class="footer">
        Best regards,<br>
        UD Professionals Directory Team
      </p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    };

    const success = await sendEmailViaSendGrid(email);
    return { success };
  },
});

/**
 * Send job opportunity submission notification email to admins
 */
export const sendJobOpportunitySubmissionEmail = action({
  args: {
    adminEmail: v.string(),
    adminName: v.string(),
    posterName: v.string(),
    posterEmail: v.string(),
    professionalNeeded: v.string(),
    subject: v.string(),
    description: v.string(),
    contactEmail: v.string(),
    contactPhone: v.string(),
  },
  handler: async (ctx, args) => {
    const approvalsLink = `${APP_URL}/admin/approvals`;

    // Truncate description to 200 characters for email preview
    const descriptionPreview = args.description.length > 200 
      ? args.description.substring(0, 200) + '...' 
      : args.description;

    const email: EmailPayload = {
      to: args.adminEmail,
      toName: args.adminName,
      subject: `🆕 New Job Opportunity Posted - ${args.professionalNeeded}`,
      text: `
Dear ${args.adminName},

${args.posterName} has posted a new job opportunity that requires your approval:

Job Details:
- Looking for: ${args.professionalNeeded}
- Subject: ${args.subject}
- Description: ${descriptionPreview}
- Contact: ${args.contactEmail}${args.contactPhone ? ` | ${args.contactPhone}` : ''}
- Posted by: ${args.posterName} (${args.posterEmail})

Please review and approve this job opportunity at:
${approvalsLink}

Best regards,
UD Professionals Directory Team
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-label { font-weight: bold; color: #f59e0b; }
    .description-box { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 15px 0; }
    .button { background: #f59e0b; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; font-size: 16px; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
    .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 14px; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🆕 New Job Opportunity</h1>
    </div>
    <div class="content">
      <p>Dear ${args.adminName},</p>
      <p><strong>${args.posterName}</strong> has posted a new job opportunity that requires your approval:</p>
      
      <div class="details">
        <h3>Job Opportunity Details</h3>
        <div class="detail-row">
          <span class="detail-label">Looking for:</span> <span class="badge">${args.professionalNeeded}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Subject:</span> ${args.subject}
        </div>
        <div class="description-box">
          <strong>Description:</strong><br>
          ${descriptionPreview}
        </div>
        <div class="detail-row">
          <span class="detail-label">Contact Email:</span> ${args.contactEmail}
        </div>
        ${args.contactPhone ? `<div class="detail-row"><span class="detail-label">Contact Phone:</span> ${args.contactPhone}</div>` : ''}
        <div class="detail-row">
          <span class="detail-label">Posted by:</span> ${args.posterName} (${args.posterEmail})
        </div>
      </div>

      <p style="text-align: center;">
        <a href="${approvalsLink}" class="button">Review & Approve Job</a>
      </p>

      <p class="footer">
        Best regards,<br>
        UD Professionals Directory Team
      </p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    };

    const success = await sendEmailViaSendGrid(email);
    return { success };
  },
});











/**
 * Send account approved email to user
 */
export const sendAccountApprovedEmail = action({
  args: {
    userEmail: v.string(),
    userName: v.string(),
    approverName: v.string(),
  },
  handler: async (ctx, args) => {
    const loginLink = `${APP_URL}/login`;

    const email: EmailPayload = {
      to: args.userEmail,
      toName: args.userName,
      subject: "🎉 Your Account Has Been Approved!",
      text: `
Dear ${args.userName},

Great news! Your account at UD Professionals Directory has been approved by ${args.approverName}.

You can now:
✓ Login to your account
✓ Create your professional profile
✓ Connect with other members
✓ Send and receive messages

Login here: ${loginLink}

We're excited to have you in our community!

Best regards,
UD Professionals Directory Team
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .success-icon { font-size: 48px; margin-bottom: 10px; }
    .feature-list { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .feature-item { padding: 10px 0; display: flex; align-items: center; }
    .checkmark { color: #10b981; font-weight: bold; margin-right: 10px; font-size: 20px; }
    .button { background: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">🎉</div>
      <h1>Account Approved!</h1>
    </div>
    <div class="content">
      <p>Dear ${args.userName},</p>
      <p>Great news! Your account at <strong>UD Professionals Directory</strong> has been approved by ${args.approverName}.</p>
      
      <div class="feature-list">
        <h3>You can now:</h3>
        <div class="feature-item">
          <span class="checkmark">✓</span>
          <span>Login to your account</span>
        </div>
        <div class="feature-item">
          <span class="checkmark">✓</span>
          <span>Create your professional profile</span>
        </div>
        <div class="feature-item">
          <span class="checkmark">✓</span>
          <span>Connect with other members</span>
        </div>
        <div class="feature-item">
          <span class="checkmark">✓</span>
          <span>Send and receive messages</span>
        </div>
      </div>

      <p style="text-align: center;">
        <a href="${loginLink}" class="button">Login Now</a>
      </p>

      <p style="text-align: center; color: #6b7280;">
        We're excited to have you in our community!
      </p>

      <p class="footer">
        Best regards,<br>
        UD Professionals Directory Team
      </p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    };

    const success = await sendEmailViaSendGrid(email);
    return { success };
  },
});

/**
 * Send new message notification email
 */
export const sendNewMessageEmail = action({
  args: {
    recipientEmail: v.string(),
    recipientName: v.string(),
    senderName: v.string(),
    messagePreview: v.string(),
  },
  handler: async (ctx, args) => {
    const messagesLink = `${APP_URL}/messages`;

    // Truncate message preview to 100 characters
    const preview =
      args.messagePreview.length > 100
        ? args.messagePreview.substring(0, 100) + "..."
        : args.messagePreview;

    const email: EmailPayload = {
      to: args.recipientEmail,
      toName: args.recipientName,
      subject: `New Message from ${args.senderName}`,
      text: `
Dear ${args.recipientName},

You have received a new message from ${args.senderName}:

"${preview}"

View and reply to this message at:
${messagesLink}

Best regards,
UD Professionals Directory Team
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .message-box { background: white; padding: 20px; border-left: 4px solid #4F46E5; border-radius: 4px; margin: 20px 0; font-style: italic; color: #4b5563; }
    .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💬 New Message</h1>
    </div>
    <div class="content">
      <p>Dear ${args.recipientName},</p>
      <p>You have received a new message from <strong>${args.senderName}</strong>:</p>
      
      <div class="message-box">
        "${preview}"
      </div>

      <p style="text-align: center;">
        <a href="${messagesLink}" class="button">View & Reply</a>
      </p>

      <p class="footer">
        Best regards,<br>
        UD Professionals Directory Team
      </p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    };

    const success = await sendEmailViaSendGrid(email);
    return { success };
  },
});

/**
 * Send admin notification email for new user registration
 */
export const sendAdminRegistrationNotificationEmail = action({
  args: {
    adminEmail: v.string(),
    adminName: v.string(),
    userName: v.string(),
    userEmail: v.string(),
    userPhone: v.optional(v.string()),
    denominationName: v.string(),
    branchName: v.string(),
    branchLocation: v.string(),
    pastorName: v.string(),
  },
  handler: async (ctx, args) => {
    const adminApprovalLink = `${APP_URL}/admin/account-approvals`;

    const email: EmailPayload = {
      to: args.adminEmail,
      toName: args.adminName,
      subject: `🔔 New User Registration - ${args.userName}`,
      text: `
Dear ${args.adminName},

A new professional has registered and requires approval:

Professional's Details:
- Name: ${args.userName}
- Email: ${args.userEmail}
${args.userPhone ? `- Phone: ${args.userPhone}` : ""}
- Denomination: ${args.denominationName}
- Branch: ${args.branchName} (${args.branchLocation})
- Assigned Pastor: ${args.pastorName}

Pastor ${args.pastorName} has been notified for approval. 

Best regards,
UD Professionals Directory Team
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #7C3AED; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-label { font-weight: bold; color: #7C3AED; }
    .button { background: #7C3AED; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; font-size: 16px; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
    .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 New User Registration</h1>
    </div>
    <div class="content">
      <p>Dear ${args.adminName},</p>
      <p>A new professional has registered at <strong>UD Professionals Directory</strong> and requires approval:</p>
      
      <div class="details">
        <h3>Professional's Details</h3>
        <div class="detail-row">
          <span class="detail-label">Name:</span> ${args.userName}
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span> ${args.userEmail}
        </div>
        ${args.userPhone ? `<div class="detail-row"><span class="detail-label">Phone:</span> ${args.userPhone}</div>` : ""}
        <div class="detail-row">
          <span class="detail-label">Denomination:</span> ${args.denominationName}
        </div>
        <div class="detail-row">
          <span class="detail-label">Branch:</span> ${args.branchName} (${args.branchLocation})
        </div>
        <div class="detail-row">
          <span class="detail-label">Assigned Pastor:</span> ${args.pastorName}
        </div>
      </div>

      <div class="info-box">
        <strong>Note:</strong> Pastor ${args.pastorName} has been notified and can approve directly via email. 
      </div>

      // <p style="text-align: center;">
      //   <a href="${adminApprovalLink}" class="button">Review in Admin Panel</a>
      // </p>

      <p class="footer">
        Best regards,<br>
        UD Professionals Directory Team
      </p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    };

    const success = await sendEmailViaSendGrid(email);
    return { success };
  },
});

/**
 * Send job seeker submission notification email to admins
 */
export const sendJobSeekerSubmissionEmail = action({
  args: {
    adminEmail: v.string(),
    adminName: v.string(),
    seekerName: v.string(),
    seekerEmail: v.string(),
    subject: v.string(),
    description: v.string(),
    contactEmail: v.string(),
    contactPhone: v.string(),
  },
  handler: async (ctx, args) => {
    const approvalsLink = `${APP_URL}/admin/approvals`;

    // Truncate description to 200 characters for email preview
    const descriptionPreview = args.description.length > 200 
      ? args.description.substring(0, 200) + '...' 
      : args.description;

    const email: EmailPayload = {
      to: args.adminEmail,
      toName: args.adminName,
      subject: `🔎 New Job Seeker Request - ${args.subject}`,
      text: `
Dear ${args.adminName},

${args.seekerName} has posted a job seeking request that requires your approval:

Job Seeker Details:
- Subject: ${args.subject}
- Description: ${descriptionPreview}
- Contact: ${args.contactEmail}${args.contactPhone ? ` | ${args.contactPhone}` : ''}
- Posted by: ${args.seekerName} (${args.seekerEmail})

Please review and approve this job seeker request at:
${approvalsLink}

Best regards,
UD Professionals Directory Team
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-label { font-weight: bold; color: #0ea5e9; }
    .description-box { background: #dbeafe; padding: 15px; border-left: 4px solid #0ea5e9; border-radius: 4px; margin: 15px 0; }
    .button { background: #0ea5e9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; font-size: 16px; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
    .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 14px; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔎 New Job Seeker Request</h1>
    </div>
    <div class="content">
      <p>Dear ${args.adminName},</p>
      <p><strong>${args.seekerName}</strong> has posted a job seeking request that requires your approval:</p>
      
      <div class="details">
        <h3>Job Seeker Details</h3>
        <div class="detail-row">
          <span class="detail-label">Subject:</span> <span class="badge">${args.subject}</span>
        </div>
        <div class="description-box">
          <strong>Description:</strong><br>
          ${descriptionPreview}
        </div>
        <div class="detail-row">
          <span class="detail-label">Contact Email:</span> ${args.contactEmail}
        </div>
        ${args.contactPhone ? `<div class="detail-row"><span class="detail-label">Contact Phone:</span> ${args.contactPhone}</div>` : ''}
        <div class="detail-row">
          <span class="detail-label">Posted by:</span> ${args.seekerName} (${args.seekerEmail})
        </div>
      </div>

      <p style="text-align: center;">
        <a href="${approvalsLink}" class="button">Review & Approve Request</a>
      </p>

      <p class="footer">
        Best regards,<br>
        UD Professionals Directory Team
      </p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    };

    const success = await sendEmailViaSendGrid(email);
    return { success };
  },
});



/**
 * Send profile submission notification email to pastor and admins
 */
export const sendProfileSubmissionEmail = action({
  args: {
    recipientEmail: v.string(),
    recipientName: v.string(),
    recipientRole: v.union(v.literal("admin"), v.literal("pastor")),
    userName: v.string(),
    userEmail: v.string(),
    profession: v.string(),
    category: v.string(),
    location: v.string(),
    skills: v.string(),
  },
  handler: async (ctx, args) => {
    const approvalsLink = `${APP_URL}/admin/approvals`;

    const email: EmailPayload = {
      to: args.recipientEmail,
      toName: args.recipientName,
      subject: `🆕 New Professional Profile Submitted - ${args.userName}`,
      text: `
Dear ${args.recipientName},

${args.userName} has completed their professional profile and it requires your approval:

Profile Details:
- Name: ${args.userName}
- Email: ${args.userEmail}
- Profession: ${args.profession}
- Category: ${args.category}
- Location: ${args.location}
- Skills: ${args.skills}

Please review and approve this profile at:
${approvalsLink}

Best regards,
UD Professionals Directory Team
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-label { font-weight: bold; color: #10b981; }
    .button { background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; font-size: 16px; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
    .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 14px; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🆕 New Professional Profile</h1>
    </div>
    <div class="content">
      <p>Dear ${args.recipientName},</p>
      <p><strong>${args.userName}</strong> has completed their professional profile and it requires your approval:</p>
      
      <div class="details">
        <h3>Profile Details</h3>
        <div class="detail-row">
          <span class="detail-label">Name:</span> ${args.userName}
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span> ${args.userEmail}
        </div>
        <div class="detail-row">
          <span class="detail-label">Profession:</span> ${args.profession}
        </div>
        <div class="detail-row">
          <span class="detail-label">Category:</span> <span class="badge">${args.category}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Location:</span> ${args.location}
        </div>
        <div class="detail-row">
          <span class="detail-label">Skills:</span> ${args.skills}
        </div>
      </div>

      <p style="text-align: center;">
        <a href="${approvalsLink}" class="button">Review & Approve Profile</a>
      </p>

      <p class="footer">
        Best regards,<br>
        UD Professionals Directory Team
      </p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    };

    const success = await sendEmailViaSendGrid(email);
    return { success };
  },
});
