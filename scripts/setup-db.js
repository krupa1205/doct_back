const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🔄 Setting up database...');

    // Create specialties
    const specialties = [
      'Cardiology',
      'Dermatology',
      'Endocrinology',
      'Gastroenterology',
      'Hematology',
      'Infectious Disease',
      'Nephrology',
      'Neurology',
      'Oncology',
      'Orthopedics',
      'Pediatrics',
      'Psychiatry',
      'Pulmonology',
      'Radiology',
      'Rheumatology',
      'Urology'
    ];

    console.log('📋 Creating specialties...');
    for (const specialtyName of specialties) {
      await prisma.specialty.upsert({
        where: { name: specialtyName },
        update: {},
        create: { name: specialtyName }
      });
    }

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@medtech.com' },
      update: {},
      create: {
        email: 'admin@medtech.com',
        name: 'Admin User',
        passwordHash: adminPassword,
        role: 'ADMIN',
        phone: '+1234567890'
      }
    });

    // Create sample doctor user
    console.log('👨‍⚕️ Creating sample doctor...');
    const doctorPassword = await bcrypt.hash('doctor123', 12);
    const doctorUser = await prisma.user.upsert({
      where: { email: 'doctor@medtech.com' },
      update: {},
      create: {
        email: 'doctor@medtech.com',
        name: 'Dr. John Smith',
        passwordHash: doctorPassword,
        role: 'DOCTOR',
        phone: '+1234567891'
      }
    });

    // Create doctor profile
    const cardiologySpecialty = await prisma.specialty.findUnique({
      where: { name: 'Cardiology' }
    });

    await prisma.doctor.upsert({
      where: { userId: doctorUser.id },
      update: {},
      create: {
        userId: doctorUser.id,
        shortBio: 'Experienced cardiologist with over 10 years of practice. Specializing in heart disease prevention and treatment.',
        priceCents: 5000, // $50.00
        isVerified: true,
        specialties: {
          create: {
            specialtyId: cardiologySpecialty.id
          }
        }
      }
    });

    // Create sample patient user
    console.log('👤 Creating sample patient...');
    const patientPassword = await bcrypt.hash('patient123', 12);
    const patientUser = await prisma.user.upsert({
      where: { email: 'patient@medtech.com' },
      update: {},
      create: {
        email: 'patient@medtech.com',
        name: 'Jane Doe',
        passwordHash: patientPassword,
        role: 'USER',
        phone: '+1234567892'
      }
    });

    console.log('✅ Database setup completed successfully!');
    console.log('\n📝 Sample accounts created:');
    console.log('Admin: admin@medtech.com / admin123');
    console.log('Doctor: doctor@medtech.com / doctor123');
    console.log('Patient: patient@medtech.com / patient123');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('🎉 Setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupDatabase;
