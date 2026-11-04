const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/bomapro');

  const userSchema = new mongoose.Schema({}, { strict: false, collection: 'rentiumusers' });
  const User = mongoose.model('User', userSchema);

  const email = 'demo@bomapro.co.ke';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Demo account already exists. You can log in with:');
    console.log('  Email: demo@bomapro.co.ke');
    console.log('  Password: Demo@1234');
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash('Demo@1234', 10);

  await User.create({
    name: 'Demo Admin',
    email,
    password: hashedPassword,
    role: 'super_admin',
    permissions: [
      'view_dashboard', 'view_properties', 'create_properties', 'edit_properties', 'delete_properties',
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

  console.log('Demo account created successfully!');
  console.log('  Email: demo@bomapro.co.ke');
  console.log('  Password: Demo@1234');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
