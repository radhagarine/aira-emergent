/**
 * Mock implementation of the File API for testing
 */
export class MockFile {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  
    constructor(
      private bits: Array<string | ArrayBuffer | Blob>,
      name: string,
      options?: { type?: string; lastModified?: number }
    ) {
      this.name = name;
      this.size = bits.reduce((size, bit) => size + (bit as string).length, 0);
      this.type = options?.type || '';
      this.lastModified = options?.lastModified || Date.now();
    }
  
    // Add other File API methods as needed
    slice() {
      return new MockFile(this.bits, this.name);
    }
  
    stream() {
      throw new Error('Not implemented');
    }
  
    text() {
      return Promise.resolve(this.bits.join(''));
    }
  
    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(this.size));
    }
  }
  
  // Make TypeScript treat our MockFile as File
  declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Vi {
      interface Assertion extends jest.Matchers<void, any> {}
      interface AsymmetricMatchersContaining extends jest.Matchers<void, any> {}
    }
  }
  
  // Add File to window for testing
  if (typeof window !== 'undefined') {
    (window as any).File = MockFile;
  } else {
    // For Node.js environment
    (globalThis as any).File = MockFile;
  }