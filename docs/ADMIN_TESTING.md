# Admin System Testing Documentation

## Overview

This document outlines the comprehensive testing strategy for the NotesFlow admin system, including unit tests, integration tests, security tests, and end-to-end tests.

## Test Structure

### 1. Unit Tests

#### Permission System Tests (`lib/auth/__tests__/admin-permissions.test.ts`)
- Tests permission constants and hierarchy
- Validates default permission assignments
- Tests permission checking functions
- Ensures system admins have all permissions

#### Admin Service Tests (`lib/auth/__tests__/admin-service.test.ts`)
- Tests user role checking (admin/system_admin)
- Validates permission retrieval logic
- Tests admin promotion/demotion
- Verifies permission updates
- Tests admin activity recording

### 2. Integration Tests

#### Admin API Tests (`app/api/admin/__tests__/users.test.ts`)
- Tests authentication requirements
- Validates permission checks
- Tests pagination and filtering
- Verifies error handling
- Tests database query security

### 3. Component Tests

#### Admin Layout Tests (`app/(protected)/dashboard/admin/__tests__/layout.test.tsx`)
- Tests admin route protection
- Validates layout rendering
- Tests responsive design elements

#### Admin Dashboard Tests (`app/(protected)/dashboard/admin/__tests__/page.test.tsx`)
- Tests dashboard data fetching
- Validates statistics display
- Tests role-based UI elements

### 4. Security Tests

#### Middleware Tests (`__tests__/middleware.test.ts`)
- Tests route protection
- Validates authentication redirects
- Tests admin route access control

#### Database Security Tests (`lib/db/__tests__/security.test.ts`)
- Tests Row Level Security (RLS) patterns
- Validates data isolation
- Tests admin access patterns
- Verifies query parameterization

### 5. End-to-End Tests

#### Admin Workflow Tests (`__tests__/e2e/admin-workflow.test.ts`)
- Tests complete admin user journey
- Validates user management workflows
- Tests content moderation
- Verifies system configuration
- Tests analytics and reporting

## Running Tests

### Run All Tests
```bash
bun test
```

### Run Admin-Specific Tests
```bash
bun test:admin
```

### Run Security Tests
```bash
bun test:security
```

### Run E2E Tests
```bash
bun test:e2e
```

### Run Tests with Coverage
```bash
bun test:coverage
```

### Watch Mode for Development
```bash
bun test:watch
```

## Test Coverage Goals

- **Unit Tests**: 90%+ coverage for core admin functions
- **Integration Tests**: 80%+ coverage for API endpoints
- **Security Tests**: 100% coverage for permission checks
- **E2E Tests**: Cover all critical admin workflows

## Security Testing Checklist

### Authentication & Authorization
- [ ] Verify unauthenticated access is blocked
- [ ] Test permission boundaries between roles
- [ ] Validate session expiration handling
- [ ] Test concurrent session management

### Data Access Control
- [ ] Verify users can only access their own data
- [ ] Test admin access to all user data
- [ ] Validate RLS policies are enforced
- [ ] Test data isolation between tenants

### Input Validation
- [ ] Test SQL injection prevention
- [ ] Validate XSS protection
- [ ] Test CSRF protection
- [ ] Verify rate limiting

### Audit Trail
- [ ] Test admin activity logging
- [ ] Verify audit log integrity
- [ ] Test log retention policies
- [ ] Validate sensitive data masking

## Performance Testing

### Load Testing
- Test admin dashboard with 1000+ users
- Verify pagination performance
- Test concurrent admin operations
- Measure API response times

### Stress Testing
- Test system under high admin activity
- Verify database connection pooling
- Test cache effectiveness
- Measure memory usage

## Best Practices

### Writing Tests
1. Use descriptive test names
2. Follow AAA pattern (Arrange, Act, Assert)
3. Mock external dependencies
4. Test both success and failure cases
5. Keep tests isolated and independent

### Test Data Management
1. Use factory functions for test data
2. Clean up after each test
3. Use realistic data scenarios
4. Avoid hardcoded test values

### Continuous Integration
1. Run tests on every PR
2. Block merges on test failures
3. Monitor test execution time
4. Track coverage trends

## Common Testing Scenarios

### Testing Permission Checks
```typescript
it('should deny access without required permission', async () => {
  const user = createTestUser({ role: 'admin', permissions: [] });
  const result = await checkPermission(user.id, ADMIN_PERMISSIONS.USER_DELETE);
  expect(result).toBe(false);
});
```

### Testing API Authorization
```typescript
it('should return 403 for insufficient permissions', async () => {
  mockAuthMiddleware({ user: regularUser });
  const response = await GET(request);
  expect(response.status).toBe(403);
});
```

### Testing Database Security
```typescript
it('should filter results by user ownership', async () => {
  const query = db.select().from(notes).where(eq(notes.userId, userId));
  const results = await query;
  results.forEach(note => {
    expect(note.userId).toBe(userId);
  });
});
```

## Troubleshooting

### Common Issues
1. **Mock not working**: Ensure vi.mock() is at the top of the file
2. **Async test timeout**: Increase timeout for integration tests
3. **Database connection**: Use test database for integration tests
4. **Type errors**: Update test types when schema changes

### Debug Commands
```bash
# Run specific test file
bun test lib/auth/__tests__/admin-service.test.ts

# Run tests matching pattern
bun test -t "permission"

# Debug with console output
bun test --reporter=verbose
```

## Future Improvements

1. Add visual regression tests for admin UI
2. Implement automated penetration testing
3. Add performance benchmarks to CI
4. Create test data fixtures
5. Add mutation testing for better coverage

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)