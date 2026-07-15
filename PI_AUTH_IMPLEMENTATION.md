# Pi Network Authentication Implementation

This document describes the Pi Network authentication flow implemented in Web3Currency (W3C).

## Overview

Pi Network authentication is automatically triggered when the app loads, with a manual sign-in button available in the profile menu for users who dismissed the initial prompt.

## Authentication Flow

### 1. App Startup (Auto-Authentication)
- **Trigger**: App loads in Pi Browser
- **Process**:
  1. `UserProvider` (lib/user-context.tsx) initializes on mount
  2. Awaits `piSDK.init()` to fully initialize the Pi SDK v2
  3. Attempts automatic Pi.authenticate() with "username" scope
  4. User approves/denies in Pi Browser UI
  5. If approved, proceeds to Step 2

### 2. Token Validation (Backend)
- **Trigger**: Access token received from Pi.authenticate()
- **Process**:
  1. Client sends `POST /api/pi/validate` with:
     - `accessToken` (from Pi Network)
     - `uid` (user ID from Pi)
     - `username` (Pi username)
  2. Backend calls `GET https://api.minepi.com/v2/me` with Bearer token
  3. Pi API validates token and returns user data
  4. Backend verifies uid matches
  5. Returns success/failure to client

### 3. Session Establishment
- **On Success**:
  - User data saved to localStorage with expiration (30 days)
  - User object set in context
  - Auth dialog closes
  - Success toast displayed
- **On Failure**:
  - Token validation logs error
  - User remains unauthenticated
  - Auth dialog closes
  - Error toast displayed

### 4. Manual Sign-In Button
- **Location**: Profile menu (click user icon → "Sign In with Pi")
- **Trigger**: User manually initiates authentication
- **Process**: Same as steps 1-3, but user-triggered

### 5. Logout
- **Trigger**: User clicks "Disconnect" in profile menu
- **Process**:
  - localStorage cleared
  - User object set to null
  - Session ended

## Key Implementation Details

### Scope
- Only "username" scope is requested
- No wallet, file, or financial permissions needed
- Minimal permission footprint

### Access Token Validation
- **Client-side**: None - token used immediately
- **Backend-side**: Required
  - Calls Pi API v2 endpoint: `https://api.minepi.com/v2/me`
  - Uses `Authorization: Bearer <accessToken>` header
  - No Pi API key needed for this endpoint
  - UID verification prevents token forgery

### Session Management
- localStorage key: `w3c_pi_user`
- Session expires after 30 days
- Automatic session restoration on app reload

## File Locations

| File | Purpose |
|------|---------|
| `lib/pi-sdk.ts` | Pi SDK initialization, auth logic, token validation |
| `lib/user-context.tsx` | React context for user state, auto-auth trigger |
| `components/pi-signin-button.tsx` | Standalone sign-in button component |
| `components/pi-auth-dialog.tsx` | Permission confirmation dialog |
| `components/profile-menu.tsx` | Profile menu with auth UI |
| `app/api/pi/validate/route.ts` | Backend token validation endpoint |
| `lib/system-config.ts` | Pi SDK configuration (SDK_URL, SANDBOX mode) |

## Testing

### Manual Testing (Pi Browser)
1. Open app in Pi Browser on testnet
2. Auto-auth prompt appears → approve
3. Token validates, session established
4. Username displayed in profile menu
5. Refresh page → session restored from localStorage
6. Click Disconnect → logout

### Manual Testing (Non-Pi Browser)
1. Auto-auth is skipped (Pi.init fails gracefully)
2. Sign-in button shows "Loading..."
3. Button disabled until Pi SDK available (or timeout)
4. User can sign out, button shows "Sign In with Pi"

### Error Scenarios
- Token expired: Backend returns 401, user prompted to re-authenticate
- UID mismatch: Backend blocks, user logs error
- Network error: Graceful error handling, retry prompt

## Security Considerations

✅ **Implemented:**
- Backend token validation (no trust of client)
- UID verification prevents token swapping
- Access token never logged
- Session expiration (30 days)
- HTTPS only in production

⚠️ **Not Implemented (By Design):**
- CSRF tokens (API is stateless, no cookies)
- Session storage server-side (Pi Network session model)
- Refresh tokens (use one-time access tokens)

## References

- Pi SDK Docs: https://pi-apps.github.io/pi-sdk-docs/
- Pi API v2: https://api.minepi.com/v2/me (Bearer token validation)
- Pi Network Testnet: https://testnet.minepi.com
