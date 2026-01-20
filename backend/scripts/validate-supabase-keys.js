#!/usr/bin/env node

/**
 * Supabase API Key Format Validator
 * 
 * This script validates Supabase API key formats and provides feedback.
 * Supports both legacy (eyJ*) and new (sb_*) formats.
 */

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function maskApiKey(key) {
    if (!key || key.length <= 12) return '***';
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
}

function validateApiKey(key, keyName = 'API Key') {
    log(`\n${colors.bold}Validating ${keyName}:${colors.reset}`);

    if (!key) {
        log(`❌ ${keyName} is not set`, colors.red);
        return false;
    }

    const maskedKey = maskApiKey(key);
    log(`   Key: ${maskedKey}`, colors.cyan);

    // Check for new format (sb_ prefix)
    if (key.startsWith('sb_')) {
        log(`✅ NEW format detected (sb_*)`, colors.green);
        log(`   This is the recommended format`, colors.green);

        if (key.length < 32) {
            log(`⚠️  Warning: Key seems too short (${key.length} chars)`, colors.yellow);
            return false;
        }

        return true;
    }
    // Check for legacy format (eyJ prefix - JWT format)
    else if (key.startsWith('eyJ')) {
        log(`✅ LEGACY format detected (eyJ* - JWT)`, colors.green);
        log(`   This format is still supported`, colors.yellow);
        log(`   Consider migrating to new format (sb_*)`, colors.yellow);

        if (key.length < 100) {
            log(`⚠️  Warning: Key seems too short for JWT format`, colors.yellow);
            return false;
        }

        return true;
    }
    // Unknown format
    else {
        log(`❌ Unknown format`, colors.red);
        log(`   Expected: sb_* (new) or eyJ* (legacy)`, colors.red);
        log(`   Got: ${key.substring(0, 10)}...`, colors.red);
        return false;
    }
}

function validateSupabaseUrl(url) {
    log(`\n${colors.bold}Validating Supabase URL:${colors.reset}`);

    if (!url) {
        log(`❌ URL is not set`, colors.red);
        return false;
    }

    log(`   URL: ${url}`, colors.cyan);

    try {
        const urlObj = new URL(url);

        if (urlObj.hostname.endsWith('.supabase.co') || urlObj.hostname.endsWith('.supabase.in')) {
            log(`✅ Valid Supabase URL`, colors.green);
            return true;
        } else {
            log(`❌ Invalid Supabase URL`, colors.red);
            log(`   Expected: https://*.supabase.co or https://*.supabase.in`, colors.red);
            return false;
        }
    } catch (error) {
        log(`❌ Invalid URL format: ${error.message}`, colors.red);
        return false;
    }
}

// Main execution
function main() {
    log(`\n${'='.repeat(60)}`, colors.cyan);
    log(`${colors.bold}Supabase API Key Format Validator${colors.reset}`, colors.cyan);
    log(`${'='.repeat(60)}\n`, colors.cyan);

    // Load environment variables
    require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Validate
    const urlValid = validateSupabaseUrl(supabaseUrl);
    const anonKeyValid = validateApiKey(anonKey, 'SUPABASE_ANON_KEY');
    const serviceKeyValid = validateApiKey(serviceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY');

    // Summary
    log(`\n${'='.repeat(60)}`, colors.cyan);
    log(`${colors.bold}Validation Summary:${colors.reset}`, colors.cyan);
    log(`${'='.repeat(60)}\n`, colors.cyan);

    const results = [
        { name: 'Supabase URL', valid: urlValid },
        { name: 'Anon Key', valid: anonKeyValid },
        { name: 'Service Role Key', valid: serviceKeyValid },
    ];

    results.forEach(({ name, valid }) => {
        const icon = valid ? '✅' : '❌';
        const color = valid ? colors.green : colors.red;
        log(`${icon} ${name}`, color);
    });

    const allValid = results.every(r => r.valid);

    log('');
    if (allValid) {
        log(`🎉 All credentials are valid!`, colors.green);
        log(`   Your Supabase configuration is ready to use.`, colors.green);
    } else {
        log(`⚠️  Some credentials are invalid or missing`, colors.yellow);
        log(`   Please check your .env file and update the credentials.`, colors.yellow);
    }

    log(`\n${'='.repeat(60)}\n`, colors.cyan);

    process.exit(allValid ? 0 : 1);
}

if (require.main === module) {
    main();
}

module.exports = { validateApiKey, validateSupabaseUrl };
