/**
 * Seed a test tenant user account.
 *
 * Usage:
 *   node seed-tenant-user.js
 *
 * The script will:
 *  1. Connect to MongoDB (reads MONGODB_URI from .env, falls back to localhost)
 *  2. Create (or reset) a TENANT role user with known credentials
 *     so you can immediately log into /auth/login as a tenant
 *
 * Credentials after seeding:
 *  Email   : tenant@rentium.co.ke
 *  Password: Tenant@2026
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const TENANT_USER_EMAIL = 'tenant@bomapro.co.ke';
const TENANT_USER_PASSWORD = 'Tenant@2026';
const TENANT_USER_NAME = 'Test Tenant User';
const TENANT_USER_PHONE = '0712345678';

// Default tenant permissions
const TENANT_PERMISSIONS = [
  'view_dashboard',
  'view_leases',
  'view_lease_details',
  'sign_leases',
  'view_payments',
  'create_payments',
  'view_maintenance_requests',
  'create_maintenance_requests',
  'edit_maintenance_requests',
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bomapro';
  
  try {
    await mongoose.connect(uri);
    console.log('✔  Connected to MongoDB');

    const userSchema = new mongoose.Schema({}, { strict: false, collection: 'rentiumusers' });
    const User = mongoose.model('TenantUserSeed', userSchema);

    const existing = await User.findOne({ email: TENANT_USER_EMAIL });

    if (existing) {
      // Reset password so the seed credentials always work
      const hashedPassword = await bcrypt.hash(TENANT_USER_PASSWORD, 10);
      await User.updateOne(
        { _id: existing._id },
        {
          $set: {
            password: hashedPassword,
            isActive: true,
            isDeleted: false,
            permissions: TENANT_PERMISSIONS,
            updatedAt: new Date(),
          },
        },
      );
      console.log('✔  Existing tenant user found — password has been reset.');
    } else {
      const hashedPassword = await bcrypt.hash(TENANT_USER_PASSWORD, 10);

      await User.create({
        name: TENANT_USER_NAME,
        email: TENANT_USER_EMAIL,
        password: hashedPassword,
        role: 'tenant',
        permissions: TENANT_PERMISSIONS,
        isEmailVerified: true,
        isApproved: true,
        isActive: true,
        isDeleted: false,
        authProvider: 'credentials',
        phone: TENANT_USER_PHONE,
        avatar: '',
        assignedPropertyIds: [],
        tenantIds: [],
        activeTenantId: '',
        googleId: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✔  New tenant user created.');
    }

    console.log('\n✅ Tenant user seeded successfully!');
    console.log('─────────────────────────────────────');
    console.log('Email:      ', TENANT_USER_EMAIL);
    console.log('Password:   ', TENANT_USER_PASSWORD);
    console.log('Role:       ', 'tenant');
    console.log('Permissions:', TENANT_PERMISSIONS.join(', '));
    console.log('─────────────────────────────────────\n');

    await mongoose.disconnect();
  } catch (err) {
    console.error('✘  Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
