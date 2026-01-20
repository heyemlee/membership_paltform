import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createAdmin() {
    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4] || 'Admin User';

    if (!email || !password) {
        console.error('❌ Usage: npm run create-admin <email> <password> [name]');
        console.error('   Example: npm run create-admin admin@example.com SecurePass123 "Admin User"');
        process.exit(1);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.error('❌ Invalid email format');
        process.exit(1);
    }

    // Validate password strength
    if (password.length < 8) {
        console.error('❌ Password must be at least 8 characters long');
        process.exit(1);
    }

    console.log('🔐 Creating admin account...');
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log('');

    try {
        // 1. Create user in Supabase Auth
        console.log('1️⃣  Creating user in Supabase Auth...');
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email in production
            user_metadata: {
                name,
                role: 'ADMIN',
            },
        });

        if (authError) {
            console.error('❌ Supabase Auth error:', authError.message);
            process.exit(1);
        }

        console.log('   ✅ User created in Supabase Auth');
        console.log(`   User ID: ${authData.user.id}`);

        // 2. Create profile in database
        console.log('2️⃣  Creating profile in database...');

        const profile = await prisma.profile.create({
            data: {
                id: authData.user.id,
                email,
                name,
                role: 'ADMIN',
                status: 'ACTIVE',
            },
        });

        console.log('   ✅ Profile created in database');
        console.log('');
        console.log('✅ Admin account created successfully!');
        console.log('');
        console.log('📝 Login credentials:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log('');
        console.log('⚠️  Please change the password after first login!');
        console.log('');

    } catch (error) {
        console.error('❌ Error creating admin:', error);

        // Cleanup: try to delete from Supabase if profile creation failed
        if (error.code === 'P2002') {
            console.error('❌ User with this email already exists');
        }

        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
