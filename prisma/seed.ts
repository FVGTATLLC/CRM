import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create Business Lines
  const stts = await prisma.businessLine.create({
    data: { businessLineName: "STTS", businessLineStatus: "Active", ownerName: "System" },
  });
  const t3 = await prisma.businessLine.create({
    data: { businessLineName: "T3", businessLineStatus: "Active", ownerName: "System" },
  });
  const soe = await prisma.businessLine.create({
    data: { businessLineName: "SOE", businessLineStatus: "Active", ownerName: "System" },
  });

  console.log("Business Lines created");

  // Create Regions
  const regions = [];
  const regionNames = ["R1 - Middle East", "R2 - Africa East", "R3 - Africa West", "R4 - Asia Pacific", "R5 - Europe"];
  for (const name of regionNames) {
    const region = await prisma.region.create({
      data: { regionName: name, regionCode: name.split(" ")[0], regionStatus: "Active", businessLineId: stts.id },
    });
    regions.push(region);
  }
  console.log("Regions created");

  // Create Countries
  const countries = [
    { countryName: "United Arab Emirates", continent: "Asia", subContinent: "Middle East", countryCodeISO2: "AE", countryCodeISO3: "ARE", countryDialingCode: "+971", countryPresenceStatus: true },
    { countryName: "India", continent: "Asia", subContinent: "South Asia", countryCodeISO2: "IN", countryCodeISO3: "IND", countryDialingCode: "+91", countryPresenceStatus: true },
    { countryName: "Kenya", continent: "Africa", subContinent: "East Africa", countryCodeISO2: "KE", countryCodeISO3: "KEN", countryDialingCode: "+254", countryPresenceStatus: true },
    { countryName: "Nigeria", continent: "Africa", subContinent: "West Africa", countryCodeISO2: "NG", countryCodeISO3: "NGA", countryDialingCode: "+234", countryPresenceStatus: true },
    { countryName: "United Kingdom", continent: "Europe", subContinent: "Western Europe", countryCodeISO2: "GB", countryCodeISO3: "GBR", countryDialingCode: "+44", countryPresenceStatus: true },
    { countryName: "United States", continent: "Americas", subContinent: "North America", countryCodeISO2: "US", countryCodeISO3: "USA", countryDialingCode: "+1", countryPresenceStatus: false },
    { countryName: "Thailand", continent: "Asia", subContinent: "Southeast Asia", countryCodeISO2: "TH", countryCodeISO3: "THA", countryDialingCode: "+66", countryPresenceStatus: true },
    { countryName: "South Africa", continent: "Africa", subContinent: "Southern Africa", countryCodeISO2: "ZA", countryCodeISO3: "ZAF", countryDialingCode: "+27", countryPresenceStatus: true },
  ];

  const countryRecords = [];
  for (const c of countries) {
    const country = await prisma.country.create({ data: { ...c, countryStatus: "Active" } });
    countryRecords.push(country);
  }
  console.log("Countries created");

  // Create Branches
  const branches = [
    { branchCode: "DXB", branchFullName: "Dubai Branch", city: "Dubai", businessLineId: stts.id, regionId: regions[0].id, countryId: countryRecords[0].id },
    { branchCode: "DEL", branchFullName: "Delhi Branch", city: "New Delhi", businessLineId: stts.id, regionId: regions[3].id, countryId: countryRecords[1].id },
    { branchCode: "NBO", branchFullName: "Nairobi Branch", city: "Nairobi", businessLineId: stts.id, regionId: regions[1].id, countryId: countryRecords[2].id },
    { branchCode: "LOS", branchFullName: "Lagos Branch", city: "Lagos", businessLineId: stts.id, regionId: regions[2].id, countryId: countryRecords[3].id },
    { branchCode: "LON", branchFullName: "London Branch", city: "London", businessLineId: stts.id, regionId: regions[4].id, countryId: countryRecords[4].id },
  ];

  const branchRecords = [];
  for (const b of branches) {
    const branch = await prisma.branch.create({ data: { ...b, branchStatus: "Active" } });
    branchRecords.push(branch);
  }
  console.log("Branches created");

  // Create Departments
  const deptNames = ["Management", "Sales", "Operations", "Finance", "IT", "HR", "Marketing", "Customer Service", "Admin"];
  const deptRecords = [];
  for (const name of deptNames) {
    const dept = await prisma.department.create({
      data: { departmentName: name, departmentCode: name.substring(0, 3).toUpperCase(), departmentStatus: "Active", businessLineId: stts.id },
    });
    deptRecords.push(dept);
  }
  console.log("Departments created");

  // Create Modules
  const modules = [
    { moduleName: "Module Master", moduleShortCode: "MM", moduleCategory: "System", accessControl: "SuperAdmin", enableDisable: "AlwaysEnable" },
    { moduleName: "Master Data Management", moduleShortCode: "MDM", moduleCategory: "System", accessControl: "SuperAdmin", enableDisable: "AlwaysEnable" },
    { moduleName: "User Management", moduleShortCode: "UID", moduleCategory: "System", accessControl: "Admin", enableDisable: "AlwaysEnable" },
    { moduleName: "Role & Permissions", moduleShortCode: "RP", moduleCategory: "System", accessControl: "SuperAdmin", enableDisable: "AlwaysEnable" },
    { moduleName: "Business Line", moduleShortCode: "BL", moduleCategory: "Master", accessControl: "Admin", enableDisable: "AlwaysEnable" },
    { moduleName: "Region", moduleShortCode: "RN", moduleCategory: "Master", accessControl: "Admin", enableDisable: "AlwaysEnable" },
    { moduleName: "Country", moduleShortCode: "CN", moduleCategory: "Master", accessControl: "Admin", enableDisable: "AlwaysEnable" },
    { moduleName: "Branch", moduleShortCode: "BN", moduleCategory: "Master", accessControl: "Admin", enableDisable: "AlwaysEnable" },
    { moduleName: "Department", moduleShortCode: "DN", moduleCategory: "Master", accessControl: "Admin", enableDisable: "AlwaysEnable" },
    { moduleName: "Contact", moduleShortCode: "CT", moduleCategory: "Core", accessControl: "Standard", enableDisable: "YesNo" },
    { moduleName: "Leads", moduleShortCode: "LD", moduleCategory: "Core", accessControl: "Standard", enableDisable: "YesNo" },
    { moduleName: "Account", moduleShortCode: "AC", moduleCategory: "Core", accessControl: "Standard", enableDisable: "YesNo" },
    { moduleName: "Activity - Meeting", moduleShortCode: "MT", moduleCategory: "Core", accessControl: "Standard", enableDisable: "YesNo" },
    { moduleName: "Activity - MOM", moduleShortCode: "MOM", moduleCategory: "Core", accessControl: "Standard", enableDisable: "YesNo" },
    { moduleName: "Activity - Calls", moduleShortCode: "CL", moduleCategory: "Core", accessControl: "Standard", enableDisable: "YesNo" },
    { moduleName: "Activity - Email", moduleShortCode: "EM", moduleCategory: "Core", accessControl: "Standard", enableDisable: "YesNo" },
    { moduleName: "Activity - Chat", moduleShortCode: "CH", moduleCategory: "Core", accessControl: "Standard", enableDisable: "YesNo" },
    { moduleName: "Proposals", moduleShortCode: "PR", moduleCategory: "Core", accessControl: "Standard", enableDisable: "YesNo" },
    { moduleName: "Contracts", moduleShortCode: "CON", moduleCategory: "Core", accessControl: "Standard", enableDisable: "YesNo" },
    { moduleName: "KYB Compliance", moduleShortCode: "KYB", moduleCategory: "Core", accessControl: "Admin", enableDisable: "YesNo" },
    { moduleName: "Reports", moduleShortCode: "RPT", moduleCategory: "Core", accessControl: "Standard", enableDisable: "YesNo" },
    { moduleName: "Audit Logs", moduleShortCode: "AL", moduleCategory: "System", accessControl: "Admin", enableDisable: "AlwaysEnable" },
    { moduleName: "Documents", moduleShortCode: "DOC", moduleCategory: "Core", accessControl: "Standard", enableDisable: "YesNo" },
  ];

  for (const m of modules) {
    await prisma.module.create({ data: { ...m, moduleStatus: "Active" } });
  }
  console.log("Modules created");

  // Create Roles
  const superAdminRole = await prisma.role.create({
    data: {
      roleName: "Super Administrator",
      roleDisplayName: "STTS_Management_SuperAdmin_SuperAdministrator",
      userType: "SuperAdmin",
      roleStatus: "Active",
      businessLineId: stts.id,
      departmentId: deptRecords[0].id,
    },
  });

  const adminRole = await prisma.role.create({
    data: {
      roleName: "Branch Manager",
      roleDisplayName: "STTS_Management_Admin_BranchManager",
      userType: "Admin",
      roleStatus: "Active",
      businessLineId: stts.id,
      departmentId: deptRecords[0].id,
    },
  });

  const salesRole = await prisma.role.create({
    data: {
      roleName: "Sales Executive",
      roleDisplayName: "STTS_Sales_Standard_SalesExecutive",
      userType: "Standard",
      roleStatus: "Active",
      businessLineId: stts.id,
      departmentId: deptRecords[1].id,
    },
  });

  // Additional roles per requirements
  const growthAssociateRole = await prisma.role.create({
    data: {
      roleName: "Growth Associate",
      roleDisplayName: "STTS_Sales_Standard_GrowthAssociate",
      userType: "Standard",
      roleStatus: "Active",
      businessLineId: stts.id,
      departmentId: deptRecords[1].id,
    },
  });

  const acquisitionAssociateRole = await prisma.role.create({
    data: {
      roleName: "Acquisition Associate",
      roleDisplayName: "STTS_Sales_Standard_AcquisitionAssociate",
      userType: "Standard",
      roleStatus: "Active",
      businessLineId: stts.id,
      departmentId: deptRecords[1].id,
    },
  });

  await prisma.role.create({
    data: {
      roleName: "Growth Lead",
      roleDisplayName: "STTS_Sales_Admin_GrowthLead",
      userType: "Admin",
      roleStatus: "Active",
      businessLineId: stts.id,
      departmentId: deptRecords[1].id,
    },
  });

  await prisma.role.create({
    data: {
      roleName: "Acquisition Lead",
      roleDisplayName: "STTS_Sales_Admin_AcquisitionLead",
      userType: "Admin",
      roleStatus: "Active",
      businessLineId: stts.id,
      departmentId: deptRecords[1].id,
    },
  });

  await prisma.role.create({
    data: {
      roleName: "Head of Sales",
      roleDisplayName: "STTS_Management_Admin_HeadOfSales",
      userType: "Admin",
      roleStatus: "Active",
      businessLineId: stts.id,
      departmentId: deptRecords[0].id,
    },
  });

  await prisma.role.create({
    data: {
      roleName: "Analyst",
      roleDisplayName: "STTS_IT_Standard_Analyst",
      userType: "Standard",
      roleStatus: "Active",
      businessLineId: stts.id,
      departmentId: deptRecords[4].id,
    },
  });

  await prisma.role.create({
    data: {
      roleName: "Onboarding Associate",
      roleDisplayName: "STTS_Operations_Standard_OnboardingAssociate",
      userType: "Standard",
      roleStatus: "Active",
      businessLineId: stts.id,
      departmentId: deptRecords[2].id,
    },
  });

  await prisma.role.create({
    data: {
      roleName: "Finance Officer",
      roleDisplayName: "STTS_Finance_Standard_FinanceOfficer",
      userType: "Standard",
      roleStatus: "Active",
      businessLineId: stts.id,
      departmentId: deptRecords[3].id,
    },
  });

  await prisma.role.create({
    data: {
      roleName: "Compliance Officer",
      roleDisplayName: "STTS_Operations_Standard_ComplianceOfficer",
      userType: "Standard",
      roleStatus: "Active",
      businessLineId: stts.id,
      departmentId: deptRecords[2].id,
    },
  });

  console.log("Roles created");

  // Create Users
  const adminPassword = await bcrypt.hash("admin123", 12);
  const userPassword = await bcrypt.hash("user123", 12);

  await prisma.user.create({
    data: {
      salutation: "Mr",
      firstName: "Moyo",
      lastName: "O",
      email: "admin@flyvento.co.in",
      username: "admin@flyvento.co.in",
      passwordHash: adminPassword,
      userType: "SuperAdmin",
      phone: "+971501234567",
      designation: "System Administrator",
      userStatus: "Active",
      businessLineId: stts.id,
      departmentId: deptRecords[0].id,
      branchId: branchRecords[0].id,
      countryId: countryRecords[0].id,
      roleId: superAdminRole.id,
    },
  });

  await prisma.user.create({
    data: {
      salutation: "Mr",
      firstName: "Ayo",
      lastName: "Ayo",
      email: "user@flyvento.co.in",
      username: "user@flyvento.co.in",
      passwordHash: userPassword,
      userType: "Standard",
      phone: "+911234567890",
      designation: "Sales Executive",
      userStatus: "Active",
      businessLineId: stts.id,
      departmentId: deptRecords[1].id,
      branchId: branchRecords[1].id,
      countryId: countryRecords[1].id,
      roleId: salesRole.id,
    },
  });

  const branchMgrPassword = await bcrypt.hash("manager123", 12);
  await prisma.user.create({
    data: {
      salutation: "Mrs",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "manager@flyvento.co.in",
      username: "manager@flyvento.co.in",
      passwordHash: branchMgrPassword,
      userType: "Admin",
      phone: "+254712345678",
      designation: "Branch Manager",
      userStatus: "Active",
      businessLineId: stts.id,
      departmentId: deptRecords[0].id,
      branchId: branchRecords[2].id,
      countryId: countryRecords[2].id,
      roleId: adminRole.id,
    },
  });

  console.log("Users created");

  // Create sample Global Master data
  const masterData = [
    { moduleName: "BusinessLine", dropdownName: "Business Line Name", l1Category: "STTS" },
    { moduleName: "BusinessLine", dropdownName: "Business Line Name", l1Category: "T3" },
    { moduleName: "BusinessLine", dropdownName: "Business Line Name", l1Category: "SOE" },
    { moduleName: "Account", dropdownName: "Account Segment", l1Category: "Corporate" },
    { moduleName: "Account", dropdownName: "Account Segment", l1Category: "Retail" },
    { moduleName: "Account", dropdownName: "Account Segment", l1Category: "Non IATA" },
    { moduleName: "Account", dropdownName: "Account Segment", l1Category: "Interbranch" },
    { moduleName: "Account", dropdownName: "Account Segment", l1Category: "Other" },
    { moduleName: "Lead", dropdownName: "Lead Type", l1Category: "Corporate" },
    { moduleName: "Lead", dropdownName: "Lead Type", l1Category: "Retail" },
    { moduleName: "Lead", dropdownName: "Lead Type", l1Category: "Non IATA" },
    { moduleName: "Lead", dropdownName: "Lead Type", l1Category: "IATA" },
    { moduleName: "Lead", dropdownName: "Lead Type", l1Category: "Airline" },
    { moduleName: "Lead", dropdownName: "Lead Type", l1Category: "Other" },
  ];

  for (const m of masterData) {
    await prisma.globalMaster.create({ data: { ...m, isActive: true } });
  }
  console.log("Global Master data created");

  // Create sample Leads
  const users = await prisma.user.findMany();
  const sampleLeads = [
    { leadType: "Corporate", firstName: "John", lastName: "Smith", email: "john.smith@acme.com", company: "Acme Corp", leadStatus: "New", leadSource: "Website", phone: "+971501111111" },
    { leadType: "Retail", firstName: "Emily", lastName: "Davis", email: "emily@travel.com", company: "Travel Plus", leadStatus: "Contacted", leadSource: "Referral", phone: "+971502222222" },
    { leadType: "Corporate", firstName: "Ahmed", lastName: "Hassan", email: "ahmed@corp.com", company: "Gulf Corp", leadStatus: "Qualified", leadSource: "TradeShow", phone: "+971503333333" },
    { leadType: "IATA", firstName: "Lisa", lastName: "Chen", email: "lisa@airways.com", company: "Pacific Airways", leadStatus: "Proposal", leadSource: "ColdCall", phone: "+971504444444" },
    { leadType: "NonIATA", firstName: "David", lastName: "Brown", email: "david@tours.com", company: "Brown Tours", leadStatus: "New", leadSource: "SocialMedia", phone: "+971505555555" },
    { leadType: "Hotel", firstName: "Ravi", lastName: "Patel", email: "ravi@grandhotel.com", company: "Grand Hotel", leadStatus: "New", leadSource: "Website", phone: "+971506666001" },
    { leadType: "Hotel", firstName: "Maria", lastName: "Garcia", email: "maria@oceanresort.com", company: "Ocean Resort", leadStatus: "Contacted", leadSource: "TradeShow", phone: "+971506666002" },
    { leadType: "Corporate", firstName: "James", lastName: "Taylor", email: "james@megacorp.com", company: "Mega Corp", leadStatus: "Engaged", leadSource: "Referral", phone: "+971506666003" },
  ];

  for (const lead of sampleLeads) {
    await prisma.lead.create({ data: { ...lead, ownerId: users[0].id } });
  }

  // Create sample Accounts
  const sampleAccounts = [
    { accountName: "Acme Corporation", accountType: "Corporate", segment: "NCA", industry: "Technology", email: "info@acme.com", phone: "+971501234001", accountStatus: "Active" },
    { accountName: "Gulf Travel Agency", accountType: "Retail", industry: "Travel", email: "info@gulftravel.com", phone: "+971501234002", accountStatus: "Active" },
    { accountName: "Safari Adventures", accountType: "NonIATA", industry: "Tourism", email: "info@safari.com", phone: "+254701234003", accountStatus: "Active" },
  ];

  for (const acc of sampleAccounts) {
    await prisma.account.create({ data: { ...acc, ownerId: users[0].id } });
  }

  // Create sample Contacts
  const accounts = await prisma.account.findMany();
  const sampleContacts = [
    { salutation: "Mr", firstName: "Robert", lastName: "Wilson", email: "robert@acme.com", phone: "+971506666666", company: "Acme Corp", jobTitle: "CEO", contactStatus: "Active", accountId: accounts[0]?.id },
    { salutation: "Ms", firstName: "Jane", lastName: "Miller", email: "jane@gulftravel.com", phone: "+971507777777", company: "Gulf Travel", jobTitle: "Director", contactStatus: "Active", accountId: accounts[1]?.id },
    { salutation: "Mr", firstName: "Peter", lastName: "Okafor", email: "peter@safari.com", phone: "+254708888888", company: "Safari Adventures", jobTitle: "Manager", contactStatus: "Active", accountId: accounts[2]?.id },
  ];

  for (const contact of sampleContacts) {
    await prisma.contact.create({ data: { ...contact, ownerId: users[0].id } });
  }

  // Create sample Activities
  const sampleActivities = [
    { activityType: "Meeting", subject: "Q1 Review Meeting", description: "Quarterly review with Acme Corp", activityDate: new Date(), location: "Dubai Office", status: "Planned", priority: "High" },
    { activityType: "Call", subject: "Follow up with Gulf Travel", description: "Discuss new package options", activityDate: new Date(), status: "Completed", priority: "Normal" },
    { activityType: "MOM", subject: "Partnership Discussion MOM", description: "Minutes from partnership meeting", activityDate: new Date(), status: "Completed", priority: "Normal" },
    { activityType: "Meeting", subject: "Client Onboarding - Safari Adventures", activityDate: new Date(Date.now() + 86400000), location: "Nairobi Office", status: "Planned", priority: "Normal" },
  ];

  for (const activity of sampleActivities) {
    await prisma.activity.create({ data: { ...activity, ownerId: users[0].id } });
  }

  console.log("Sample CRM data created");

  // Create sample Proposals
  const sampleProposals = [
    { title: "Annual Travel Package - Acme Corp", linkedToType: "Account", linkedToName: "Acme Corporation", value: 150000, currency: "USD", description: "Comprehensive corporate travel management package", validUntil: new Date(Date.now() + 30 * 86400000), status: "Sent", accountId: accounts[0]?.id },
    { title: "Group Tour Package - Gulf Travel", linkedToType: "Account", linkedToName: "Gulf Travel Agency", value: 45000, currency: "AED", description: "Group tour packages for Q2", validUntil: new Date(Date.now() + 60 * 86400000), status: "Draft", accountId: accounts[1]?.id },
    { title: "Safari Premium Package", linkedToType: "Account", linkedToName: "Safari Adventures", value: 75000, currency: "KES", description: "Premium safari experience packages", validUntil: new Date(Date.now() + 45 * 86400000), status: "Accepted", accountId: accounts[2]?.id },
  ];

  for (const p of sampleProposals) {
    await prisma.proposal.create({ data: { ...p, ownerId: users[0].id, createdByName: "Super Admin" } });
  }
  console.log("Proposals created");

  // Create sample Contracts
  const sampleContracts = [
    { title: "Acme Corp Annual Travel Contract", value: 150000, currency: "USD", startDate: new Date(), endDate: new Date(Date.now() + 365 * 86400000), status: "Active", accountId: accounts[0]?.id! },
    { title: "Safari Adventures Partnership", value: 75000, currency: "KES", startDate: new Date(), endDate: new Date(Date.now() + 180 * 86400000), status: "Signed", accountId: accounts[2]?.id! },
  ];

  for (const c of sampleContracts) {
    await prisma.contract.create({ data: { ...c, ownerId: users[0].id, createdByName: "Super Admin" } });
  }
  console.log("Contracts created");

  // Create sample KYB Checklist items
  const kybDocTypes = ["Trade License", "Tax Certificate", "Bank Reference Letter", "Company Profile", "ID Proof"];
  for (const docType of kybDocTypes) {
    await prisma.kybChecklist.create({
      data: {
        documentType: docType,
        documentName: `${docType} - Acme Corp`,
        accountId: accounts[0]?.id!,
        status: docType === "Trade License" ? "Verified" : docType === "Tax Certificate" ? "Uploaded" : "Pending",
        isUploaded: docType === "Trade License" || docType === "Tax Certificate",
        isVerified: docType === "Trade License",
        createdByName: "Super Admin",
      },
    });
  }
  console.log("KYB Checklist created");

  // Add Lead Type master data for Hotel
  await prisma.globalMaster.create({
    data: { moduleName: "Lead", dropdownName: "Lead Type", l1Category: "Hotel", isActive: true },
  });

  // Add Proposal and Contract status master data
  const proposalStatuses = ["Draft", "Sent", "Accepted", "Rejected"];
  const contractStatuses = ["Draft", "Sent", "Signed", "Active", "Expired"];
  for (const s of proposalStatuses) {
    await prisma.globalMaster.create({ data: { moduleName: "Proposal", dropdownName: "Proposal Status", l1Category: s, isActive: true } });
  }
  for (const s of contractStatuses) {
    await prisma.globalMaster.create({ data: { moduleName: "Contract", dropdownName: "Contract Status", l1Category: s, isActive: true } });
  }

  console.log("Additional master data created");

  // Create sample notifications
  await prisma.notification.createMany({
    data: [
      { userId: users[0].id, type: "success", title: "Welcome to FLYVENTO CRM", description: "Your account has been set up successfully." },
      { userId: users[0].id, type: "info", title: "New Lead Assigned", description: "John Smith from Acme Corp has been assigned to you." },
      { userId: users[0].id, type: "warning", title: "Meeting Reminder", description: "Q1 Review Meeting starts in 1 hour." },
    ],
  });

  console.log("Notifications created");
  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
