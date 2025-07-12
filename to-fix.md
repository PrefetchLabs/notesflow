# Production Ready To-Fix List

## Critical Security Fixes (Priority 1)

### 1. Remove All Console.log Statements
**Files to check:** Run `grep -r "console\." --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .`
- Remove or comment out all console.log, console.error, console.warn statements
- Replace with proper logging service if needed
- **Exception:** Can keep in development-only code blocks

### 2. Fix CORS Configuration in WebSocket Servers
**Files:** `/server/yjs-server.js`, `/server/yjs-server-minimal.js`, `/server/yjs-server-rocksdb.js`
- Change `Access-Control-Allow-Origin: '*'` to specific allowed origins
- Add environment variable `ALLOWED_ORIGINS` in .env
- Example fix:
```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
// Use allowedOrigins to validate origin
```

### 3. Add CSRF Protection
**Location:** Create new middleware file
- Install CSRF package: `bun add csrf`
- Create `/middleware/csrf.ts`
- Add CSRF token generation and validation
- Apply to all POST, PUT, DELETE routes

### 4. Remove Hardcoded API Keys
**File:** `/lib/ai/blocknote-ai-model.ts`
- Remove line: `apiKey: 'sk-dummy-key-handled-server-side'`
- Ensure API key is only used server-side
- Never expose API keys in client code

### 5. Add Input Validation to All API Routes
**Files:** All files in `/app/api/`
- Install zod if not already: `bun add zod`
- Create validation schemas for each endpoint
- Example for `/app/api/time-blocks/route.ts`:
```typescript
import { z } from 'zod';

const createTimeBlockSchema = z.object({
  title: z.string().min(1).max(200),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().max(10).optional(),
  type: z.enum(['event', 'task']).optional()
});

// Validate before processing:
const validatedData = createTimeBlockSchema.parse(body);
```

## High Priority Fixes (Priority 2)

### 6. Sanitize Error Messages
**Files:** All API routes and error handlers
- Never return error.message or error.stack to client
- Create standard error responses:
```typescript
// Bad:
return NextResponse.json({ error: error.message }, { status: 500 });

// Good:
console.error('API Error:', error); // Log full error server-side
return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
```

### 7. Add Rate Limiting
**Location:** Create middleware
- Install rate limiter: `bun add @upstash/ratelimit @upstash/redis`
- Create `/middleware/rateLimit.ts`
- Apply to all API routes, especially AI endpoints
- Set limits: 10 requests per minute for AI, 100 for regular APIs

### 8. Implement Proper Environment Variable Validation
**File:** Create `/lib/env.ts`
- Validate all required environment variables on startup
- Example:
```typescript
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

### 9. Add Security Headers
**File:** `/middleware.ts` or `next.config.js`
- Add security headers:
```typescript
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
];
```

### 10. Remove Development/Test Files from Production
**Files to remove:**
- `/scripts/test-*.ts`
- Any `.test.ts` or `.spec.ts` files
- Development-only utilities
- Add these to `.gitignore` for production builds

## Medium Priority Fixes (Priority 3)

### 11. Add Proper Error Boundaries
**Location:** Create error boundary components
- Create `/components/error-boundary.tsx`
- Wrap main application components
- Show user-friendly error messages
- Log errors to monitoring service

### 12. Implement Content Security Policy (CSP)
**File:** `/next.config.js` or middleware
- Add CSP headers to prevent XSS attacks
- Start with report-only mode
- Example:
```javascript
"Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
```

### 13. Add Database Query Timeouts
**Files:** All database queries
- Add timeout to prevent long-running queries
- Example with Drizzle:
```typescript
const result = await db.select().from(table).timeout(5000); // 5 second timeout
```

### 14. Implement Proper Session Management
**Files:** Auth-related files
- Set proper session expiry times
- Implement session rotation
- Add "remember me" functionality properly
- Clear sessions on logout

### 15. Add Request Size Limits
**File:** `/next.config.js`
- Limit body parser size:
```javascript
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
```

## Performance & Optimization (Priority 4)

### 16. Remove Unused Dependencies
**File:** `package.json`
- Run `bunx depcheck` to find unused dependencies
- Remove any unused packages
- Update all packages to latest stable versions

### 17. Optimize Database Queries
**Files:** Database query files
- Add proper indexes (already mostly done)
- Use select() with specific columns instead of selecting all
- Batch operations where possible
- Add query result caching

### 18. Add Loading States for All Async Operations
**Files:** All components with data fetching
- Add proper loading skeletons
- Handle error states
- Add retry mechanisms for failed requests

### 19. Implement Proper Image Optimization
**Files:** Components using images
- Use next/image for all images
- Add proper width/height attributes
- Implement lazy loading
- Add blur placeholders

### 20. Add Monitoring and Analytics
**Location:** Create monitoring setup
- Add error tracking (Sentry or similar)
- Add performance monitoring
- Add user analytics (privacy-friendly)
- Set up alerts for errors

## Code Quality (Priority 5)

### 21. Add TypeScript Strict Mode Checks
**File:** `tsconfig.json`
- Enable all strict checks:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### 22. Add API Documentation
**Location:** Create `/docs/api.md`
- Document all API endpoints
- Include request/response examples
- Add authentication requirements
- Document rate limits

### 23. Add Database Backup Strategy
**Location:** Create backup scripts
- Set up automated backups
- Test restore procedures
- Document backup/restore process
- Set up backup monitoring

### 24. Add Health Check Endpoint
**File:** Create `/app/api/health/route.ts`
- Check database connection
- Check external service availability
- Return structured health status
- Use for monitoring/alerting

### 25. Implement Proper Secrets Management
**Files:** All files using environment variables
- Never commit .env files
- Use secrets management service in production
- Rotate keys regularly
- Document all required environment variables

## Testing Requirements (Priority 6)

### 26. Add Unit Tests for Critical Functions
**Location:** Create test files
- Test authentication flows
- Test data validation
- Test error handling
- Test utility functions

### 27. Add Integration Tests
**Location:** Create integration test suite
- Test API endpoints
- Test database operations
- Test third-party integrations
- Test WebSocket connections

### 28. Add E2E Tests for Critical User Flows
**Location:** Create E2E test suite
- Test user registration/login
- Test note creation/editing
- Test collaboration features
- Test payment flows

## Deployment Preparation (Priority 7)

### 29. Create Production Build Configuration
**Files:** Configuration files
- Separate development and production configs
- Minimize bundle sizes
- Enable all optimizations
- Remove source maps in production

### 30. Add Deployment Documentation
**File:** Create `/docs/deployment.md`
- Document deployment process
- List all environment variables
- Include troubleshooting guide
- Add rollback procedures

---

## How to Use This List

1. Start with Priority 1 (Critical Security) items first
2. Each task can be done independently
3. Test thoroughly after each change
4. Commit each fix separately with descriptive messages
5. Mark items as complete by adding ✅ when done
6. Ask for help if any task is unclear

## Testing Checklist for Each Fix
- [ ] Change implemented correctly
- [ ] No new errors introduced
- [ ] Feature still works as expected
- [ ] Tests pass (if applicable)
- [ ] Code reviewed by senior developer