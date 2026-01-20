import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
    private supabase: SupabaseClient;
    private readonly logger = new Logger(SupabaseService.name);
    private isConfigured = false;

    constructor(private configService: ConfigService) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        // Validate configuration
        if (!supabaseUrl || !supabaseServiceKey) {
            this.logger.warn('⚠️  Supabase credentials not configured');
            this.logger.warn('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
        } else {
            // Validate URL format
            if (!this.isValidSupabaseUrl(supabaseUrl)) {
                this.logger.error(`❌ Invalid Supabase URL format: ${supabaseUrl}`);
                this.logger.error('Expected format: https://your-project-id.supabase.co');
            }

            // Validate and log API key format
            this.validateAndLogApiKey(supabaseServiceKey);
            this.isConfigured = true;
        }

        // Create Supabase client with enhanced configuration
        this.supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
            global: {
                headers: {
                    'X-Client-Info': 'membership-system-backend',
                },
            },
        });
    }

    /**
     * Lifecycle hook - runs after module initialization
     * Tests the Supabase connection
     */
    async onModuleInit() {
        if (this.isConfigured) {
            await this.testConnection();
        }
    }

    /**
     * Validates Supabase URL format
     */
    private isValidSupabaseUrl(url: string): boolean {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.endsWith('.supabase.co') || urlObj.hostname.endsWith('.supabase.in');
        } catch {
            return false;
        }
    }

    /**
     * Validates and logs API key format
     * Supports both legacy and new sb_ prefixed keys
     */
    private validateAndLogApiKey(apiKey: string): void {
        const maskedKey = this.maskApiKey(apiKey);

        // Check for new format (sb_ prefix)
        if (apiKey.startsWith('sb_')) {
            this.logger.log(`✅ Using NEW Supabase API key format: ${maskedKey}`);
            this.logger.log('📌 New format (sb_*) is fully supported');
        }
        // Check for legacy format (eyJ prefix - JWT format)
        else if (apiKey.startsWith('eyJ')) {
            this.logger.log(`✅ Using LEGACY Supabase API key format: ${maskedKey}`);
            this.logger.log('📌 Legacy format is supported but consider migrating to new format');
        }
        // Unknown format
        else {
            this.logger.warn(`⚠️  Unknown API key format: ${maskedKey}`);
            this.logger.warn('Expected formats: sb_* (new) or eyJ* (legacy JWT)');
        }

        // Validate key length
        if (apiKey.length < 32) {
            this.logger.error('❌ API key appears too short - may be invalid');
        }
    }

    /**
     * Masks API key for safe logging
     */
    private maskApiKey(key: string): string {
        if (key.length <= 12) return '***';
        return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
    }

    /**
     * Tests the Supabase connection
     */
    private async testConnection(): Promise<void> {
        try {
            this.logger.log('🔍 Testing Supabase connection...');

            // Try to list auth users (admin operation)
            const { data, error } = await this.supabase.auth.admin.listUsers({
                page: 1,
                perPage: 1,
            });

            if (error) {
                this.logger.error(`❌ Supabase connection test failed: ${error.message}`);
                if (error.message.includes('Invalid API key')) {
                    this.logger.error('💡 Tip: Verify your SUPABASE_SERVICE_ROLE_KEY is correct');
                    this.logger.error('💡 Both old (eyJ*) and new (sb_*) formats are supported');
                }
            } else {
                this.logger.log('✅ Supabase connection successful!');
                this.logger.log(`📊 Auth service is operational (found ${data.users.length} user(s) in test query)`);
            }
        } catch (error) {
            this.logger.error('❌ Supabase connection test error:', error.message);
        }
    }

    getClient(): SupabaseClient {
        return this.supabase;
    }

    // ==================== Auth Admin Operations ====================

    async createUser(email: string, password: string, metadata?: Record<string, any>): Promise<User | null> {
        const { data, error } = await this.supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: metadata,
        });

        if (error) {
            this.logger.error(`Failed to create user: ${error.message}`);
            throw error;
        }

        return data.user;
    }

    async deleteUser(userId: string): Promise<void> {
        const { error } = await this.supabase.auth.admin.deleteUser(userId);

        if (error) {
            this.logger.error(`Failed to delete user: ${error.message}`);
            throw error;
        }
    }

    async getUserById(userId: string): Promise<User | null> {
        const { data, error } = await this.supabase.auth.admin.getUserById(userId);

        if (error) {
            this.logger.error(`Failed to get user: ${error.message}`);
            return null;
        }

        return data.user;
    }

    async updateUser(userId: string, attributes: { email?: string; password?: string; user_metadata?: Record<string, any> }): Promise<User | null> {
        const { data, error } = await this.supabase.auth.admin.updateUserById(userId, attributes);

        if (error) {
            this.logger.error(`Failed to update user: ${error.message}`);
            throw error;
        }

        return data.user;
    }

    // ==================== Token Verification ====================

    async verifyToken(token: string): Promise<User | null> {
        const { data, error } = await this.supabase.auth.getUser(token);

        if (error) {
            this.logger.warn(`Token verification failed: ${error.message}`);
            return null;
        }

        return data.user;
    }

    // ==================== Storage Operations ====================

    async uploadFile(bucket: string, path: string, file: Buffer, contentType?: string): Promise<string | null> {
        const { data, error } = await this.supabase.storage
            .from(bucket)
            .upload(path, file, { contentType });

        if (error) {
            this.logger.error(`Failed to upload file: ${error.message}`);
            throw error;
        }

        return data.path;
    }

    async getPublicUrl(bucket: string, path: string): Promise<string> {
        const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    }

    async deleteFile(bucket: string, paths: string[]): Promise<void> {
        const { error } = await this.supabase.storage.from(bucket).remove(paths);

        if (error) {
            this.logger.error(`Failed to delete file: ${error.message}`);
            throw error;
        }
    }
}
