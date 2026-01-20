import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface QBTokens {
    accessToken: string;
    refreshToken: string;
    tokenExpiry: Date;
    realmId: string;
}

export interface QBCompanyInfo {
    companyName: string;
    realmId: string;
}

export interface QBCustomer {
    Id: string;
    DisplayName: string;
    PrimaryEmailAddr?: { Address: string };
    PrimaryPhone?: { FreeFormNumber: string };
    Balance?: number;
}

export interface QBInvoice {
    Id: string;
    DocNumber: string;
    CustomerRef: { value: string; name: string };
    TotalAmt: number;
    Balance: number;
    TxnDate: string;
    Line: QBInvoiceLine[];
    CustomerMemo?: { value: string };
}

export interface QBInvoiceLine {
    Id: string;
    LineNum: number;
    Description?: string;
    Amount: number;
    DetailType: string;
    SalesItemLineDetail?: {
        ItemRef: { value: string; name: string };
        Qty: number;
        UnitPrice: number;
    };
    DiscountLineDetail?: {
        PercentBased: boolean;
        DiscountPercent?: number;
        DiscountAccountRef?: { value: string };
    };
}

export interface QBPayment {
    Id: string;
    TotalAmt: number;
    CustomerRef: { value: string; name: string };
    TxnDate: string;
}

@Injectable()
export class QuickBooksApiClient {
    private readonly logger = new Logger(QuickBooksApiClient.name);
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly redirectUri: string;
    private readonly environment: 'sandbox' | 'production';
    private readonly baseUrl: string;
    private readonly authBaseUrl: string;
    private apiClient: AxiosInstance | null = null;

    constructor(private configService: ConfigService) {
        this.clientId = this.configService.get<string>('QUICKBOOKS_CLIENT_ID', '');
        this.clientSecret = this.configService.get<string>('QUICKBOOKS_CLIENT_SECRET', '');
        this.redirectUri = this.configService.get<string>(
            'QUICKBOOKS_REDIRECT_URI',
            'http://localhost:8000/api/quickbooks/callback'
        );
        this.environment = this.configService.get<string>('QUICKBOOKS_ENVIRONMENT', 'sandbox') as 'sandbox' | 'production';

        this.baseUrl = this.environment === 'production'
            ? 'https://quickbooks.api.intuit.com'
            : 'https://sandbox-quickbooks.api.intuit.com';

        this.authBaseUrl = 'https://oauth.platform.intuit.com/oauth2/v1';
    }

    /**
     * Generate OAuth authorization URL
     */
    getAuthorizationUrl(state: string): string {
        const scopes = ['com.intuit.quickbooks.accounting'];
        const params = new URLSearchParams({
            client_id: this.clientId,
            response_type: 'code',
            scope: scopes.join(' '),
            redirect_uri: this.redirectUri,
            state: state,
        });

        return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(code: string, realmId: string): Promise<QBTokens> {
        const tokenUrl = `${this.authBaseUrl}/tokens/bearer`;

        const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

        const response = await axios.post(
            tokenUrl,
            new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: this.redirectUri,
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${authHeader}`,
                    'Accept': 'application/json',
                },
            }
        );

        const { access_token, refresh_token, expires_in } = response.data;
        const tokenExpiry = new Date(Date.now() + expires_in * 1000);

        return {
            accessToken: access_token,
            refreshToken: refresh_token,
            tokenExpiry,
            realmId,
        };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken: string): Promise<Omit<QBTokens, 'realmId'>> {
        const tokenUrl = `${this.authBaseUrl}/tokens/bearer`;

        const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

        const response = await axios.post(
            tokenUrl,
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${authHeader}`,
                    'Accept': 'application/json',
                },
            }
        );

        const { access_token, refresh_token, expires_in } = response.data;
        const tokenExpiry = new Date(Date.now() + expires_in * 1000);

        return {
            accessToken: access_token,
            refreshToken: refresh_token,
            tokenExpiry,
        };
    }

    /**
     * Revoke tokens (disconnect)
     */
    async revokeToken(token: string): Promise<void> {
        const revokeUrl = `${this.authBaseUrl}/tokens/revoke`;

        const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

        await axios.post(
            revokeUrl,
            new URLSearchParams({
                token: token,
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${authHeader}`,
                    'Accept': 'application/json',
                },
            }
        );
    }

    /**
     * Initialize API client with access token
     */
    initializeClient(accessToken: string, realmId: string): void {
        this.apiClient = axios.create({
            baseURL: `${this.baseUrl}/v3/company/${realmId}`,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });
    }

    /**
     * Get company information
     */
    async getCompanyInfo(accessToken: string, realmId: string): Promise<QBCompanyInfo> {
        this.initializeClient(accessToken, realmId);

        if (!this.apiClient) {
            throw new Error('API client not initialized');
        }

        const response = await this.apiClient.get('/companyinfo/' + realmId);
        const companyInfo = response.data.CompanyInfo;

        return {
            companyName: companyInfo.CompanyName,
            realmId: realmId,
        };
    }

    /**
     * Query customers from QuickBooks
     */
    async queryCustomers(accessToken: string, realmId: string, startPosition = 1, maxResults = 100): Promise<QBCustomer[]> {
        this.initializeClient(accessToken, realmId);

        if (!this.apiClient) {
            throw new Error('API client not initialized');
        }

        const query = `SELECT * FROM Customer STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;
        const response = await this.apiClient.get('/query', {
            params: { query },
        });

        return response.data.QueryResponse?.Customer || [];
    }

    /**
     * Get a specific customer
     */
    async getCustomer(accessToken: string, realmId: string, customerId: string): Promise<QBCustomer> {
        this.initializeClient(accessToken, realmId);

        if (!this.apiClient) {
            throw new Error('API client not initialized');
        }

        const response = await this.apiClient.get(`/customer/${customerId}`);
        return response.data.Customer;
    }

    /**
     * Query invoices from QuickBooks
     */
    async queryInvoices(
        accessToken: string,
        realmId: string,
        options: { startPosition?: number; maxResults?: number; modifiedAfter?: string } = {}
    ): Promise<QBInvoice[]> {
        this.initializeClient(accessToken, realmId);

        if (!this.apiClient) {
            throw new Error('API client not initialized');
        }

        const { startPosition = 1, maxResults = 100, modifiedAfter } = options;

        let query = `SELECT * FROM Invoice`;
        if (modifiedAfter) {
            query += ` WHERE MetaData.LastUpdatedTime > '${modifiedAfter}'`;
        }
        query += ` STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;

        const response = await this.apiClient.get('/query', {
            params: { query },
        });

        return response.data.QueryResponse?.Invoice || [];
    }

    /**
     * Get a specific invoice
     */
    async getInvoice(accessToken: string, realmId: string, invoiceId: string): Promise<QBInvoice> {
        this.initializeClient(accessToken, realmId);

        if (!this.apiClient) {
            throw new Error('API client not initialized');
        }

        const response = await this.apiClient.get(`/invoice/${invoiceId}`);
        return response.data.Invoice;
    }

    /**
     * Query payments from QuickBooks
     */
    async queryPayments(
        accessToken: string,
        realmId: string,
        options: { startPosition?: number; maxResults?: number; modifiedAfter?: string } = {}
    ): Promise<QBPayment[]> {
        this.initializeClient(accessToken, realmId);

        if (!this.apiClient) {
            throw new Error('API client not initialized');
        }

        const { startPosition = 1, maxResults = 100, modifiedAfter } = options;

        let query = `SELECT * FROM Payment`;
        if (modifiedAfter) {
            query += ` WHERE MetaData.LastUpdatedTime > '${modifiedAfter}'`;
        }
        query += ` STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;

        const response = await this.apiClient.get('/query', {
            params: { query },
        });

        return response.data.QueryResponse?.Payment || [];
    }

    /**
     * Verify webhook signature (HMAC-SHA256)
     */
    verifyWebhookSignature(payload: string, signature: string, verifierToken: string): boolean {
        const crypto = require('crypto');
        const computedSignature = crypto
            .createHmac('sha256', verifierToken)
            .update(payload)
            .digest('base64');

        return computedSignature === signature;
    }

    /**
     * Check if configuration is complete
     */
    isConfigured(): boolean {
        return !!(this.clientId && this.clientSecret && this.redirectUri);
    }

    /**
     * Get current environment
     */
    getEnvironment(): 'sandbox' | 'production' {
        return this.environment;
    }
}
