# One Vote Per User Security System

## Overview
This system prevents double-voting and protects OpenAI API credits by implementing a three-layer security approach with IP-based tracking and a whitelist system.

## Whitelist Configuration
**Master Key IP:** `102.115.222.233`

This IP has unlimited access and:
- Bypasses all localStorage checks
- Bypasses all database checks
- Is NEVER inserted into `session_trackers`
- Can vote multiple times for testing purposes

**Note:** Localhost is NOT whitelisted to allow proper VPN testing.

---

## Database Schema

### Table: `session_trackers`
```sql
CREATE TABLE session_trackers (
    id BIGSERIAL PRIMARY KEY,
    ip_address TEXT NOT NULL UNIQUE,
    session_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_session_trackers_ip ON session_trackers(ip_address);
CREATE INDEX idx_session_trackers_session ON session_trackers(session_id);
```

---

## Security Layers

### Layer 1: The Initial Check (page.js)
**Priority Order:**

1. **Check LocalStorage First**
   - If `localStorage.getItem('hasVoted')` exists:
     - Verify against `session_trackers` table using user's IP
     - If database record found (and not whitelisted) → Redirect to Conclusion
     - If no database record → Clear localStorage flag (out of sync)

2. **Database Fallback**
   - If LocalStorage is empty (e.g., Incognito mode):
     - Check `session_trackers` table for current IP
     - If record exists → Set `localStorage.setItem('hasVoted', 'true')` to re-sync
     - Redirect to Conclusion

3. **Grant Access**
   - Only if both checks are clear:
     - Allow user to proceed
     - Call `triggerBackgroundAI(sessionId)`

**Implementation Location:** `src/app/page.js` - `useEffect` initialization

---

### Layer 2: Locking the Door (page.js)
**Trigger:** When user completes the 10th lyric and `onSurveyComplete` is called

**Actions (in order):**
1. Call `lockVote(userIP, sessionId)` to insert record into `session_trackers`
2. Set `localStorage.setItem('hasVoted', 'true')`
3. Transition to ConclusionScreen

**Implementation Location:** `src/app/page.js` - `handleSurveyComplete` function

**Whitelist Behavior:** Whitelisted IP skips both database lock and localStorage flag.

---

### Layer 3: API Protection (trigger-gen/route.js)
**Purpose:** Prevent manual API abuse by checking IP before OpenAI call

**Flow:**
1. Extract client IP from request headers (`x-forwarded-for` or `x-real-ip`)
2. If IP is whitelisted → Proceed with API call
3. Otherwise, query `session_trackers` for that IP
4. If record exists → Return `403 Forbidden` error
5. If no record → Proceed with OpenAI API call

**Implementation Location:** `src/app/api/trigger-gen/route.js`

---

## API Endpoints

### 1. `/api/check-vote-status` (POST)
**Purpose:** Check if an IP has already voted

**Request:**
```json
{
  "ip_address": "192.168.1.1"
}
```

**Response:**
```json
{
  "hasVoted": false,
  "isWhitelisted": false,
  "session_id": null,
  "created_at": null
}
```

---

### 2. `/api/lock-vote` (POST)
**Purpose:** Lock an IP after successful vote submission

**Request:**
```json
{
  "ip_address": "192.168.1.1",
  "session_id": "abc-123-def-456"
}
```

**Response:**
```json
{
  "success": true,
  "locked": true,
  "message": "Vote locked successfully"
}
```

**Whitelist Behavior:** Returns success but doesn't insert into database.

---

### 3. `/api/save-votes` (POST)
**Purpose:** Save votes and lock IP in database

**Request:**
```json
{
  "session_id": "abc-123",
  "votes": [...],
  "ip_address": "192.168.1.1"
}
```

**Behavior:** 
- Saves votes to `votes` table
- Inserts IP into `session_trackers` (unless whitelisted)

---

### 4. `/api/trigger-gen` (POST)
**Purpose:** Trigger OpenAI lyrics generation with IP protection

**Request:**
```json
{
  "session_id": "abc-123"
}
```

**Protection:** Checks `session_trackers` before spawning OpenAI process.

---

## Utility Functions

### `src/app/utils/ipUtils.js`

#### `getUserIP()`
Fetches user's public IP using `https://api.ipify.org?format=json`

#### `checkVoteStatus(ipAddress)`
Checks if IP has voted (calls `/api/check-vote-status`)

#### `lockVote(ipAddress, sessionId)`
Locks IP in database (calls `/api/lock-vote`)

---

## Testing Strategy

### Test Case 1: Normal User Flow
1. User visits site → IP checked → No record found → Access granted
2. User completes survey → IP locked in database + localStorage set
3. User refreshes page → localStorage check → Database verification → Redirected to Conclusion

### Test Case 2: Incognito Mode
1. User visits in Incognito → No localStorage
2. Database check → No record → Access granted
3. User completes survey → IP locked
4. User opens new Incognito window → Database check → Record found → Redirected to Conclusion

### Test Case 3: VPN Switching
1. User completes survey with VPN IP #1 → IP #1 locked
2. User switches to VPN IP #2 → New IP detected → Access granted
3. System correctly identifies as new IP

### Test Case 4: Whitelist IP (102.115.222.233)
1. Whitelist IP visits → All checks bypassed
2. User completes survey → No database lock, no localStorage flag
3. User can vote unlimited times

### Test Case 5: API Abuse Prevention
1. Attacker tries to call `/api/trigger-gen` directly
2. IP extracted from request headers
3. If IP in `session_trackers` → 403 Forbidden
4. OpenAI API call blocked → Credits protected

---

## Security Considerations

1. **IP Spoofing:** System relies on `x-forwarded-for` header which can be spoofed. Consider additional fingerprinting for production.

2. **VPN Rotation:** Users can bypass by switching VPNs. This is acceptable for research purposes.

3. **Shared IPs:** Multiple users behind same NAT/proxy will be treated as one user. Consider adding browser fingerprinting if needed.

4. **Whitelist Security:** The whitelist IP should be kept confidential and only used for testing/admin purposes.

---

## Files Modified

1. `src/app/page.js` - Layer 1 & 2 implementation
2. `src/app/screen/survey.js` - Pass userIP to save votes
3. `src/app/api/trigger-gen/route.js` - API protection layer
4. `src/app/api/save-votes/route.js` - Database locking on vote save
5. `src/app/utils/sessionUtils.js` - Updated saveVotes to accept IP
6. `src/app/backend/database.sql` - Added session_trackers table

## Files Created

1. `src/app/api/check-vote-status/route.js` - Vote status checker
2. `src/app/api/lock-vote/route.js` - Vote locker
3. `src/app/utils/ipUtils.js` - IP utility functions

---

## Deployment Checklist

- [ ] Create `session_trackers` table in Supabase
- [ ] Verify whitelist IP is correct: `102.115.222.233`
- [ ] Test normal user flow
- [ ] Test incognito mode flow
- [ ] Test VPN switching
- [ ] Test whitelist IP access
- [ ] Test API protection with direct calls
- [ ] Monitor OpenAI API usage for anomalies
