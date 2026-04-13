/**
 * Full seed for Kiprotich Kirui — creates:
 *  1. Organisation (BomaPro Realty)
 *  2. Property  (Parkside Apartments)
 *  3. Unit      (Unit A3)
 *  4. Portal tenant (kiprotichkirui301@gmail.com)
 *  5. Lease     (active, linking tenant → unit → property)
 *
 * Tenant Portal credentials:
 *   Email   : kiprotichkirui301@gmail.com
 *   Password: Kiprotich@2026
 *
 * Usage:  node seed-kiprotich.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const PORTAL_EMAIL = 'kiprotichkirui301@gmail.com';
const PORTAL_PASS  = 'Kiprotich@2026';
const PORTAL_NAME  = 'Kiprotich Kirui';

const schema = (col) =>
  mongoose.model(col + '__seed', new mongoose.Schema({}, { strict: false, collection: col }));

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bomapro';
  await mongoose.connect(uri);
  console.log('✔  Connected to MongoDB');

  /* ── 1. Organisation ──────────────────────────────────────── */
  const OrgM = schema('tenants');

  let org = await OrgM.findOne({ isDeleted: { $ne: true } }).sort({ createdAt: 1 }).lean();
  if (!org) {
    org = await OrgM.create({
      name:        'BomaPro Realty',
      email:       'admin@bomapro.co.ke',
      phone:       '0712000001',
      address:     'Nairobi, Kenya',
      plan:        'standard',
      isActive:    true,
      isDeleted:   false,
      createdAt:   new Date(),
      updatedAt:   new Date(),
    });
    console.log('✔  Organisation created:', org.name);
  } else {
    console.log('✔  Organisation found:', org.name);
  }
  const orgId = org._id.toString();

  /* ── 2. Property ──────────────────────────────────────────── */
  const PropM = schema('properties');

  let prop = await PropM.findOne({ tenantId: orgId, isDeleted: { $ne: true } }).lean();
  if (!prop) {
    prop = await PropM.create({
      tenantId:    orgId,
      name:        'Parkside Apartments',
      address:     'Kilimani Road, Nairobi',
      city:        'Nairobi',
      country:     'Kenya',
      type:        'apartment',
      floors:      4,
      totalUnits:  20,
      description: 'Modern residential apartments in Kilimani.',
      amenities:   ['swimming pool', 'gym', 'backup generator', 'parking'],
      isActive:    true,
      isDeleted:   false,
      createdAt:   new Date(),
      updatedAt:   new Date(),
    });
    console.log('✔  Property created:', prop.name);
  } else {
    console.log('✔  Property found:', prop.name);
  }
  const propId = prop._id.toString();

  /* ── 3. Unit ──────────────────────────────────────────────── */
  const UnitM = schema('units');

  let unit = await UnitM.findOne({ propertyId: propId, isDeleted: { $ne: true } }).lean();
  if (!unit) {
    unit = await UnitM.create({
      tenantId:    orgId,
      propertyId:  propId,
      unitNumber:  'A3',
      floor:       1,
      type:        '2-bedroom',
      size:        85,
      sizeUnit:    'sqm',
      rent:        45000,
      currency:    'KES',
      status:      'occupied',
      amenities:   ['balcony', 'en-suite', 'wifi'],
      description: '2-bedroom unit on the first floor with a balcony.',
      isActive:    true,
      isDeleted:   false,
      createdAt:   new Date(),
      updatedAt:   new Date(),
    });
    console.log('✔  Unit created:', unit.unitNumber);
  } else {
    console.log('✔  Unit found:', unit.unitNumber);
  }
  const unitId = unit._id.toString();

  /* ── 4. Portal Tenant ─────────────────────────────────────── */
  const PTM  = schema('propertytenants');
  const hash = await bcrypt.hash(PORTAL_PASS, 10);

  const existingPT = await PTM.findOne({ email: PORTAL_EMAIL }).lean();
  let pt;
  if (existingPT) {
    await PTM.updateOne(
      { _id: existingPT._id },
      {
        $set: {
          portalPassword:        hash,
          portalPasswordSet:     true,
          portalInviteToken:     '',
          portalInviteTokenUsed: true,
          currentPropertyId:     propId,
          unitId:                unitId,
          isActive:              true,
          isDeleted:             false,
          updatedAt:             new Date(),
        },
      },
    );
    pt = await PTM.findOne({ _id: existingPT._id }).lean();
    console.log('✔  Portal tenant updated (password reset)');
  } else {
    pt = await PTM.create({
      tenantId:              orgId,
      name:                  PORTAL_NAME,
      email:                 PORTAL_EMAIL,
      phone:                 '0712345699',
      idNumber:              'KE12345678',
      kraPin:                'A001234567B',
      occupation:            'Software Engineer',
      employer:              'Tech Solutions Ltd',
      emergencyContactName:  'Jane Kirui',
      emergencyContactPhone: '0712000099',
      avatar:                '',
      currentPropertyId:     propId,
      currentLeaseId:        '',          // filled below
      unitId:                unitId,
      isActive:              true,
      isDeleted:             false,
      documents:             [],
      metadata:              {},
      // Portal auth
      portalPassword:        hash,
      portalPasswordSet:     true,
      portalInviteToken:     '',
      portalInviteTokenExpiry: null,
      portalInviteTokenUsed: true,
      createdAt:             new Date(),
      updatedAt:             new Date(),
    });
    console.log('✔  Portal tenant created:', PORTAL_NAME);
  }
  const ptId = pt._id.toString();

  /* ── 5. Lease ─────────────────────────────────────────────── */
  const LeaseM = schema('leases');

  const leaseStart = new Date('2026-01-01');
  const leaseEnd   = new Date('2026-12-31');

  let lease = await LeaseM.findOne({ propertyTenantId: ptId, isDeleted: { $ne: true } }).lean();
  if (!lease) {
    lease = await LeaseM.create({
      tenantId:         orgId,
      propertyId:       propId,
      unitId:           unitId,
      propertyTenantId: ptId,
      tenantName:       PORTAL_NAME,
      tenantEmail:      PORTAL_EMAIL,
      unitNumber:       unit.unitNumber,
      propertyName:     prop.name,
      startDate:        leaseStart,
      endDate:          leaseEnd,
      rentAmount:       45000,
      currency:         'KES',
      paymentDay:       1,
      depositAmount:    90000,
      depositPaid:      true,
      status:           'active',
      signedByTenant:   true,
      signedByLandlord: true,
      signedDate:       new Date('2025-12-28'),
      terms:            'Standard 12-month residential lease agreement.',
      notes:            '',
      isDeleted:        false,
      createdAt:        new Date(),
      updatedAt:        new Date(),
    });
    console.log('✔  Lease created (active, 2026-01-01 → 2026-12-31)');
  } else {
    console.log('✔  Lease already exists:', lease._id);
  }
  const leaseId = lease._id.toString();

  // Back-fill currentLeaseId on the portal tenant
  await PTM.updateOne({ _id: ptId }, { $set: { currentLeaseId: leaseId, updatedAt: new Date() } });

  // ── 6. Summary ─────────────────────────────────────────────
  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log('  Tenant Portal — Kiprotich Kirui');
  console.log('══════════════════════════════════════════════════════');
  console.log('  URL          :', 'http://localhost:4200/tenant-portal/login');
  console.log('  Email        :', PORTAL_EMAIL);
  console.log('  Password     :', PORTAL_PASS);
  console.log('──────────────────────────────────────────────────────');
  console.log('  Organisation :', org.name,  '|', orgId);
  console.log('  Property     :', prop.name, '|', propId);
  console.log('  Unit         :', unit.unitNumber + ' (' + (unit.type || '') + ')', '|', unitId);
  console.log('  Lease        : Active  Jan 2026 – Dec 2026  | Rent KES', unit.rent);
  console.log('══════════════════════════════════════════════════════');
  console.log('');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('✘  Seed failed:', err.message);
  process.exit(1);
});
