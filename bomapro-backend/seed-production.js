/**
 * Production Seed Script
 * 
 * This script connects to the production MongoDB database and seeds:
 * 1. Super Admin User
 * 2. Property Manager User
 * 3. Tenant User
 * 4. Accountant User
 *
 * Usage:
 *   MONGODB_URI="your-connection-string" node seed-production.js
 *
 * Or with .env file:
 *   node seed-production.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User credentials
const USERS_TO_SEED = [
  {
    name: 'Super Admin',
    email: 'superadmin@bomapro.co.ke',
    password: 'SuperAdmin@2026',
    role: 'super_admin',
    permissions: [
      'view_dashboard',
      'view_properties', 'create_properties', 'edit_properties', 'delete_properties',
      'view_tenants', 'create_tenants', 'edit_tenants', 'delete_tenants',
      'view_leases', 'create_leases', 'edit_leases', 'delete_leases',
      'view_payments', 'create_payments', 'edit_payments', 'delete_payments',
      'view_damages', 'create_damages', 'edit_damages', 'delete_damages',
      'view_reports', 'export_reports',
      'view_users', 'create_users', 'edit_users', 'delete_users',
      'view_maintenance_requests', 'create_maintenance_requests', 'edit_maintenance_requests', 'delete_maintenance_requests',
    ],
  },
  {
    name: 'Property Manager',
    email: 'manager@bomapro.co.ke',
    password: 'Manager@2026',
    role: 'property_manager',
    permissions: [
      'view_dashboard',
      'view_properties', 'create_properties', 'edit_properties',
      'view_tenants', 'create_tenants', 'edit_tenants',
      'view_leases', 'create_leases', 'edit_leases',
      'view_payments', 'create_payments',
      'view_damages', 'create_damages',
      'view_maintenance_requests', 'create_maintenance_requests', 'edit_maintenance_requests',
    ],
  },
  {
    name: 'Test Tenant User',
    email: 'tenant@bomapro.co.ke',
    password: 'Tenant@2026',
    role: 'tenant',
    permissions: [
      'view_dashboard',
      'view_leases',
      'view_lease_details',
      'sign_leases',
      'view_payments',
      'create_payments',
      'view_maintenance_requests',
      'create_maintenance_requests',
      'edit_maintenance_requests',
    ],
  },
  {
    name: 'Accountant',
    email: 'accountant@bomapro.co.ke',
    password: 'Accountant@2026',
    role: 'accountant',
    permissions: [
      'view_dashboard',
      'view_payments', 'view_payment_details', 'export_payment_reports',
      'view_reports', 'export_reports',
      'view_properties',
      'view_leases',
    ],
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables or .env file');
    process.exit(1);
  }

  console.log('🔄 Connecting to MongoDB...');
  console.log('Database URI (first 50 chars):', uri.substring(0, 50) + '...');

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    const userSchema = new mongoose.Schema({}, { strict: false, collection: 'bomaprocusers' });
    const User = mongoose.model('ProductionSeed', userSchema);

    console.log('\n🌱 Starting to seed users...\n');

    for (const userConfig of USERS_TO_SEED) {
      const existing = await User.findOne({ email: userConfig.email });

      const hashedPassword = await bcrypt.hash(userConfig.password, 10);

      if (existing) {
        await User.updateOne(
          { _id: existing._id },
          {
            $set: {
              password: hashedPassword,
              role: userConfig.role,
              permissions: userConfig.permissions,
              isEmailVerified: true,
              isApproved: true,
              isActive: true,
              isDeleted: false,
              updatedAt: new Date(),
            },
          },
        );
        console.log(`✅ Updated existing user: ${userConfig.email}`);
      } else {
        await User.create({
          name: userConfig.name,
          email: userConfig.email,
          password: hashedPassword,
          role: userConfig.role,
          permissions: userConfig.permissions,
          isEmailVerified: true,
          isApproved: true,
          isActive: true,
          isDeleted: false,
          authProvider: 'credentials',
          phone: '',
          avatar: '',
          assignedPropertyIds: [],
          tenantIds: [],
          activeTenantId: '',
          googleId: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`✅ Created new user: ${userConfig.email}`);
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✨ PRODUCTION SEED COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(60));
    console.log('\n📋 User Credentials:\n');

    USERS_TO_SEED.forEach((user) => {
      console.log(`${user.role.toUpperCase()}`);
      console.log(`  Email:    ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Role:     ${user.role}\n`);
    });

    console.log('═'.repeat(60));
    console.log('⚠️  IMPORTANT: Change these credentials after first login!');
    console.log('═'.repeat(60) + '\n');

    await mongoose.disconnect();
    console.log('✅ Database connection closed\n');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    if (err.message.includes('ECONNREFUSED') || err.message.includes('getaddrinfo')) {
      console.error('\nℹ️  Connection issues detected. Make sure:');
      console.error('  - MongoDB connection string is correct');
      console.error('  - Your IP is whitelisted in MongoDB Atlas');
      console.error('  - Your network allows the connection');
    }
    process.exit(1);
  }
}

seed();
