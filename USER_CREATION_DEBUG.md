# PocketBase User Creation Debug Guide

## Issue Identified
The automatic user creation is failing due to a **JavaScript function hoisting issue** in the PocketBase hook file `pb_hooks/init_users.pb.js`.

## Root Cause
The bootstrap hook and router endpoint were calling `createAdminUser()` and `createTestUser()` functions before they were defined in the file. While JavaScript normally hoists function declarations, PocketBase's hook environment doesn't handle this properly.

## Solution Applied
Restructured `pb_hooks/init_users.pb.js` to define functions first, then register hooks:

```javascript
// ✅ Functions defined first
function createAdminUser() { ... }
function createTestUser() { ... }

// ✅ Hooks registered after functions
onBootstrap((e) => { ... })
routerAdd("GET", "/setup-users", (c) => { ... })
```

## Testing the Fix

### 1. Manual Test Endpoint
```bash
curl https://cli.a-g-e-n-t.de/setup-users
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "User setup completed",
  "results": [
    {"type": "admin", "status": "created", "email": "admin@vergabe.de"},
    {"type": "user", "status": "created", "email": "test@vergabe.de"}
  ]
}
```

### 2. Authentication Test
```bash
# Test user authentication
curl -X POST https://cli.a-g-e-n-t.de/api/collections/users/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{"identity":"test@vergabe.de","password":"test123456"}'
```

**Expected Success Response:**
```json
{
  "token": "eyJ...",
  "record": {
    "id": "...",
    "email": "test@vergabe.de",
    "username": "testuser"
  }
}
```

## Critical Action Required: Restart PocketBase

**🚨 IMPORTANT:** After code changes, PocketBase MUST be restarted to reload hooks.

### In Coolify Deployment:
1. Go to your Coolify dashboard
2. Navigate to your application
3. Click "Restart" or "Redeploy"
4. Wait for the container to restart
5. Check deployment logs for bootstrap messages

### Expected Bootstrap Log Messages:
```
🔧 Bootstrap: Starting automatic user setup...
Admin setup result: {"type":"admin","status":"created","email":"admin@vergabe.de"}
Test user setup result: {"type":"user","status":"created","email":"test@vergabe.de"}
✅ Automatic user setup completed
```

## User Credentials

### Admin User (Superuser)
- **Email:** admin@vergabe.de
- **Password:** admin123456
- **Access:** https://cli.a-g-e-n-t.de/_/

### Test User (Regular User)
- **Email:** test@vergabe.de
- **Password:** test123456
- **Access:** https://cli.a-g-e-n-t.de/debug.html

## Troubleshooting Steps

### 1. Check if Hook is Deployed
```bash
# In your local repository
git status
git log --oneline -3
```

### 2. Verify Container Status
In Coolify, check:
- Container is running
- No restart loops
- Logs show PocketBase starting successfully

### 3. Manual User Creation
If bootstrap still fails, use the manual endpoint:
```bash
curl https://cli.a-g-e-n-t.de/setup-users
```

### 4. Check for JavaScript Errors
Look for these error patterns in deployment logs:
- "createAdminUser is not defined"
- "createTestUser is not defined"
- Any JavaScript syntax errors in hook files

## Alternative Manual Setup

If automated setup continues to fail:

### Method 1: Direct PocketBase Admin
1. Visit https://cli.a-g-e-n-t.de/_/
2. If setup screen appears, create initial admin
3. Use admin interface to create test user

### Method 2: Command Line (if shell access available)
```bash
# Create admin user
./pocketbase superuser upsert admin@vergabe.de admin123456

# Create test user via API
curl -X POST https://cli.a-g-e-n-t.de/api/collections/users/records \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@vergabe.de",
    "password": "test123456",
    "passwordConfirm": "test123456",
    "name": "Test User"
  }'
```

## Prevention for Future

### 1. Hook Development Best Practices
- Always define functions before using them
- Test hooks locally before deployment
- Use the debug script: `./debug-user-creation.sh`

### 2. Deployment Checklist
- [ ] Code changes committed
- [ ] PocketBase restarted after hook changes
- [ ] Bootstrap logs checked
- [ ] Manual endpoint tested
- [ ] User authentication tested

### 3. Monitoring
- Check deployment logs regularly
- Monitor user creation success rate
- Set up alerts for hook failures

## Debug Script Usage

Run the included debug script to check system status:
```bash
./debug-user-creation.sh
```

This script will:
- Check PocketBase health
- Test user creation endpoint
- Verify user authentication
- Provide specific recommendations

## Next Steps

1. **Restart PocketBase in Coolify** (most critical)
2. **Check deployment logs** for bootstrap messages
3. **Test the manual endpoint** once restarted
4. **Verify user login** with provided credentials

The fix has been applied to the codebase. The remaining issue is that the running server needs to be restarted to load the updated hook file.