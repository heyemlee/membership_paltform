import { Module } from '@nestjs/common';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { PrismaService } from '../database/prisma.service';

@Module({
    controllers: [CreditsController],
    providers: [CreditsService, PrismaService],
    exports: [CreditsService],
})
export class CreditsModule { }
