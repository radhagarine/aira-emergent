// tests/utils/mocks/supabase-mock.ts
import { vi } from 'vitest';
import { DatabaseError } from '@/lib/types/shared/error.types';
import { PostgrestResponse, PostgrestError } from '@supabase/supabase-js';

export class SupabaseMock {
    private responses: Map<string, PostgrestResponse<any>> = new Map();
    private queryChain: string[] = [];
    private mockData: Map<string, any> = new Map();
    private existsOverrides: Map<string, boolean> = new Map();

    constructor() {
        this.resetMocks();
    }

    resetMocks() {
        this.responses.clear();
        this.queryChain = [];
        this.mockData.clear();
        this.existsOverrides.clear();
    }

    from(tableName: string) {
        this.queryChain = [tableName];
        return this.createChainableMethod();
    }

    private createChainableMethod() {
        const self = this;
        return {
            select(columns?: string | string[], options?: { count?: 'exact', head?: boolean }) {
                self.queryChain.push(`select:${columns || '*'}`);
                if (options?.count) self.queryChain.push('count');
                if (options?.head) self.queryChain.push('head');
                return this;
            },
            insert(values: any) {
                self.queryChain.push(`insert`);
                return this;
            },
            update(values: any) {
                self.queryChain.push(`update`);
                return this;
            },
            delete() {
                self.queryChain.push(`delete`);
                return this;
            },
            eq(column: string, value: any) {
                self.queryChain.push(`eq:${column}:${value}`);
                return this;
            },
            order(column: string, options?: { ascending: boolean }) {
                self.queryChain.push(`order:${column}:${options?.ascending ? 'asc' : 'desc'}`);
                return this;
            },
            single() {
                self.queryChain.push('single');
                return self.getResponse();
            },
            then(resolve: (value: PostgrestResponse<any>) => void) {
                resolve(self.getResponse());
            },
            gt(column: string, value: any) {
                self.queryChain.push(`gt:${column}:${value}`);
                return this;
            },
            gte(column: string, value: any) {
                self.queryChain.push(`gte:${column}:${value}`);
                return this;
            },
            lt(column: string, value: any) {
                self.queryChain.push(`lt:${column}:${value}`);
                return this;
            },
            lte(column: string, value: any) {
                self.queryChain.push(`lte:${column}:${value}`);
                return this;
            },
            neq(column: string, value: any) {
                self.queryChain.push(`neq:${column}:${value}`);
                return this;
            }
        };
    }

    setExistsOverride(column: string, value: any, exists: boolean) {
        const key = `${column}:${value}`;
        this.existsOverrides.set(key, exists);
    }

    mockResponse(queryChain: string[], response: { data: any; error: any; count?: number }) {
        const mockResponse: PostgrestResponse<any> = {
            data: response.data,
            error: response.error,
            status: 200,
            statusText: 'OK',
            count: response.count ?? null
        };
        this.responses.set(queryChain.join('.'), mockResponse);
    }

    private getResponse(): PostgrestResponse<any> {
        const queryString = this.queryChain.join('.');
        
        // Try exact match first
        const exactMatch = this.responses.get(queryString);
        if (exactMatch) {

            // Handle 'No rows' case explicitly
            if (exactMatch.error && exactMatch.error.code === 'PGRST116') {
                return { 
                    data: null, 
                    error: exactMatch.error,
                    status: 406,  // Not Acceptable
                    statusText: 'No rows returned',
                    count: null
                };
            }
            
            if (exactMatch.error) {
                throw new DatabaseError(
                    exactMatch.error.message,
                    exactMatch.error.code,
                    exactMatch.error.details
                );
            }
            return exactMatch;
        }

        // Try to find partial match
        const entries = Array.from(this.responses.entries());
        const matchingEntry = entries.find(([key]) => queryString.includes(key));
        
        if (matchingEntry) {
            const [_, response] = matchingEntry;
            if (response.error) {
                throw new DatabaseError(
                    response.error.message,
                    response.error.code,
                    response.error.details
                );
            }
            return response;
        }

        // Return default response
        return { 
            data: [], 
            error: null,
            status: 200,
            statusText: 'OK',
            count: null
        };
    }

    storage = {
        from: (bucket: string) => ({
            upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
            createSignedUploadUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'test-signed-url' }, error: null }),
            getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'test-public-url' }, error: null }),
            remove: vi.fn().mockResolvedValue({ data: null, error: null })
        })
    };
}