import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto, RegisterDto, UpdateProfileDto } from './dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private supabase: SupabaseService,
        private jwtService: JwtService,
    ) { }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Verify credentials with Supabase
        const supabaseClient = this.supabase.getClient();
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            this.logger.warn(`Login failed for ${email}: ${error.message}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        // Get user profile from our database
        const profile = await this.prisma.profile.findUnique({
            where: { id: data.user.id },
        });

        if (!profile) {
            throw new UnauthorizedException('User profile not found');
        }

        // Generate JWT token
        const payload = {
            sub: profile.id,
            email: profile.email,
            role: profile.role,
        };
        const accessToken = this.jwtService.sign(payload);

        return {
            user: {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: profile.role,
                status: profile.status,
                createdAt: profile.createdAt,
            },
            accessToken,
        };
    }

    async register(registerDto: RegisterDto) {
        const { email, password, name, role } = registerDto;

        // Check if user already exists
        const existingUser = await this.prisma.profile.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Create user in Supabase
        const supabaseUser = await this.supabase.createUser(email, password, { name });

        if (!supabaseUser) {
            throw new ConflictException('Failed to create user');
        }

        // Create profile in our database
        const profile = await this.prisma.profile.create({
            data: {
                id: supabaseUser.id,
                email,
                name,
                role: role || UserRole.STAFF,
            },
        });

        // Generate JWT token
        const payload = {
            sub: profile.id,
            email: profile.email,
            role: profile.role,
        };
        const accessToken = this.jwtService.sign(payload);

        return {
            user: {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: profile.role,
                status: profile.status,
                createdAt: profile.createdAt,
            },
            accessToken,
        };
    }

    async getProfile(userId: string) {
        const profile = await this.prisma.profile.findUnique({
            where: { id: userId },
        });

        if (!profile) {
            throw new UnauthorizedException('User not found');
        }

        return {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            status: profile.status,
            createdAt: profile.createdAt,
        };
    }

    async updateProfile(userId: string, updateDto: UpdateProfileDto) {
        const profile = await this.prisma.profile.update({
            where: { id: userId },
            data: {
                ...(updateDto.name && { name: updateDto.name }),
                ...(updateDto.email && { email: updateDto.email }),
            },
        });

        // Update email in Supabase if changed
        if (updateDto.email) {
            await this.supabase.updateUser(userId, { email: updateDto.email });
        }

        return {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            status: profile.status,
            createdAt: profile.createdAt,
        };
    }
}
