# Community Module Test Suite

Comprehensive test suite for the Community Module covering all functionality including communities, posts, comments, and replies.

## 📋 Test Structure

```
tests/
├── jest.config.js              # Jest configuration
├── setup.js                     # Test setup file
├── helpers/
│   ├── mockData.js              # Mock data for tests
│   └── prismaMock.js            # Prisma mock helper
├── community/
│   ├── services/
│   │   ├── community.service.test.js    # Community service tests
│   │   ├── post.service.test.js         # Post service tests
│   │   └── comment.service.test.js      # Comment service tests
│   ├── controllers/
│   │   └── community.controller.test.js # Controller tests
│   └── api/
│       ├── community.api.test.js        # Community API tests
│       ├── post.api.test.js             # Post API tests
│       └── comment.api.test.js          # Comment API tests
└── README.md                    # This file
```

## 🚀 Getting Started

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Only Community Module Tests

```bash
npm run test:community
```

## 📝 Test Coverage

### Service Layer Tests

#### Community Service (`community.service.test.js`)
- ✅ Create community (string and array rules)
- ✅ Get all communities (recommended, my, joined)
- ✅ Get single community
- ✅ Update community
- ✅ Delete community (with cascade deletion)
- ✅ Join community (public and private)
- ✅ Leave community
- ✅ Search communities

#### Post Service (`post.service.test.js`)
- ✅ Create post
- ✅ Get community posts
- ✅ Update post
- ✅ Delete post
- ✅ Like/Unlike post

#### Comment Service (`comment.service.test.js`)
- ✅ Create comment
- ✅ Get post comments
- ✅ Update comment
- ✅ Delete comment (with replies)
- ✅ Create comment reply
- ✅ Get comment replies
- ✅ Update comment reply
- ✅ Delete comment reply

### Controller Layer Tests

#### Community Controller (`community.controller.test.js`)
- ✅ All controller methods
- ✅ Error handling
- ✅ Request/Response validation

### API Integration Tests

#### Community API (`community.api.test.js`)
- ✅ POST /api/v1/community (Create)
- ✅ GET /api/v1/community (Get all)
- ✅ GET /api/v1/community/:id (Get single)
- ✅ PATCH /api/v1/community/:id (Update)
- ✅ DELETE /api/v1/community/:id (Delete)
- ✅ POST /api/v1/community/:id/join (Join)
- ✅ POST /api/v1/community/:id/leave (Leave)
- ✅ GET /api/v1/community/search (Search)

#### Post API (`post.api.test.js`)
- ✅ POST /api/v1/community/:id/posts (Create)
- ✅ GET /api/v1/community/:id/posts (Get all)
- ✅ PATCH /api/v1/community/posts/:id (Update)
- ✅ DELETE /api/v1/community/posts/:id (Delete)
- ✅ POST /api/v1/community/posts/:id/like (Like)

#### Comment API (`comment.api.test.js`)
- ✅ POST /api/v1/community/posts/:id/comments (Create)
- ✅ GET /api/v1/community/posts/:id/comments (Get all)
- ✅ PATCH /api/v1/community/comments/:id (Update)
- ✅ DELETE /api/v1/community/comments/:id (Delete)
- ✅ POST /api/v1/community/comments/:id/replies (Create reply)
- ✅ GET /api/v1/community/comments/:id/replies (Get replies)
- ✅ PATCH /api/v1/community/replies/:id (Update reply)
- ✅ DELETE /api/v1/community/replies/:id (Delete reply)

## 🧪 Test Scenarios Covered

### Positive Test Cases
- ✅ Successful creation of resources
- ✅ Successful retrieval of resources
- ✅ Successful updates
- ✅ Successful deletions
- ✅ Proper pagination
- ✅ Proper filtering and searching

### Negative Test Cases
- ✅ Validation errors
- ✅ Unauthorized access attempts
- ✅ Resource not found errors
- ✅ Permission denied errors
- ✅ Invalid input data

### Edge Cases
- ✅ Empty results
- ✅ Pagination boundaries
- ✅ String vs array rules
- ✅ Optional image uploads
- ✅ Cascade deletions

## 🔧 Configuration

### Jest Configuration (`jest.config.js`)
- Test environment: Node.js
- Module path aliases configured
- Coverage collection enabled
- Test timeout: 30 seconds

### Test Setup (`setup.js`)
- Environment variables loading
- Console mocking
- Global timeout configuration

## 📊 Mock Data

All mock data is centralized in `helpers/mockData.js`:
- `mockUser` - Test user object
- `mockUser2` - Second test user
- `mockCommunity` - Test community
- `mockCommunityMember` - Community membership
- `mockPost` - Test post
- `mockComment` - Test comment
- `mockCommentReply` - Test comment reply
- `mockPostLike` - Test post like
- `mockCommunityInvite` - Test invite

## 🛠️ Prisma Mocking

The `helpers/prismaMock.js` provides a complete Prisma client mock with all necessary methods for testing without a real database connection.

## 📈 Coverage Goals

- **Services**: 90%+ coverage
- **Controllers**: 85%+ coverage
- **API Routes**: 80%+ coverage

## 🐛 Debugging Tests

### Run Single Test File
```bash
jest tests/community/services/community.service.test.js
```

### Run Tests Matching Pattern
```bash
jest -t "create_community"
```

### Verbose Output
```bash
jest --verbose
```

## 📝 Writing New Tests

1. Follow the existing test structure
2. Use mock data from `helpers/mockData.js`
3. Mock Prisma using `helpers/prismaMock.js`
4. Test both positive and negative cases
5. Include edge cases
6. Add descriptive test names

## ⚠️ Notes

- Tests use mocked Prisma client (no real database required)
- Middleware is mocked for API tests
- All tests are isolated and can run independently
- Test data is reset between tests

## 🔄 Continuous Integration

These tests are designed to run in CI/CD pipelines:
- Fast execution (mocked dependencies)
- No external dependencies required
- Deterministic results
- Comprehensive coverage

---

**Last Updated**: 2024
**Test Framework**: Jest
**Test Environment**: Node.js
