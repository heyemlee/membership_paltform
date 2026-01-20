import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';

// Core modules
import { PrismaModule } from './database/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';

// Feature modules
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { OrdersModule } from './orders/orders.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BenefitsModule } from './benefits/benefits.module';
import { CreditsModule } from './credits/credits.module';
import { SettingsModule } from './settings/settings.module';
import { SmsModule } from './sms/sms.module';
import { QuickBooksModule } from './quickbooks/quickbooks.module';
import { ContactsModule } from './contacts/contacts.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Core infrastructure
    PrismaModule,
    SupabaseModule,

    // Feature modules
    AuthModule,
    CustomersModule,
    OrdersModule,
    DashboardModule,
    BenefitsModule,
    CreditsModule,
    SettingsModule,
    SmsModule,
    QuickBooksModule,
    ContactsModule,
  ],
  providers: [
    // Global validation pipe
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    },
  ],
})
export class AppModule { }
