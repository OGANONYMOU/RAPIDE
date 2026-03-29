import { PrismaClient, VehicleType, DeliveryType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Rapide database...');

  // ─── Admin User ───────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@Rapide2024', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rapide.bj' },
    update: {},
    create: {
      email: 'admin@rapide.bj',
      phone: '+22961000000',
      passwordHash: adminHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      adminProfile: { create: { permissions: ['*'] } },
      wallet: { create: {} },
    },
  });
  console.log('✅ Admin created:', admin.email);

  // ─── Demo Customer ────────────────────────────────────────────────────────
  const customerHash = await bcrypt.hash('Customer@123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      phone: '+22961000001',
      passwordHash: customerHash,
      firstName: 'Kofi',
      lastName: 'Mensah',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true,
      customerProfile: { create: {} },
      wallet: { create: { balance: 10000 } },
    },
  });
  console.log('✅ Demo customer created:', customer.email);

  // ─── Demo Driver ──────────────────────────────────────────────────────────
  const driverHash = await bcrypt.hash('Driver@123', 12);
  const driver = await prisma.user.upsert({
    where: { email: 'driver@example.com' },
    update: {},
    create: {
      email: 'driver@example.com',
      phone: '+22961000002',
      passwordHash: driverHash,
      firstName: 'Eze',
      lastName: 'Adaora',
      role: 'DRIVER',
      status: 'ACTIVE',
      emailVerified: true,
      driverProfile: {
        create: {
          vehicleType: 'BIKE',
          vehiclePlate: 'BJ-1234-AB',
          vehicleModel: 'Honda CB 125',
          vehicleColor: 'Rouge',
          status: 'APPROVED',
          isOnline: false,
          rating: 4.8,
          totalDeliveries: 127,
          totalEarnings: 285000,
        },
      },
      wallet: { create: { balance: 45000 } },
    },
  });
  console.log('✅ Demo driver created:', driver.email);

  // ─── Pricing Rules ────────────────────────────────────────────────────────
  const pricingRules = [
    { vehicleType: VehicleType.BIKE, name: 'Tarif Moto', basePrice: 500, pricePerKm: 150, minimumPrice: 500, minimumDistance: 1 },
    { vehicleType: VehicleType.CAR, name: 'Tarif Voiture', basePrice: 1000, pricePerKm: 250, minimumPrice: 1000, minimumDistance: 1 },
    { vehicleType: VehicleType.VAN, name: 'Tarif Fourgonnette', basePrice: 2000, pricePerKm: 350, minimumPrice: 2000, minimumDistance: 1 },
    { vehicleType: VehicleType.TRUCK, name: 'Tarif Camion', basePrice: 5000, pricePerKm: 600, minimumPrice: 5000, minimumDistance: 2 },
  ];

  for (const rule of pricingRules) {
    await prisma.pricingRule.upsert({
      where: { id: rule.vehicleType.toLowerCase() },
      update: rule,
      create: { id: rule.vehicleType.toLowerCase(), ...rule },
    });
  }
  console.log('✅ Pricing rules seeded');

  // ─── Urgency Fees ─────────────────────────────────────────────────────────
  await prisma.urgencyFee.upsert({
    where: { id: 'express' },
    update: {},
    create: { id: 'express', deliveryType: DeliveryType.EXPRESS, feeAmount: 500 },
  });
  console.log('✅ Urgency fees seeded');

  // ─── Promo Code ───────────────────────────────────────────────────────────
  await prisma.promoCode.upsert({
    where: { code: 'RAPIDE10' },
    update: {},
    create: {
      code: 'RAPIDE10',
      description: '10% de réduction sur votre première livraison',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxUses: 1000,
    },
  });
  console.log('✅ Promo code seeded');

  // ─── Delivery Zones ───────────────────────────────────────────────────────
  const zones = [
    { name: 'Cotonou Centre', nameFr: 'Cotonou Centre', nameEn: 'Cotonou Center', surgeMultiplier: 1.0 },
    { name: 'Cotonou Est', nameFr: 'Cotonou Est', nameEn: 'Cotonou East', surgeMultiplier: 1.1 },
    { name: 'Porto-Novo', nameFr: 'Porto-Novo', nameEn: 'Porto-Novo', surgeMultiplier: 1.2 },
    { name: 'Abomey-Calavi', nameFr: 'Abomey-Calavi', nameEn: 'Abomey-Calavi', surgeMultiplier: 1.15 },
  ];
  for (const zone of zones) {
    await prisma.deliveryZone.upsert({
      where: { id: zone.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: { id: zone.name.toLowerCase().replace(/\s+/g, '-'), ...zone },
    });
  }
  console.log('✅ Delivery zones seeded');

  // ─── FAQs ─────────────────────────────────────────────────────────────────
  const faqs = [
    {
      questionFr: 'Comment suivre ma livraison en temps réel ?',
      questionEn: 'How do I track my delivery in real time?',
      answerFr: 'Une fois votre commande confirmée et un livreur assigné, vous pouvez suivre sa position en temps réel sur la carte dans l\'application.',
      answerEn: 'Once your order is confirmed and a driver assigned, you can track their position in real time on the map in the app.',
      category: 'TRACKING',
    },
    {
      questionFr: 'Quels modes de paiement sont acceptés ?',
      questionEn: 'What payment methods are accepted?',
      answerFr: 'Nous acceptons les paiements en espèces, par portefeuille Rapide, et par carte bancaire.',
      answerEn: 'We accept cash payments, Rapide wallet, and bank card payments.',
      category: 'PAYMENT',
    },
    {
      questionFr: 'Comment devenir livreur Rapide ?',
      questionEn: 'How do I become a Rapide driver?',
      answerFr: 'Inscrivez-vous en tant que livreur, soumettez vos documents, et attendez la validation de notre équipe.',
      answerEn: 'Register as a driver, submit your documents, and wait for approval from our team.',
      category: 'DRIVERS',
    },
  ];
  for (let i = 0; i < faqs.length; i++) {
    await prisma.faq.upsert({
      where: { id: `faq-${i + 1}` },
      update: {},
      create: { id: `faq-${i + 1}`, ...faqs[i], sortOrder: i + 1 },
    });
  }
  console.log('✅ FAQs seeded');

  console.log('\n🎉 Seeding complete!\n');
  console.log('Admin login: admin@rapide.bj / Admin@Rapide2024');
  console.log('Customer login: client@example.com / Customer@123');
  console.log('Driver login: driver@example.com / Driver@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
