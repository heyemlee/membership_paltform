import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QuickBooksController } from './quickbooks.controller';
import { QuickBooksService } from './quickbooks.service';
import { QuickBooksApiClient } from './quickbooks-api.client';
import { PrismaModule } from '../database/prisma.module';

@Module({
    imports: [ConfigModule, PrismaModule],
    controllers: [QuickBooksController],
    providers: [QuickBooksService, QuickBooksApiClient],
    exports: [QuickBooksService, QuickBooksApiClient],
})
export class QuickBooksModule { }
