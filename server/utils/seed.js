const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await prisma.$connect();
    console.log('Connected to SQLite.');

    // Check if database is already seeded to avoid overwriting user-created data
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log('Database already has records. Skipping database seeding.');
      return;
    }

    // Clear existing data in reverse dependency order
    console.log('Clearing existing database collections...');
    await prisma.activity.deleteMany({});
    await prisma.quotation.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.user.deleteMany({});

    // 1. Create Anonymous Users
    console.log('Seeding Users...');
    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash('admin123', salt);
    const hashedBdaPassword = await bcrypt.hash('bda123', salt);

    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@manudesk.com',
        password: hashedAdminPassword,
        role: 'Admin',
      }
    });

    const bdaUser1 = await prisma.user.create({
      data: {
        name: 'User 1',
        email: 'bda1@manudesk.com',
        password: hashedBdaPassword,
        role: 'BDA Executive',
      }
    });

    const bdaUser2 = await prisma.user.create({
      data: {
        name: 'User 2',
        email: 'bda2@manudesk.com',
        password: hashedBdaPassword,
        role: 'BDA Executive',
      }
    });

    const bdaUser3 = await prisma.user.create({
      data: {
        name: 'User 3',
        email: 'bda3@manudesk.com',
        password: hashedBdaPassword,
        role: 'BDA Executive',
      }
    });

    const bdaUser4 = await prisma.user.create({
      data: {
        name: 'User 4',
        email: 'bda4@manudesk.com',
        password: hashedBdaPassword,
        role: 'BDA Executive',
      }
    });

    console.log('Seeded users.');

    // 2. Create Clients with manufacturing-style company names and anonymous contacts
    console.log('Seeding Clients...');
    const clientsData = [
      {
        companyName: 'Apex Manufacturing',
        industry: 'Heavy Machinery',
        procurementContact: 'Contact 1',
        email: 'procurement1@apexmanufacturing.com',
        phone: '+91 90000 00001',
        location: 'Pune, Maharashtra',
        productInterest: 'CNC Machine Casting Blocks',
        annualRequirement: '500 Tons',
        status: 'Active',
        assignedToId: bdaUser1.id,
      },
      {
        companyName: 'Titan Components',
        industry: 'Automotive',
        procurementContact: 'Contact 2',
        email: 'procurement2@titancomponents.com',
        phone: '+91 90000 00002',
        location: 'Chennai, Tamil Nadu',
        productInterest: 'Precision Gears and Shafts',
        annualRequirement: '120,000 units',
        status: 'Active',
        assignedToId: bdaUser2.id,
      },
      {
        companyName: 'Nova Industrial Systems',
        industry: 'Aerospace',
        procurementContact: 'Contact 3',
        email: 'procurement3@novaindustrial.com',
        phone: '+1 300 000 0003',
        location: 'Bengaluru, Karnataka',
        productInterest: 'Titanium Fasteners',
        annualRequirement: '15,000 units',
        status: 'Active',
        assignedToId: bdaUser1.id,
      },
      {
        companyName: 'Zenith Engineering',
        industry: 'Industrial Automation',
        procurementContact: 'Contact 4',
        email: 'procurement4@zenithengineering.com',
        phone: '+91 90000 00004',
        location: 'Hyderabad, Telangana',
        productInterest: 'PLC Enclosure Assembly Racks',
        annualRequirement: '2,500 Sets',
        status: 'Active',
        assignedToId: bdaUser3.id,
      },
      {
        companyName: 'Alpha Steel Works',
        industry: 'Infrastructure',
        procurementContact: 'Contact 5',
        email: 'procurement5@alphasteel.com',
        phone: '+91 90000 00005',
        location: 'Jamshedpur, Jharkhand',
        productInterest: 'Steel Girders',
        annualRequirement: '2,000 Metric Tons',
        status: 'Active',
        assignedToId: bdaUser3.id,
      },
      {
        companyName: 'Orion Hydraulics',
        industry: 'Fluid Power',
        procurementContact: 'Contact 6',
        email: 'procurement6@orionhydraulics.com',
        phone: '+91 90000 00006',
        location: 'Ahmedabad, Gujarat',
        productInterest: 'Hydraulic Cylinders',
        annualRequirement: '4,000 units',
        status: 'Active',
        assignedToId: bdaUser2.id,
      },
      {
        companyName: 'Matrix Metalworks',
        industry: 'Heavy Machinery',
        procurementContact: 'Contact 7',
        email: 'procurement7@matrixmetalworks.com',
        phone: '+91 90000 00007',
        location: 'Mumbai, Maharashtra',
        productInterest: 'Forged Steel Valves',
        annualRequirement: '10,000 units',
        status: 'Active',
        assignedToId: bdaUser4.id,
      },
      {
        companyName: 'Pinnacle Castings',
        industry: 'Automotive',
        procurementContact: 'Contact 8',
        email: 'procurement8@pinnaclecastings.com',
        phone: '+91 90000 00008',
        location: 'Gurugram, Haryana',
        productInterest: 'Aluminum Alloy Wheels',
        annualRequirement: '50,000 units',
        status: 'Active',
        assignedToId: bdaUser4.id,
      }
    ];

    const clients = [];
    const clientMap = {};
    for (const cData of clientsData) {
      const c = await prisma.client.create({ data: cData });
      clients.push(c);
      clientMap[c.companyName] = c.id;
    }
    console.log(`Seeded ${clients.length} clients.`);

    // 3. Create Leads (32 Leads for realistic distribution)
    console.log('Seeding Leads...');
    const leadDefinitions = [
      // User 1 leads (9 leads)
      { companyName: 'Apex Manufacturing', industry: 'Heavy Machinery', contactPerson: 'Contact 1', stage: 'New Inquiry', dealValue: 45000, priority: 'Medium', daysOffset: 30, assignedToId: bdaUser1.id },
      { companyName: 'Apex Manufacturing', industry: 'Heavy Machinery', contactPerson: 'Contact 1', stage: 'Requirement Discussion', dealValue: 72000, priority: 'High', daysOffset: 15, assignedToId: bdaUser1.id },
      { companyName: 'Nova Industrial Systems', industry: 'Aerospace', contactPerson: 'Contact 3', stage: 'Quotation Prepared', dealValue: 120000, priority: 'High', daysOffset: 20, assignedToId: bdaUser1.id },
      { companyName: 'Nova Industrial Systems', industry: 'Aerospace', contactPerson: 'Contact 3', stage: 'Quotation Sent', dealValue: 85000, priority: 'Medium', daysOffset: 10, assignedToId: bdaUser1.id },
      { companyName: 'Apex Manufacturing', industry: 'Heavy Machinery', contactPerson: 'Contact 1', stage: 'Negotiation', dealValue: 60000, priority: 'High', daysOffset: 4, assignedToId: bdaUser1.id },
      { companyName: 'Nova Industrial Systems', industry: 'Aerospace', contactPerson: 'Contact 3', stage: 'Purchase Order Received', dealValue: 95000, priority: 'High', daysOffset: 5, assignedToId: bdaUser1.id },
      { companyName: 'Apex Manufacturing', industry: 'Heavy Machinery', contactPerson: 'Contact 1', stage: 'Closed Won', dealValue: 50000, priority: 'Low', daysOffset: -10, assignedToId: bdaUser1.id, monthAgo: 5 },
      { companyName: 'Nova Industrial Systems', industry: 'Aerospace', contactPerson: 'Contact 3', stage: 'Closed Won', dealValue: 110000, priority: 'High', daysOffset: -25, assignedToId: bdaUser1.id, monthAgo: 4 },
      { companyName: 'Apex Manufacturing', industry: 'Heavy Machinery', contactPerson: 'Contact 1', stage: 'Closed Lost', dealValue: 25000, priority: 'Low', daysOffset: -40, assignedToId: bdaUser1.id },

      // User 2 leads (8 leads)
      { companyName: 'Titan Components', industry: 'Automotive', contactPerson: 'Contact 2', stage: 'New Inquiry', dealValue: 35000, priority: 'Low', daysOffset: 45, assignedToId: bdaUser2.id },
      { companyName: 'Orion Hydraulics', industry: 'Fluid Power', contactPerson: 'Contact 6', stage: 'Requirement Discussion', dealValue: 48000, priority: 'Medium', daysOffset: 25, assignedToId: bdaUser2.id },
      { companyName: 'Titan Components', industry: 'Automotive', contactPerson: 'Contact 2', stage: 'Quotation Prepared', dealValue: 98000, priority: 'High', daysOffset: 18, assignedToId: bdaUser2.id },
      { companyName: 'Orion Hydraulics', industry: 'Fluid Power', contactPerson: 'Contact 6', stage: 'Quotation Sent', dealValue: 55000, priority: 'Medium', daysOffset: 12, assignedToId: bdaUser2.id },
      { companyName: 'Titan Components', industry: 'Automotive', contactPerson: 'Contact 2', stage: 'Negotiation', dealValue: 80000, priority: 'High', daysOffset: 2, assignedToId: bdaUser2.id },
      { companyName: 'Orion Hydraulics', industry: 'Fluid Power', contactPerson: 'Contact 6', stage: 'Purchase Order Received', dealValue: 42000, priority: 'Medium', daysOffset: 8, assignedToId: bdaUser2.id },
      { companyName: 'Titan Components', industry: 'Automotive', contactPerson: 'Contact 2', stage: 'Closed Won', dealValue: 65000, priority: 'High', daysOffset: -5, assignedToId: bdaUser2.id, monthAgo: 3 },
      { companyName: 'Orion Hydraulics', industry: 'Fluid Power', contactPerson: 'Contact 6', stage: 'Closed Won', dealValue: 38000, priority: 'Medium', daysOffset: -20, assignedToId: bdaUser2.id, monthAgo: 2 },

      // User 3 leads (8 leads)
      { companyName: 'Zenith Engineering', industry: 'Industrial Automation', contactPerson: 'Contact 4', stage: 'New Inquiry', dealValue: 28000, priority: 'Low', daysOffset: 35, assignedToId: bdaUser3.id },
      { companyName: 'Alpha Steel Works', industry: 'Infrastructure', contactPerson: 'Contact 5', stage: 'Requirement Discussion', dealValue: 110000, priority: 'High', daysOffset: 22, assignedToId: bdaUser3.id },
      { companyName: 'Zenith Engineering', industry: 'Industrial Automation', contactPerson: 'Contact 4', stage: 'Quotation Prepared', dealValue: 32000, priority: 'Medium', daysOffset: 15, assignedToId: bdaUser3.id },
      { companyName: 'Alpha Steel Works', industry: 'Infrastructure', contactPerson: 'Contact 5', stage: 'Quotation Sent', dealValue: 95000, priority: 'High', daysOffset: 7, assignedToId: bdaUser3.id },
      { companyName: 'Zenith Engineering', industry: 'Industrial Automation', contactPerson: 'Contact 4', stage: 'Negotiation', dealValue: 30000, priority: 'Medium', daysOffset: 3, assignedToId: bdaUser3.id },
      { companyName: 'Alpha Steel Works', industry: 'Infrastructure', contactPerson: 'Contact 5', stage: 'Closed Won', dealValue: 88000, priority: 'High', daysOffset: -15, assignedToId: bdaUser3.id, monthAgo: 1 },
      { companyName: 'Zenith Engineering', industry: 'Industrial Automation', contactPerson: 'Contact 4', stage: 'Closed Won', dealValue: 24000, priority: 'Low', daysOffset: -30, assignedToId: bdaUser3.id, monthAgo: 0 },
      { companyName: 'Alpha Steel Works', industry: 'Infrastructure', contactPerson: 'Contact 5', stage: 'Closed Lost', dealValue: 75000, priority: 'Medium', daysOffset: -25, assignedToId: bdaUser3.id },

      // User 4 leads (7 leads)
      { companyName: 'Matrix Metalworks', industry: 'Heavy Machinery', contactPerson: 'Contact 7', stage: 'New Inquiry', dealValue: 55000, priority: 'Medium', daysOffset: 28, assignedToId: bdaUser4.id },
      { companyName: 'Pinnacle Castings', industry: 'Automotive', contactPerson: 'Contact 8', stage: 'Requirement Discussion', dealValue: 62000, priority: 'Low', daysOffset: 40, assignedToId: bdaUser4.id },
      { companyName: 'Matrix Metalworks', industry: 'Heavy Machinery', contactPerson: 'Contact 7', stage: 'Quotation Sent', dealValue: 45000, priority: 'Medium', daysOffset: 14, assignedToId: bdaUser4.id },
      { companyName: 'Pinnacle Castings', industry: 'Automotive', contactPerson: 'Contact 8', stage: 'Negotiation', dealValue: 85000, priority: 'High', daysOffset: 1, assignedToId: bdaUser4.id },
      { companyName: 'Matrix Metalworks', industry: 'Heavy Machinery', contactPerson: 'Contact 7', stage: 'Closed Won', dealValue: 90000, priority: 'High', daysOffset: -8, assignedToId: bdaUser4.id, monthAgo: 0 },
      { companyName: 'Pinnacle Castings', industry: 'Automotive', contactPerson: 'Contact 8', stage: 'Closed Won', dealValue: 40000, priority: 'Medium', daysOffset: -12, assignedToId: bdaUser4.id, monthAgo: 0 },
      { companyName: 'Matrix Metalworks', industry: 'Heavy Machinery', contactPerson: 'Contact 7', stage: 'Closed Lost', dealValue: 15000, priority: 'Low', daysOffset: -35, assignedToId: bdaUser4.id }
    ];

    const leads = [];
    for (const def of leadDefinitions) {
      const l = await prisma.lead.create({
        data: {
          companyName: def.companyName,
          industry: def.industry,
          contactPerson: def.contactPerson,
          stage: def.stage,
          dealValue: parseFloat(def.dealValue),
          priority: def.priority,
          expectedCloseDate: new Date(Date.now() + def.daysOffset * 24 * 60 * 60 * 1000),
          clientId: clientMap[def.companyName],
          assignedToId: def.assignedToId,
        }
      });
      leads.push(l);
    }
    console.log(`Seeded ${leads.length} leads.`);

    // Update Closed Won lead updatedAt fields so they distribute across 6 months
    console.log('Distributing Closed Won lead dates across 6 months...');
    for (let i = 0; i < leadDefinitions.length; i++) {
      const def = leadDefinitions[i];
      if (def.stage === 'Closed Won' && def.monthAgo !== undefined) {
        const leadDoc = leads[i];
        const date = new Date();
        date.setMonth(date.getMonth() - def.monthAgo);
        date.setDate(15);
        const isoString = date.toISOString();

        // Raw SQLite updates to bypass Prisma autoupdating hooks
        await prisma.$executeRawUnsafe(
          `UPDATE "Lead" SET "createdAt" = ?, "updatedAt" = ? WHERE "id" = ?`,
          isoString,
          isoString,
          leadDoc.id
        );
      }
    }

    // 4. Create Quotations
    console.log('Seeding Quotations...');
    const findLeadId = (companyName, stage, dealValue) => {
      const lead = leads.find(l => l.companyName === companyName && l.stage === stage && l.dealValue === dealValue);
      return lead ? lead.id : null;
    };

    const quoteDefinitions = [
      {
        companyName: 'Nova Industrial Systems',
        stage: 'Quotation Prepared',
        dealValue: 120000,
        product: 'Custom Titanium Aerospace Fasteners (Batch Grade A-4)',
        quantity: 10000,
        unitPrice: 12.5,
        discount: 4,
        deliveryTimeline: '6 Weeks',
        status: 'Draft',
        terms: '50% advance, 50% on shipment. Delivery Ex-Works.',
        totalValue: 120000,
      },
      {
        companyName: 'Nova Industrial Systems',
        stage: 'Quotation Sent',
        dealValue: 85000,
        product: 'M3 Titanium Threaded Rods (Aviation Spec)',
        quantity: 5000,
        unitPrice: 18.0,
        discount: 5,
        deliveryTimeline: '4 Weeks',
        status: 'Sent',
        terms: 'Net 30 payment terms. Freight pre-paid.',
        totalValue: 85500,
      },
      {
        companyName: 'Apex Manufacturing',
        stage: 'Negotiation',
        dealValue: 60000,
        product: 'CNC Machine Base Plate Casting Blocks (Cast Iron Grade G3000)',
        quantity: 40,
        unitPrice: 1500,
        discount: 0,
        deliveryTimeline: '8 Weeks',
        status: 'Under Review',
        terms: '100% Letter of Credit. Freight Ex-Works Pune.',
        totalValue: 60000,
      },
      {
        companyName: 'Titan Components',
        stage: 'Quotation Prepared',
        dealValue: 98000,
        product: 'Helical Gears for Rear Differential (Grade 12-B)',
        quantity: 20000,
        unitPrice: 5.0,
        discount: 2,
        deliveryTimeline: '3 Weeks',
        status: 'Draft',
        terms: 'Net 45 billing. FOB Warehouse Chennai.',
        totalValue: 98000,
      },
      {
        companyName: 'Orion Hydraulics',
        stage: 'Quotation Sent',
        dealValue: 55000,
        product: 'Hydraulic Cylinder Tubes (Seamless Steel ST52)',
        quantity: 500,
        unitPrice: 110.0,
        discount: 0,
        deliveryTimeline: '15 Days',
        status: 'Sent',
        terms: '30% Advance, rest Net 15. FOB Ahmedabad.',
        totalValue: 55000,
      },
      {
        companyName: 'Titan Components',
        stage: 'Negotiation',
        dealValue: 80000,
        product: 'Splined Shaft assemblies (AISI 8620 Case Hardened)',
        quantity: 4000,
        unitPrice: 20.0,
        discount: 0,
        deliveryTimeline: '4 Weeks',
        status: 'Under Review',
        terms: 'Letter of Credit. Delivered at Place.',
        totalValue: 80000,
      },
      {
        companyName: 'Zenith Engineering',
        stage: 'Quotation Prepared',
        dealValue: 32000,
        product: 'Sheet Metal PLC Enclosure Cabinets (RAL 7035 Powder Coat)',
        quantity: 250,
        unitPrice: 130.0,
        discount: 1.5,
        deliveryTimeline: '20 Days',
        status: 'Draft',
        terms: 'Net 30 days. Delivery Ex-Works Hyderabad.',
        totalValue: 32000,
      },
      {
        companyName: 'Alpha Steel Works',
        stage: 'Quotation Sent',
        dealValue: 95000,
        product: 'Heavy Structural H-Girders (Grade Fe500)',
        quantity: 150,
        unitPrice: 650.0,
        discount: 2.5,
        deliveryTimeline: '5 Weeks',
        status: 'Sent',
        terms: '50% LC, 50% RTGS on receipt. Delivered on-site Jamshedpur.',
        totalValue: 95062,
      },
      {
        companyName: 'Pinnacle Castings',
        stage: 'Negotiation',
        dealValue: 85000,
        product: 'Premium Aluminum Alloy Wheels (Automotive Grade C)',
        quantity: 1000,
        unitPrice: 85.0,
        discount: 0,
        deliveryTimeline: '4 Weeks',
        status: 'Under Review',
        terms: 'Net 30 billing. FOB warehouse.',
        totalValue: 85000,
      }
    ];

    let quotationsCount = 0;
    for (const q of quoteDefinitions) {
      const leadId = findLeadId(q.companyName, q.stage, q.dealValue);
      if (leadId) {
        await prisma.quotation.create({
          data: {
            leadId,
            clientId: clientMap[q.companyName],
            product: q.product,
            quantity: parseInt(q.quantity),
            unitPrice: parseFloat(q.unitPrice),
            discount: parseFloat(q.discount),
            deliveryTimeline: q.deliveryTimeline,
            status: q.status,
            terms: q.terms,
            totalValue: parseFloat(q.totalValue),
          }
        });
        quotationsCount++;
      }
    }
    console.log(`Seeded ${quotationsCount} quotations.`);

    // 5. Create Activity Logs
    console.log('Seeding Activity Logs...');
    const findLeadIdForActivity = (companyName, stage) => {
      const lead = leads.find(l => l.companyName === companyName && l.stage === stage);
      return lead ? lead.id : null;
    };

    const activityDefinitions = [
      {
        companyName: 'Apex Manufacturing',
        stage: 'New Inquiry',
        type: 'Email',
        description: 'Received email inquiry requesting catalog for CNC casting components. Details forwarded to design team.',
        createdById: bdaUser1.id,
        daysAgo: 2
      },
      {
        companyName: 'Apex Manufacturing',
        stage: 'Requirement Discussion',
        type: 'Call',
        description: 'Had clarification call regarding technical drawing revision. Technical specs confirmed.',
        createdById: bdaUser1.id,
        daysAgo: 5
      },
      {
        companyName: 'Apex Manufacturing',
        stage: 'Requirement Discussion',
        type: 'Site Visit',
        description: 'Visited Pune Plant. Reviewed CNC machining lines with casting design engineer to ensure proper fitting tolerances.',
        createdById: bdaUser1.id,
        daysAgo: 3
      },
      {
        companyName: 'Nova Industrial Systems',
        stage: 'Quotation Prepared',
        type: 'Meeting',
        description: 'Virtual meeting to finalize grade specification. Drafted quotation for A-4 grade titanium parts.',
        createdById: bdaUser1.id,
        daysAgo: 1
      },
      {
        companyName: 'Apex Manufacturing',
        stage: 'Negotiation',
        type: 'Negotiation Update',
        description: 'Quotation sent. Customer requested 3% additional discount on casting molds. Escalated for manager approval.',
        createdById: bdaUser1.id,
        daysAgo: 4
      },
      {
        companyName: 'Apex Manufacturing',
        stage: 'Negotiation',
        type: 'Call',
        description: 'Follow-up call. Reassured procurement contact that delivery in 8 weeks is guaranteed.',
        createdById: bdaUser1.id,
        daysAgo: 0.5
      },
      {
        companyName: 'Titan Components',
        stage: 'Negotiation',
        type: 'Meeting',
        description: 'Procurement meeting. Discussed unit prices for gear assemblies. Approved prototype specification sheets.',
        createdById: bdaUser2.id,
        daysAgo: 2
      },
      {
        companyName: 'Alpha Steel Works',
        stage: 'Quotation Sent',
        type: 'Email',
        description: 'Sent formal quotation for structural Fe500 H-Girders to procurement desk.',
        createdById: bdaUser3.id,
        daysAgo: 1
      }
    ];

    let activitiesCount = 0;
    for (const act of activityDefinitions) {
      const lId = findLeadIdForActivity(act.companyName, act.stage);
      await prisma.activity.create({
        data: {
          leadId: lId,
          clientId: clientMap[act.companyName],
          type: act.type,
          description: act.description,
          createdById: act.createdById,
          timestamp: new Date(Date.now() - act.daysAgo * 24 * 60 * 60 * 1000)
        }
      });
      activitiesCount++;
    }
    console.log(`Seeded ${activitiesCount} activities.`);

    console.log('Database Seeding Completed Successfully!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error seeding database:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

seedDatabase();
