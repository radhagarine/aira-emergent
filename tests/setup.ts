import { vi, beforeAll, afterAll, beforeEach } from 'vitest'
import '@testing-library/jest-dom';

// Force React to be in development mode
vi.mock('react', async () => {
  const actualReact = await vi.importActual('react');
  return {
    ...actualReact,
    // Enable act() warnings
    __REACT_DEVTOOLS_GLOBAL_HOOK__: { isDisabled: false },
    // Explicitly provide the act function that testing-library expects
    unstable_act: actualReact.act || function(callback: () => void | Promise<void>) {
      return callback();
    }
  };
});

// Override React's process.env to development mode
beforeAll(() => {
  // This simulates setting NODE_ENV to development for React
  vi.stubGlobal('process', {
    ...process,
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });

  // Mock browser APIs not available in the test environment
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });

  // Mock window.scrollTo
  window.scrollTo = vi.fn();
});

// Mock implementations that should be available for all tests
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: vi.fn().mockReturnValue({
    // Add any default Supabase client mocks here
  }),
}))

// Add any global test setup here
// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})

// Clean up after all tests
afterAll(() => {
  vi.restoreAllMocks();
})