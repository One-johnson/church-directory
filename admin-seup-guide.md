# 🔐 Admin Setup Guide - Church Connect Pro

This guide explains how to set up admin users for your Church Connect Pro application.

---

## 🎯 The Problem

Everyone who registers starts as a **Member** by default. But someone needs to be an **Admin** to:
- Approve/reject professional profiles
- Manage user roles
- Access admin dashboards
- Perform bulk operations

So how do you create the first admin? Here are **3 solutions**:

---

## ✅ Solution 1: First User Auto-Admin (AUTOMATIC)

**How it works:**
- The very first person to register automatically becomes an admin
- No manual intervention needed
- Perfect for new deployments

**Steps:**
1. Deploy your app for the first time
2. Register the first user account (this becomes the admin)
3. That's it! First user gets admin privileges automatically

**Example:**
```
1. Sarah registers (first user) ✅ → Gets ADMIN role
2. John registers (second user) → Gets MEMBER role
3. Emily registers (third user) → Gets MEMBER role
```

**Verification:**
Check the Convex logs - you'll see:
```
🎉 First user registered with admin privileges: sarah@church.com
```

---

## ✅ Solution 2: Create Admin via Convex Dashboard (MANUAL)

**Use case:**
- Your first user is already registered as a member
- You want to create a dedicated admin account
- You need multiple admins from the start

**Steps:**

### Option A: Create New Admin User

1. Go to your **Convex Dashboard** (https://dashboard.convex.dev)
2. Select your project
3. Click **"Functions"** in the left sidebar
4. Find `adminBootstrap:createInitialAdmin`
5. Click **"Run Function"**
6. Enter the parameters:
   ```json
   {
     "email": "admin@church.com",
     "password": "SecurePassword123!",
     "name": "Church Administrator",
     "phone": "+1234567890"
   }
   ```
7. Click **"Run"**
8. Done! New admin user created

### Option B: Promote Existing User

1. Go to your **Convex Dashboard**
2. Click **"Functions"**
3. Find `adminBootstrap:promoteUserToAdmin`
4. Click **"Run Function"**
5. Enter the email:
   ```json
   {
     "email": "existing-member@church.com"
   }
   ```
6. Click **"Run"**
7. Done! User is now an admin

**Verification:**
Run `adminBootstrap:checkAdminStatus` to see all admins:
```json
{
  "totalUsers": 25,
  "adminCount": 2,
  "pastorCount": 3,
  "memberCount": 20,
  "admins": [
    {
      "email": "admin@church.com",
      "name": "Church Administrator",
      "createdAt": 1234567890
    }
  ],
  "hasAdmins": true,
  "needsBootstrap": false
}
```

---

## ✅ Solution 3: Environment-Based Admin List (FUTURE)

**Coming soon:**
- Set `ADMIN_EMAILS` in your `.env.local`
- Any user with matching email automatically gets admin role
- Perfect for known admin emails

**Example:**
```env
ADMIN_EMAILS=pastor@church.com,admin@church.com,tech@church.com
```

---

## 🛠️ Managing Admins After Setup

### Promote Member to Admin (via Admin Panel)

1. Log in as an admin
2. Go to **Admin** → **Users**
3. Find the user you want to promote
4. Click the role dropdown
5. Select **"Admin"**
6. User gets notified and gains admin access

### Promote Member to Pastor

Same process as above, but select **"Pastor"** role. Pastors can:
- Approve/reject profiles
- View pending approvals
- But cannot manage users or access user management

### Demote Admin (via Convex Dashboard)

**Safety Note:** You cannot demote the last admin or yourself.

1. Go to Convex Dashboard
2. Run `adminBootstrap:demoteAdmin`
3. Provide requester ID and target email:
   ```json
   {
     "requesterId": "j17abc123def456",
     "targetEmail": "former-admin@church.com"
   }
   ```

---

## 📊 Check Current Admin Status

**Via Convex Dashboard:**

1. Go to Functions
2. Run `adminBootstrap:checkAdminStatus`
3. View results:

```json
{
  "totalUsers": 50,
  "adminCount": 3,
  "pastorCount": 5,
  "memberCount": 42,
  "admins": [
    {
      "email": "pastor@church.com",
      "name": "Pastor John",
      "createdAt": 1234567890
    },
    {
      "email": "admin@church.com",
      "name": "Tech Admin",
      "createdAt": 1234567891
    }
  ],
  "hasAdmins": true,
  "needsBootstrap": false
}
```

---

## 🎭 User Roles Explained

### 👤 Member (Default)
- Register and create professional profile
- Browse directory
- Send messages
- View their own analytics

### 🙏 Pastor
- All member features +
- Approve/reject profiles
- View pending approvals dashboard
- Manage verification badges

### 👑 Admin
- All pastor features +
- Manage all users
- Change user roles
- Access user management dashboard
- Bulk operations
- View platform analytics
- Delete users

---

## 🚨 Important Security Notes

### ⚠️ Do NOT:
- Share admin credentials
- Use weak passwords for admin accounts
- Create admin accounts with temporary emails
- Demote yourself if you're the last admin

### ✅ DO:
- Use strong, unique passwords
- Limit number of admins to trusted individuals
- Regularly audit admin list
- Keep admin emails professional (church domain)
- Enable email verification for all users

---

## 🐛 Troubleshooting

### Problem: No one has admin access

**Solution:**
1. Check if any users exist: Run `adminBootstrap:checkAdminStatus`
2. If `needsBootstrap: true`, use Solution 2 to create an admin
3. Use `createInitialAdmin` or `promoteUserToAdmin`

### Problem: Can't find user ID for promotion

**Solution:**
Use the email-based promotion:
```json
{
  "email": "user@church.com"
}
```

### Problem: Accidentally demoted all admins

**Prevention:** The system prevents demoting the last admin
- Always ensure at least 2 admins before demotion
- Cannot demote yourself

**Recovery:**
Use Convex Dashboard → `adminBootstrap:promoteUserToAdmin`

---

## 📝 Recommended Setup Flow

### For New Deployments:
1. ✅ Deploy the app
2. ✅ Register first user (becomes auto-admin)
3. ✅ Log in and verify admin access
4. ✅ Promote 1-2 trusted members to admin (backup)
5. ✅ Assign pastor roles as needed

### For Existing Deployments:
1. ✅ Check current status: `checkAdminStatus`
2. ✅ If no admins, use `promoteUserToAdmin`
3. ✅ Test admin access
4. ✅ Document who your admins are

---

## 🎯 Quick Commands Reference

| Action | Function | Location |
|--------|----------|----------|
| Check admin status | `adminBootstrap:checkAdminStatus` | Convex Dashboard |
| Create new admin | `adminBootstrap:createInitialAdmin` | Convex Dashboard |
| Promote user to admin | `adminBootstrap:promoteUserToAdmin` | Convex Dashboard |
| Change user role | Role dropdown | Admin → Users page |
| Demote admin | `adminBootstrap:demoteAdmin` | Convex Dashboard |

---

## 💡 Best Practices

1. **Start Simple**: Use first-user-auto-admin for new deployments
2. **Have Backups**: Maintain 2-3 admin accounts minimum
3. **Use Church Emails**: Admin emails should use official church domain
4. **Document Access**: Keep a record of who has admin privileges
5. **Regular Audits**: Quarterly review of admin/pastor lists
6. **Train Admins**: Ensure admins understand their responsibilities
7. **Secure Passwords**: Require strong passwords for elevated roles

---

## 🎉 You're All Set!

Your Church Connect Pro platform now has proper admin management. Choose the solution that fits your deployment scenario and get started!

**Need help?** Check the Convex logs or run `checkAdminStatus` to verify everything is working correctly.
