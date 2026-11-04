require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SUPER_ADMIN_EMAIL = 'superadmin@bomapro.co.ke';
const SUPER_ADMIN_PASSWORD = 'SuperAdmin@2026';
const SUPER_ADMIN_NAME = 'Super Admin';

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const userSchema = new mongoose.Schema({}, { strict: false, collection: 'rentiumusers' });
  const User = mongoose.model('SuperAdminSeed', userSchema);

  const existing = await User.findOne({ email: SUPER_ADMIN_EMAIL });
  if (existing) {
    console.log('Super admin already exists.');
    console.log('  Email:   ', SUPER_ADMIN_EMAIL);
    console.log('  Password:', SUPER_ADMIN_PASSWORD);
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

  await User.create({
    name: SUPER_ADMIN_NAME,
    email: SUPER_ADMIN_EMAIL,
    password: hashedPassword,
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
    ],
    isEmailVerified: true,
    isApproved: true,
    isActive: true,
    isDeleted: false,
    authProvider: 'credentials',
    tenantIds: [],
    activeTenantId: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Super admin created successfully!');
  console.log('  Email:   ', SUPER_ADMIN_EMAIL);
  console.log('  Password:', SUPER_ADMIN_PASSWORD);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
