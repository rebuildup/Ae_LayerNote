# Testing Documentation

This directory contains comprehensive tests for the AE Code Editor Extension.

## Test Structure

```
test/
├── __mocks__/           # Mock files for assets
├── components/          # Component unit tests
├── contexts/           # Context and state management tests
├── e2e/               # End-to-end user workflow tests
├── integration/       # Integration tests
├── lib/               # Library and utility tests
├── setup.ts           # Test environment setup
├── test-utils.tsx     # Custom testing utilities
└── README.md          # This file
```

## Test Types

### Unit Tests

- **Location**: `components/`, `contexts/`, `lib/`
- **Purpose**: Test individual components and functions in isolation
- **Run**: `npm run test:unit`

### Integration Tests

- **Location**: `integration/`
- **Purpose**: Test component interactions and data flow
- **Run**: `npm run test:integration`

### End-to-End Tests

- **Location**: `e2e/`
- **Purpose**: Test complete user workflows and scenarios
- **Run**: `npm run test:e2e`

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests for CI
npm run test:ci
```

## Test Utilities

### Custom Render Function

```typescript
import { render } from '../test-utils';

// Renders component with all necessary providers
render(<MyComponent />);
```

### Mock Data Factories

```typescript
import { createMockNote, createMockLayerInfo } from '../test-utils';

const mockNote = createMockNote({ title: 'Custom Title' });
const mockLayer = createMockLayerInfo({ name: 'Custom Layer' });
```

### Storage Mocking

```typescript
import { mockStorageSuccess, mockStorageError } from '../test-utils';

// Mock successful storage operations
mockStorageSuccess();

// Mock storage errors
mockStorageError('Storage failed');
```

## Mocked Dependencies

### CEP Environment

- `window.cep` - Mocked CEP API
- `window.cep_node` - Mocked Node.js integration
- File system operations
- Event system

### Monaco Editor

- Editor component with textarea fallback
- Editor methods and options
- Syntax highlighting (mocked)

### Browser APIs

- `localStorage`
- `clipboard`
- `PerformanceObserver`
- `ResizeObserver`
- `IntersectionObserver`

## Writing Tests

### Component Tests

```typescript
import { render, screen, fireEvent } from '../test-utils';
import MyComponent from '../../components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    render(<MyComponent />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Updated Text')).toBeInTheDocument();
  });
});
```

### Context Tests

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyContext, MyProvider } from '../../contexts/MyContext';

const wrapper = ({ children }) => <MyProvider>{children}</MyProvider>;

describe('MyContext', () => {
  it('should provide correct initial state', () => {
    const { result } = renderHook(() => useMyContext(), { wrapper });
    expect(result.current.state).toEqual(expectedInitialState);
  });
});
```

### Async Tests

```typescript
import { waitFor } from '@testing-library/react';

it('should handle async operations', async () => {
  render(<AsyncComponent />);

  await waitFor(() => {
    expect(screen.getByText('Loaded Data')).toBeInTheDocument();
  });
});
```

## Coverage Requirements

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the user sees and does
   - Avoid testing internal state directly

2. **Use Descriptive Test Names**
   - Clearly describe what is being tested
   - Include the expected outcome

3. **Arrange, Act, Assert**
   - Set up test data (Arrange)
   - Perform the action (Act)
   - Verify the result (Assert)

4. **Mock External Dependencies**
   - Mock API calls and external services
   - Use consistent mock data

5. **Test Error Scenarios**
   - Test both success and failure cases
   - Verify error handling and recovery

6. **Keep Tests Independent**
   - Each test should be able to run in isolation
   - Clean up after each test

## Debugging Tests

### Debug Mode

```bash
npm run test:debug
```

### Console Logging

```typescript
// Temporarily enable console in tests
beforeEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
```

### Test-Specific Debugging

```typescript
it.only('should debug this specific test', () => {
  // Only this test will run
});
```

## Continuous Integration

Tests are configured to run in CI with:

- Coverage reporting
- JUnit XML output
- Fail-fast on errors
- No watch mode

The CI configuration ensures all tests pass before deployment.
