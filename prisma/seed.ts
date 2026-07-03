import { PrismaClient, Role, EventStatus, BookingStatus, PaymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data in reverse dependency order
  await prisma.payment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.bookingItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.event.deleteMany();
  await prisma.category.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();

  // ──────────────────────────────────────────────
  // Users
  // ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Alice Admin",
      email: "admin@example.com",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const organizer = await prisma.user.create({
    data: {
      name: "Oscar Organizer",
      email: "organizer@example.com",
      passwordHash,
      role: Role.ORGANIZER,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      name: "Bob User",
      email: "bob@example.com",
      passwordHash,
      role: Role.USER,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Carol User",
      email: "carol@example.com",
      passwordHash,
      role: Role.USER,
    },
  });

  console.log(`✅ Created ${4} users`);

  // ──────────────────────────────────────────────
  // Venues
  // ──────────────────────────────────────────────
  const venue1 = await prisma.venue.create({
    data: {
      name: "The Grand Arena",
      address: "123 Main Street",
      city: "New York",
      capacity: 5000,
    },
  });

  const venue2 = await prisma.venue.create({
    data: {
      name: "Downtown Conference Center",
      address: "456 Park Avenue",
      city: "Los Angeles",
      capacity: 800,
    },
  });

  const venue3 = await prisma.venue.create({
    data: {
      name: "Riverside Pavilion",
      address: "789 River Road",
      city: "Chicago",
      capacity: 1200,
    },
  });

  console.log(`✅ Created ${3} venues`);

  // ──────────────────────────────────────────────
  // Categories
  // ──────────────────────────────────────────────
  const catMusic = await prisma.category.create({
    data: { name: "Music" },
  });

  const catTech = await prisma.category.create({
    data: { name: "Technology" },
  });

  const catSports = await prisma.category.create({
    data: { name: "Sports" },
  });

  const catArts = await prisma.category.create({
    data: { name: "Arts & Culture" },
  });

  console.log(`✅ Created ${4} categories`);

  // ──────────────────────────────────────────────
  // Events (5 total: 3 PUBLISHED, 2 DRAFT)
  // ──────────────────────────────────────────────
  const now = new Date();
  const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const twoMonths = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const threeMonths = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const event1 = await prisma.event.create({
    data: {
      title: "Summer Music Festival 2025",
      description:
        "A spectacular summer music festival featuring top artists from around the world. Three days of non-stop live music across multiple stages.",
      categoryId: catMusic.id,
      venueId: venue1.id,
      organizerId: organizer.id,
      startDateTime: oneMonth,
      endDateTime: new Date(oneMonth.getTime() + 3 * 24 * 60 * 60 * 1000),
      bannerImageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200",
      status: EventStatus.PUBLISHED,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      title: "TechConf 2025: AI & the Future",
      description:
        "The premier technology conference exploring artificial intelligence, machine learning, and the future of software development. Keynotes, workshops, and networking.",
      categoryId: catTech.id,
      venueId: venue2.id,
      organizerId: organizer.id,
      startDateTime: twoMonths,
      endDateTime: new Date(twoMonths.getTime() + 2 * 24 * 60 * 60 * 1000),
      bannerImageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200",
      status: EventStatus.PUBLISHED,
    },
  });

  const event3 = await prisma.event.create({
    data: {
      title: "City Marathon 2025",
      description:
        "Join thousands of runners in the annual city marathon. Routes include the full 26.2-mile marathon and a 10K fun run for all fitness levels.",
      categoryId: catSports.id,
      venueId: venue3.id,
      organizerId: organizer.id,
      startDateTime: threeMonths,
      endDateTime: new Date(threeMonths.getTime() + 1 * 24 * 60 * 60 * 1000),
      bannerImageUrl: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1200",
      status: EventStatus.PUBLISHED,
    },
  });

  const event4 = await prisma.event.create({
    data: {
      title: "Contemporary Art Exhibition",
      description:
        "A curated exhibition showcasing cutting-edge contemporary art from emerging and established artists. Paintings, sculptures, and digital installations.",
      categoryId: catArts.id,
      venueId: venue1.id,
      organizerId: organizer.id,
      startDateTime: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      endDateTime: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      status: EventStatus.DRAFT,
    },
  });

  const event5 = await prisma.event.create({
    data: {
      title: "Jazz & Blues Night",
      description:
        "An intimate evening of live jazz and blues music featuring local and international musicians. Dinner and drinks available.",
      categoryId: catMusic.id,
      venueId: venue2.id,
      organizerId: organizer.id,
      startDateTime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      endDateTime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      status: EventStatus.DRAFT,
    },
  });

  console.log(`✅ Created ${5} events (3 PUBLISHED, 2 DRAFT)`);

  // ──────────────────────────────────────────────
  // Ticket Types
  // ──────────────────────────────────────────────
  const salesStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // started 1 week ago
  const salesEnd = new Date(oneMonth.getTime() - 1 * 24 * 60 * 60 * 1000); // ends day before event

  // Event 1 - Summer Music Festival
  const tt1 = await prisma.ticketType.create({
    data: {
      eventId: event1.id,
      name: "General Admission",
      price: 79.99,
      totalQuantity: 2000,
      quantitySold: 0,
      salesStart,
      salesEnd,
    },
  });

  const tt2 = await prisma.ticketType.create({
    data: {
      eventId: event1.id,
      name: "VIP Pass",
      price: 249.99,
      totalQuantity: 200,
      quantitySold: 0,
      salesStart,
      salesEnd,
    },
  });

  const tt3 = await prisma.ticketType.create({
    data: {
      eventId: event1.id,
      name: "3-Day Festival Pass",
      price: 199.99,
      totalQuantity: 500,
      quantitySold: 0,
      salesStart,
      salesEnd,
    },
  });

  // Event 2 - TechConf
  const salesEndTech = new Date(twoMonths.getTime() - 1 * 24 * 60 * 60 * 1000);
  const tt4 = await prisma.ticketType.create({
    data: {
      eventId: event2.id,
      name: "Conference Pass",
      price: 499.0,
      totalQuantity: 400,
      quantitySold: 0,
      salesStart,
      salesEnd: salesEndTech,
    },
  });

  const tt5 = await prisma.ticketType.create({
    data: {
      eventId: event2.id,
      name: "Workshop Add-On",
      price: 149.0,
      totalQuantity: 100,
      quantitySold: 0,
      salesStart,
      salesEnd: salesEndTech,
    },
  });

  // Event 3 - City Marathon
  const salesEndMarathon = new Date(threeMonths.getTime() - 1 * 24 * 60 * 60 * 1000);
  const tt6 = await prisma.ticketType.create({
    data: {
      eventId: event3.id,
      name: "Full Marathon Entry",
      price: 85.0,
      totalQuantity: 1000,
      quantitySold: 0,
      salesStart,
      salesEnd: salesEndMarathon,
    },
  });

  const tt7 = await prisma.ticketType.create({
    data: {
      eventId: event3.id,
      name: "10K Fun Run Entry",
      price: 35.0,
      totalQuantity: 500,
      quantitySold: 0,
      salesStart,
      salesEnd: salesEndMarathon,
    },
  });

  console.log(`✅ Created ${7} ticket types`);

  // ──────────────────────────────────────────────
  // Bookings (2 sample bookings for event1)
  // ──────────────────────────────────────────────

  // Booking 1: Bob books 2x General Admission for Summer Music Festival
  const booking1TotalAmount = 2 * 79.99;

  const booking1 = await prisma.booking.create({
    data: {
      userId: user1.id,
      eventId: event1.id,
      status: BookingStatus.CONFIRMED,
      totalAmount: booking1TotalAmount,
      idempotencyKey: "seed-booking-bob-001",
    },
  });

  const bookingItem1 = await prisma.bookingItem.create({
    data: {
      bookingId: booking1.id,
      ticketTypeId: tt1.id,
      quantity: 2,
      unitPrice: 79.99,
    },
  });

  // Create individual tickets for booking item 1
  const ticket1 = await prisma.ticket.create({
    data: {
      bookingItemId: bookingItem1.id,
      ticketCode: "TKT-SEED-BOB-001-A",
      checkedIn: false,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      bookingItemId: bookingItem1.id,
      ticketCode: "TKT-SEED-BOB-001-B",
      checkedIn: false,
    },
  });

  // Create payment for booking 1
  await prisma.payment.create({
    data: {
      bookingId: booking1.id,
      amount: booking1TotalAmount,
      provider: "stripe",
      status: PaymentStatus.SUCCESS,
      transactionRef: "pi_seed_001",
    },
  });

  // Update quantitySold for tt1
  await prisma.ticketType.update({
    where: { id: tt1.id },
    data: { quantitySold: 2 },
  });

  // Booking 2: Carol books 1x VIP Pass for Summer Music Festival
  const booking2TotalAmount = 1 * 249.99;

  const booking2 = await prisma.booking.create({
    data: {
      userId: user2.id,
      eventId: event1.id,
      status: BookingStatus.CONFIRMED,
      totalAmount: booking2TotalAmount,
      idempotencyKey: "seed-booking-carol-001",
    },
  });

  const bookingItem2 = await prisma.bookingItem.create({
    data: {
      bookingId: booking2.id,
      ticketTypeId: tt2.id,
      quantity: 1,
      unitPrice: 249.99,
    },
  });

  // Create individual ticket for booking item 2
  const ticket3 = await prisma.ticket.create({
    data: {
      bookingItemId: bookingItem2.id,
      ticketCode: "TKT-SEED-CAROL-001-A",
      checkedIn: false,
    },
  });

  // Create payment for booking 2
  await prisma.payment.create({
    data: {
      bookingId: booking2.id,
      amount: booking2TotalAmount,
      provider: "stripe",
      status: PaymentStatus.SUCCESS,
      transactionRef: "pi_seed_002",
    },
  });

  // Update quantitySold for tt2
  await prisma.ticketType.update({
    where: { id: tt2.id },
    data: { quantitySold: 1 },
  });

  console.log(`✅ Created 2 bookings with booking items, tickets, and payments`);

  // ──────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────
  console.log("\n🎉 Seed complete! Summary:");
  console.log(`   👤 Users:        4 (1 ADMIN, 1 ORGANIZER, 2 USER)`);
  console.log(`   🏟️  Venues:       3`);
  console.log(`   🏷️  Categories:   4`);
  console.log(`   📅 Events:       5 (3 PUBLISHED, 2 DRAFT)`);
  console.log(`   🎫 TicketTypes:  7`);
  console.log(`   📋 Bookings:     2 (CONFIRMED)`);
  console.log(`   🎟️  Tickets:      3`);
  console.log(`   💳 Payments:     2 (SUCCESS)`);
  console.log("\n📧 Login credentials (password: Password123!):");
  console.log(`   Admin:     admin@example.com`);
  console.log(`   Organizer: organizer@example.com`);
  console.log(`   User 1:    bob@example.com`);
  console.log(`   User 2:    carol@example.com`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
