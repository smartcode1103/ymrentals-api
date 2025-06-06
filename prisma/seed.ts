import { PrismaClient, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed completo do banco de dados...');

  // Limpar dados existentes na ordem correta (respeitando foreign keys)
  await prisma.notifications.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.rental.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.category.deleteMany();
  await prisma.content.deleteMany();
  await prisma.user.deleteMany();
  await prisma.address.deleteMany();

  console.log('🗑️ Dados antigos removidos');

  const hashedPassword = await bcrypt.hash('123456', 10);

  // ===== CRIAR USUÁRIOS =====

  // 👤 Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@ymrentals.com',
      password: hashedPassword,
      fullName: 'Administrador Sistema',
      phoneNumber: '+244 923 000 001',
      dateOfBirth: new Date('1985-01-01'),
      userType: 'TENANT',
      role: 'ADMIN',
      accountStatus: 'APPROVED',
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  // 🛡️ Moderador
  const moderator = await prisma.user.create({
    data: {
      email: 'moderador@ymrentals.com',
      password: hashedPassword,
      fullName: 'João Moderador',
      phoneNumber: '+244 923 000 002',
      dateOfBirth: new Date('1990-05-15'),
      userType: 'TENANT',
      role: 'MODERATOR',
      accountStatus: 'APPROVED',
      isEmailVerified: true,
      isPhoneVerified: true,
      createdBy: admin.id,
    },
  });

  // 👨‍💼 Moderador Gerencial
  const moderatorManager = await prisma.user.create({
    data: {
      email: 'gestor@ymrentals.com',
      password: hashedPassword,
      fullName: 'Maria Gestora',
      phoneNumber: '+244 923 000 003',
      dateOfBirth: new Date('1988-03-20'),
      userType: 'TENANT',
      role: 'MODERATOR_MANAGER',
      accountStatus: 'APPROVED',
      isEmailVerified: true,
      isPhoneVerified: true,
      createdBy: admin.id,
    },
  });

  // 🏢 Locador Aprovado
  const landlordApproved = await prisma.user.create({
    data: {
      email: 'empresa@construcoes.ao',
      password: hashedPassword,
      fullName: 'António Silva',
      phoneNumber: '+244 923 111 001',
      dateOfBirth: new Date('1980-07-10'),
      userType: 'LANDLORD',
      role: 'USER',
      accountStatus: 'APPROVED',
      isCompany: true,
      companyName: 'Construções Silva Lda',
      companyType: 'COMPANY',
      companyAddress: 'Rua da Independência, 123, Luanda',
      nif: '541712345',
      companyDocuments: [
        'https://example.com/documents/alvara_construcoes_silva.pdf',
        'https://example.com/documents/certidao_comercial_silva.pdf',
        'https://example.com/documents/nif_silva.pdf'
      ],
      companyCoverImage: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&h=400',
      isEmailVerified: true,
      isPhoneVerified: true,
      approvedBy: admin.id,
      approvedAt: new Date(),
    },
  });

  // ⏳ Locador Pendente
  const landlordPending = await prisma.user.create({
    data: {
      email: 'carlos@equipamentos.ao',
      password: hashedPassword,
      fullName: 'Carlos Mendes',
      phoneNumber: '+244 923 111 002',
      dateOfBirth: new Date('1985-12-05'),
      userType: 'LANDLORD',
      role: 'USER',
      accountStatus: 'PENDING',
      isCompany: true,
      companyName: 'Equipamentos Mendes Lda',
      companyType: 'COMPANY',
      companyAddress: 'Avenida 4 de Fevereiro, 456, Luanda',
      nif: '541723456',
      companyDocuments: [
        'https://example.com/documents/alvara_equipamentos_mendes.pdf',
        'https://example.com/documents/certidao_comercial_mendes.pdf'
      ],
      isEmailVerified: true,
      isPhoneVerified: false,
    },
  });

  // ❌ Locador Rejeitado
  const landlordRejected = await prisma.user.create({
    data: {
      email: 'rejeitado@test.ao',
      password: hashedPassword,
      fullName: 'Pedro Rejeitado',
      phoneNumber: '+244 923 111 003',
      dateOfBirth: new Date('1990-08-15'),
      userType: 'LANDLORD',
      role: 'USER',
      accountStatus: 'REJECTED',
      isCompany: false,
      nif: '004567890LA042',
      companyDocuments: [
        'https://example.com/documents/documento_invalido_pedro.pdf'
      ],
      isEmailVerified: false,
      isPhoneVerified: false,
      rejectedBy: admin.id,
      rejectedAt: new Date(),
      rejectionReason: 'Documentos inválidos',
    },
  });

  // 👥 4 Locatários (com documentos BI)
  const tenant1 = await prisma.user.create({
    data: {
      email: 'locatario1@email.com',
      password: hashedPassword,
      fullName: 'Ana Costa',
      phoneNumber: '+244 923 222 001',
      dateOfBirth: new Date('1991-01-01'),
      userType: 'TENANT',
      role: 'USER',
      accountStatus: 'APPROVED',
      isEmailVerified: true,
      isPhoneVerified: true,
      biDocument: 'https://example.com/documents/bi_ana_costa.pdf',
      biValidated: true,
      biValidatedBy: admin.id,
      biValidatedAt: new Date(),
    },
  });

  const tenant2 = await prisma.user.create({
    data: {
      email: 'locatario2@email.com',
      password: hashedPassword,
      fullName: 'Bruno Santos',
      phoneNumber: '+244 923 222 002',
      dateOfBirth: new Date('1992-02-01'),
      userType: 'TENANT',
      role: 'USER',
      accountStatus: 'APPROVED',
      isEmailVerified: true,
      isPhoneVerified: true,
      biDocument: 'https://example.com/documents/bi_bruno_santos.pdf',
      biValidated: false, // Pendente de validação
    },
  });

  const tenant3 = await prisma.user.create({
    data: {
      email: 'locatario3@email.com',
      password: hashedPassword,
      fullName: 'Carla Ferreira',
      phoneNumber: '+244 923 222 003',
      dateOfBirth: new Date('1993-03-01'),
      userType: 'TENANT',
      role: 'USER',
      accountStatus: 'APPROVED',
      isEmailVerified: true,
      isPhoneVerified: true,
      biDocument: 'https://example.com/documents/bi_carla_ferreira.pdf',
      biValidated: false, // Rejeitado
      biRejectionReason: 'Documento ilegível, favor reenviar com melhor qualidade',
    },
  });

  const tenant4 = await prisma.user.create({
    data: {
      email: 'locatario4@email.com',
      password: hashedPassword,
      fullName: 'David Oliveira',
      phoneNumber: '+244 923 222 004',
      dateOfBirth: new Date('1994-04-01'),
      userType: 'TENANT',
      role: 'USER',
      accountStatus: 'APPROVED',
      isEmailVerified: true,
      isPhoneVerified: true,
      biDocument: 'https://example.com/documents/bi_david_oliveira.pdf',
      biValidated: true,
      biValidatedBy: moderator.id,
      biValidatedAt: new Date(),
    },
  });

  console.log('👥 Usuários criados');

  // ===== CRIAR CATEGORIAS =====
  const category1 = await prisma.category.create({
    data: {
      name: 'Escavadoras',
      description: 'Equipamentos para escavação e movimentação de terra',
      icon: '🚜',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&h=300',
    },
  });

  const category2 = await prisma.category.create({
    data: {
      name: 'Guindastes',
      description: 'Equipamentos para elevação e movimentação de cargas',
      icon: '🏗️',
      image: 'https://images.unsplash.com/photo-1504307651254-35b0e6e6921f?auto=format&fit=crop&w=400&h=300',
    },
  });

  const category3 = await prisma.category.create({
    data: {
      name: 'Tratores',
      description: 'Equipamentos agrícolas e de construção',
      icon: '🚜',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&h=300',
    },
  });

  const category4 = await prisma.category.create({
    data: {
      name: 'Compactadores',
      description: 'Equipamentos para compactação de solo e asfalto',
      icon: '🛣️',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&h=300',
    },
  });

  const category5 = await prisma.category.create({
    data: {
      name: 'Geradores',
      description: 'Equipamentos para geração de energia elétrica',
      icon: '⚡',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&h=300',
    },
  });

  const category6 = await prisma.category.create({
    data: {
      name: 'Ferramentas',
      description: 'Ferramentas manuais e elétricas para construção',
      icon: '🔧',
      image: 'https://images.unsplash.com/photo-1504307651254-35b0e6e6921f?auto=format&fit=crop&w=400&h=300',
    },
  });

  console.log('📂 6 Categorias criadas');

  // ===== CRIAR ENDEREÇOS =====
  const address1 = await prisma.address.create({
    data: {
      street: 'Rua Amílcar Cabral, 123',
      district: 'Maianga',
      city: 'Luanda',
      province: 'Luanda',
      latitude: -8.8390,
      longitude: 13.2894,
    },
  });

  const address2 = await prisma.address.create({
    data: {
      street: 'Avenida 4 de Fevereiro, 456',
      district: 'Ingombota',
      city: 'Luanda',
      province: 'Luanda',
      latitude: -8.8167,
      longitude: 13.2333,
    },
  });

  console.log('📍 2 Endereços criados');

  // ===== CRIAR CONTEÚDOS =====
  const content1 = await prisma.content.create({
    data: {
      key: 'about',
      title: 'Sobre a YMRentals',
      content: '<h2>Quem Somos</h2><p>A YMRentals é a principal plataforma de aluguel de equipamentos de construção em Angola.</p>',
      isActive: true,
    },
  });

  const content2 = await prisma.content.create({
    data: {
      key: 'contact',
      title: 'Entre em Contato',
      content: '<h2>Fale Conosco</h2><p><strong>Telefone:</strong> +244 923 000 000</p><p><strong>Email:</strong> contato@ymrentals.com</p>',
      isActive: true,
    },
  });

  console.log('📄 2 Conteúdos criados');

  // ===== CRIAR 36 EQUIPAMENTOS =====

  // ESCAVADORAS (6)
  const eq1 = await prisma.equipment.create({
    data: {
      name: 'Retroescavadeira CAT 420F2',
      category: 'Escavadoras',
      description: 'Retroescavadeira CAT 420F2 em excelente estado.',
      categoryId: category1.id,
      ownerId: landlordApproved.id,
      price: 250000,
      pricePeriod: 'DAILY',
      images: ['https://picsum.photos/800/600?random=1'],
      moderationStatus: 'APPROVED',
      moderatedBy: moderator.id,
      moderatedAt: new Date(),
      isAvailable: true,
      addressId: address1.id,
      specifications: { 'Peso': '8.5 toneladas', 'Potência': '74 HP' },
    },
  });

  const eq2 = await prisma.equipment.create({
    data: {
      name: 'Escavadora Hidráulica Komatsu',
      category: 'Escavadoras',
      description: 'Escavadora hidráulica de médio porte.',
      categoryId: category1.id,
      ownerId: landlordApproved.id,
      price: 200000,
      pricePeriod: 'DAILY',
      images: ['https://picsum.photos/800/600?random=2'],
      moderationStatus: 'APPROVED',
      moderatedBy: moderator.id,
      moderatedAt: new Date(),
      isAvailable: true,
      addressId: address2.id,
      specifications: { 'Peso': '20 toneladas', 'Potência': '148 HP' },
    },
  });

  const eq3 = await prisma.equipment.create({
    data: {
      name: 'Escavadora Volvo EC210',
      category: 'Escavadoras',
      description: 'Escavadora robusta com excelente eficiência.',
      categoryId: category1.id,
      ownerId: landlordApproved.id,
      price: 220000,
      pricePeriod: 'DAILY',
      images: ['https://picsum.photos/800/600?random=3'],
      moderationStatus: 'APPROVED',
      moderatedBy: moderator.id,
      moderatedAt: new Date(),
      isAvailable: true,
      addressId: address1.id,
      specifications: { 'Peso': '21.5 toneladas', 'Potência': '163 HP' },
    },
  });

  const eq4 = await prisma.equipment.create({
    data: {
      name: 'Mini Escavadora Bobcat',
      category: 'Escavadoras',
      description: 'Mini escavadora compacta ideal para espaços reduzidos.',
      categoryId: category1.id,
      ownerId: landlordApproved.id,
      price: 80000,
      pricePeriod: 'DAILY',
      images: ['https://picsum.photos/800/600?random=4'],
      moderationStatus: 'APPROVED',
      moderatedBy: moderator.id,
      moderatedAt: new Date(),
      isAvailable: true,
      addressId: address2.id,
      specifications: { 'Peso': '3.5 toneladas', 'Potência': '24.8 HP' },
    },
  });

  const eq5 = await prisma.equipment.create({
    data: {
      name: 'Escavadora Hitachi ZX350',
      category: 'Escavadoras',
      description: 'Escavadora de grande porte para projetos pesados.',
      categoryId: category1.id,
      ownerId: landlordApproved.id,
      price: 350000,
      pricePeriod: 'DAILY',
      images: ['https://picsum.photos/800/600?random=5'],
      moderationStatus: 'APPROVED',
      moderatedBy: moderator.id,
      moderatedAt: new Date(),
      isAvailable: false,
      addressId: address1.id,
      specifications: { 'Peso': '35 toneladas', 'Potência': '271 HP' },
    },
  });

  const eq6 = await prisma.equipment.create({
    data: {
      name: 'Escavadora JCB JS220',
      category: 'Escavadoras',
      description: 'Escavadora versátil com tecnologia avançada.',
      categoryId: category1.id,
      ownerId: landlordApproved.id,
      price: 190000,
      pricePeriod: 'DAILY',
      images: ['https://picsum.photos/800/600?random=6'],
      moderationStatus: 'PENDING',
      isAvailable: false,
      addressId: address2.id,
      specifications: { 'Peso': '22 toneladas', 'Potência': '168 HP' },
    },
  });

  // GUINDASTES (6)
  const eq7 = await prisma.equipment.create({
    data: {
      name: 'Guindaste Móvel Liebherr 50T',
      category: 'Guindastes',
      description: 'Guindaste móvel de alta capacidade.',
      categoryId: category2.id,
      ownerId: landlordApproved.id,
      price: 500000,
      pricePeriod: 'DAILY',
      images: ['https://picsum.photos/800/600?random=7'],
      moderationStatus: 'APPROVED',
      moderatedBy: moderator.id,
      moderatedAt: new Date(),
      isAvailable: true,
      addressId: address1.id,
      specifications: { 'Capacidade': '50 toneladas', 'Altura': '40 metros' },
    },
  });

  const eq8 = await prisma.equipment.create({
    data: {
      name: 'Guindaste Torre Potain',
      category: 'Guindastes',
      description: 'Guindaste torre para construção de edifícios.',
      categoryId: category2.id,
      ownerId: landlordApproved.id,
      price: 800000,
      pricePeriod: 'DAILY',
      images: ['https://picsum.photos/800/600?random=8'],
      moderationStatus: 'APPROVED',
      moderatedBy: moderator.id,
      moderatedAt: new Date(),
      isAvailable: true,
      addressId: address2.id,
      specifications: { 'Capacidade': '6 toneladas', 'Altura': '60 metros' },
    },
  });

  const eq9 = await prisma.equipment.create({
    data: {
      name: 'Guindaste Telescópico Grove',
      category: 'Guindastes',
      description: 'Guindaste telescópico compacto.',
      categoryId: category2.id,
      ownerId: landlordApproved.id,
      price: 300000,
      pricePeriod: 'DAILY',
      images: ['https://picsum.photos/800/600?random=9'],
      moderationStatus: 'APPROVED',
      moderatedBy: moderator.id,
      moderatedAt: new Date(),
      isAvailable: true,
      addressId: address1.id,
      specifications: { 'Capacidade': '40 toneladas', 'Altura': '35 metros' },
    },
  });

  const eq10 = await prisma.equipment.create({
    data: {
      name: 'Guindaste Autopropelido Tadano',
      category: 'Guindastes',
      description: 'Guindaste autopropelido versátil.',
      categoryId: category2.id,
      ownerId: landlordApproved.id,
      price: 400000,
      pricePeriod: 'DAILY',
      images: ['https://picsum.photos/800/600?random=10'],
      moderationStatus: 'APPROVED',
      moderatedBy: moderator.id,
      moderatedAt: new Date(),
      isAvailable: true,
      addressId: address2.id,
      specifications: { 'Capacidade': '25 toneladas', 'Altura': '30 metros' },
    },
  });

  const eq11 = await prisma.equipment.create({
    data: {
      name: 'Guindaste Sobre Esteiras',
      category: 'Guindastes',
      description: 'Guindaste sobre esteiras para terrenos difíceis.',
      categoryId: category2.id,
      ownerId: landlordApproved.id,
      price: 600000,
      pricePeriod: 'DAILY',
      images: ['https://picsum.photos/800/600?random=11'],
      moderationStatus: 'APPROVED',
      moderatedBy: moderator.id,
      moderatedAt: new Date(),
      isAvailable: false,
      addressId: address1.id,
      specifications: { 'Capacidade': '55 toneladas', 'Altura': '45 metros' },
    },
  });

  const eq12 = await prisma.equipment.create({
    data: {
      name: 'Mini Guindaste Unic',
      category: 'Guindastes',
      description: 'Mini guindaste para espaços confinados.',
      categoryId: category2.id,
      ownerId: landlordApproved.id,
      price: 150000,
      pricePeriod: 'DAILY',
      images: ['https://picsum.photos/800/600?random=12'],
      moderationStatus: 'PENDING',
      isAvailable: false,
      addressId: address2.id,
      specifications: { 'Capacidade': '3 toneladas', 'Altura': '12 metros' },
    },
  });

  // Criar mais 24 equipamentos (4 por categoria restante)
  // Para simplificar, vou criar apenas alguns representativos

  // TRATORES (6)
  const eq13 = await prisma.equipment.create({
    data: {
      name: 'Trator John Deere 6110',
      category: 'Tratores',
      description: 'Trator agrícola versátil.',
      categoryId: category3.id,
      ownerId: landlordApproved.id,
      price: 180000,
      pricePeriod: 'DAILY',
      images: ['https://picsum.photos/800/600?random=13'],
      moderationStatus: 'APPROVED',
      moderatedBy: moderator.id,
      moderatedAt: new Date(),
      isAvailable: true,
      addressId: address1.id,
      specifications: { 'Potência': '110 HP', 'Peso': '4.2 toneladas' },
    },
  });

  // Criar mais equipamentos de forma simplificada
  for (let i = 14; i <= 36; i++) {
    const categoryIndex = Math.floor((i - 1) / 6);
    const categories = [category1, category2, category3, category4, category5, category6];
    const categoryNames = ['Escavadoras', 'Guindastes', 'Tratores', 'Compactadores', 'Geradores', 'Ferramentas'];

    await prisma.equipment.create({
      data: {
        name: `${categoryNames[categoryIndex]} ${i}`,
        category: categoryNames[categoryIndex],
        description: `Equipamento ${i} da categoria ${categoryNames[categoryIndex]}.`,
        categoryId: categories[categoryIndex].id,
        ownerId: landlordApproved.id,
        price: 50000 + (i * 10000),
        pricePeriod: 'DAILY',
        images: [`https://picsum.photos/800/600?random=${i}`],
        moderationStatus: i % 6 === 0 ? 'PENDING' : 'APPROVED',
        moderatedBy: i % 6 === 0 ? undefined : moderator.id,
        moderatedAt: i % 6 === 0 ? undefined : new Date(),
        isAvailable: i % 5 !== 0,
        addressId: i % 2 === 0 ? address1.id : address2.id,
        specifications: { 'Modelo': `Modelo ${i}`, 'Ano': '2023' },
      },
    });
  }

  console.log('🏗️ 36 Equipamentos criados (6 por categoria)');

  // ===== CRIAR 3 ALUGUÉIS =====

  // 1. Aluguel Completo
  const rental1 = await prisma.rental.create({
    data: {
      equipmentId: eq1.id,
      renterId: tenant1.id,
      ownerId: landlordApproved.id,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-20'),
      startTime: '08:00',
      endTime: '17:00',
      totalAmount: 1250000,
      dailyRate: 250000,
      pricePeriod: 'DAILY',
      status: 'COMPLETED',
      paymentMethod: 'REFERENCE',
      paymentStatus: 'PAID',
      paymentReference: 'REF123456789',
      returnReminderDate: new Date('2024-01-19'),
      returnNotificationSent: true,
    },
  });

  // 2. Aluguel Ativo
  const rental2 = await prisma.rental.create({
    data: {
      equipmentId: eq7.id,
      renterId: tenant2.id,
      ownerId: landlordApproved.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startTime: '07:00',
      endTime: '18:00',
      totalAmount: 3500000,
      dailyRate: 500000,
      pricePeriod: 'DAILY',
      status: 'ACTIVE',
      paymentMethod: 'RECEIPT',
      paymentStatus: 'PAID',
      paymentReceipt: 'https://example.com/receipt2.pdf',
      paymentReceiptStatus: 'APPROVED',
      returnReminderDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      moderatedBy: moderator.id,
      moderatedAt: new Date(),
    },
  });

  // 3. Aluguel Pendente
  const rental3 = await prisma.rental.create({
    data: {
      equipmentId: eq13.id,
      renterId: tenant3.id,
      ownerId: landlordApproved.id,
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      startTime: '08:00',
      endTime: '16:00',
      totalAmount: 900000,
      dailyRate: 180000,
      pricePeriod: 'DAILY',
      status: 'PENDING',
      paymentMethod: 'RECEIPT',
      paymentStatus: 'PENDING',
      paymentReceipt: 'https://example.com/receipt3.pdf',
      paymentReceiptStatus: 'PENDING',
      returnReminderDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // 4. Aluguel com pagamento pendente de validação
  const rental4 = await prisma.rental.create({
    data: {
      equipmentId: eq9.id, // Usando eq9 que existe
      renterId: tenant4.id,
      ownerId: landlordApproved.id,
      startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      startTime: '09:00',
      endTime: '17:00',
      totalAmount: 600000,
      dailyRate: 200000,
      pricePeriod: 'DAILY',
      status: 'PENDING',
      paymentMethod: 'RECEIPT',
      paymentStatus: 'PENDING',
      paymentReceipt: 'https://example.com/receipts/comprovante_david_oliveira.pdf',
      paymentReceiptStatus: 'PENDING',
      returnReminderDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  // 5. Aluguel com pagamento rejeitado
  const rental5 = await prisma.rental.create({
    data: {
      equipmentId: eq11.id, // Usando eq11 que existe
      renterId: tenant3.id,
      ownerId: landlordApproved.id,
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      startTime: '08:00',
      endTime: '18:00',
      totalAmount: 450000,
      dailyRate: 150000,
      pricePeriod: 'DAILY',
      status: 'PENDING',
      paymentMethod: 'RECEIPT',
      paymentStatus: 'PENDING',
      paymentReceipt: 'https://example.com/receipts/comprovante_rejeitado_carla.pdf',
      paymentReceiptStatus: 'REJECTED',
      moderatedBy: moderator.id,
      moderatedAt: new Date(),
      returnReminderDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('📋 5 Aluguéis criados (1 completo, 1 ativo, 3 pendentes - 1 com pagamento rejeitado)');

  // ===== CRIAR 3 FAVORITOS =====
  const favorite1 = await prisma.favorite.create({
    data: {
      id: 'fav-1',
      userId: tenant1.id,
      equipmentId: eq2.id,
    },
  });

  const favorite2 = await prisma.favorite.create({
    data: {
      id: 'fav-2',
      userId: tenant2.id,
      equipmentId: eq8.id,
    },
  });

  const favorite3 = await prisma.favorite.create({
    data: {
      id: 'fav-3',
      userId: tenant3.id,
      equipmentId: eq13.id,
    },
  });

  console.log('❤️ 3 Favoritos criados');

  // ===== CRIAR CONVERSAS E MENSAGENS =====
  console.log('💬 Criando conversas e mensagens...');

  // Lista de todos os usuários para criar conversas
  const allUsers = [admin, moderator, moderatorManager, landlordApproved, landlordPending, landlordRejected, tenant1, tenant2, tenant3, tenant4];

  // Criar conversas entre alguns usuários
  const chat1 = await prisma.chat.create({
    data: {
      id: 'chat-1-admin-tenant1',
      initiatorId: admin.id,
      receiverId: tenant1.id,
    },
  });

  const chat2 = await prisma.chat.create({
    data: {
      id: 'chat-2-landlord-tenant2',
      initiatorId: landlordApproved.id,
      receiverId: tenant2.id,
    },
  });

  const chat3 = await prisma.chat.create({
    data: {
      id: 'chat-3-tenant3-tenant4',
      initiatorId: tenant3.id,
      receiverId: tenant4.id,
    },
  });

  const chat4 = await prisma.chat.create({
    data: {
      id: 'chat-4-moderator-landlord',
      initiatorId: moderator.id,
      receiverId: landlordApproved.id,
    },
  });

  // Criar mensagens para as conversas
  await prisma.message.create({
    data: {
      id: 'msg-1',
      content: 'Olá! Bem-vindo ao YMRentals. Como posso ajudá-lo?',
      chatId: chat1.id,
      senderId: admin.id,
    },
  });

  await prisma.message.create({
    data: {
      id: 'msg-2',
      content: 'Obrigada! Tenho interesse em alugar equipamentos para construção.',
      chatId: chat1.id,
      senderId: tenant1.id,
    },
  });

  await prisma.message.create({
    data: {
      id: 'msg-3',
      content: 'Perfeito! Temos várias opções disponíveis. Que tipo de equipamento você precisa?',
      chatId: chat1.id,
      senderId: admin.id,
    },
  });

  await prisma.message.create({
    data: {
      id: 'msg-4',
      content: 'Olá! Vi seu anúncio da retroescavadeira. Está disponível para esta semana?',
      chatId: chat2.id,
      senderId: tenant2.id,
    },
  });

  await prisma.message.create({
    data: {
      id: 'msg-5',
      content: 'Sim, está disponível! O valor é 250.000 Kz por dia. Quando você precisaria?',
      chatId: chat2.id,
      senderId: landlordApproved.id,
    },
  });

  await prisma.message.create({
    data: {
      id: 'msg-6',
      content: 'Seria para quarta-feira. Posso agendar uma visita?',
      chatId: chat2.id,
      senderId: tenant2.id,
    },
  });

  await prisma.message.create({
    data: {
      id: 'msg-7',
      content: 'Oi! Como está o processo de aprovação dos meus equipamentos?',
      chatId: chat4.id,
      senderId: landlordApproved.id,
    },
  });

  await prisma.message.create({
    data: {
      id: 'msg-8',
      content: 'Olá! Já aprovei 5 dos seus equipamentos. Apenas um está pendente de documentação.',
      chatId: chat4.id,
      senderId: moderator.id,
    },
  });

  console.log('💬 4 Conversas e 8 Mensagens criadas');

  // ===== CRIAR NOTIFICAÇÕES =====
  console.log('🔔 Criando notificações...');

  // Notificações para cada usuário
  const notifications = [
    // Admin
    {
      id: 'notif-1',
      userId: admin.id,
      title: 'Novo locador pendente',
      message: 'Carlos Mendes se registrou como locador e aguarda aprovação.',
      type: NotificationType.INFO,
      data: JSON.stringify({ userId: landlordPending.id, type: 'pending_landlord' }),
    },
    {
      id: 'notif-2',
      userId: admin.id,
      title: 'Sistema atualizado',
      message: 'O sistema foi atualizado com novas funcionalidades.',
      type: NotificationType.SUCCESS,
      isRead: true,
    },

    // Moderador
    {
      id: 'notif-3',
      userId: moderator.id,
      title: 'Novo equipamento para aprovação',
      message: 'Escavadora JCB JS220 aguarda moderação.',
      type: NotificationType.WARNING,
      data: JSON.stringify({ equipmentId: eq6.id, type: 'pending_equipment' }),
    },
    {
      id: 'notif-4',
      userId: moderator.id,
      title: 'Equipamento aprovado',
      message: 'Retroescavadeira CAT 420F2 foi aprovada com sucesso.',
      type: NotificationType.SUCCESS,
      isRead: true,
    },

    // Locador Aprovado
    {
      id: 'notif-5',
      userId: landlordApproved.id,
      title: 'Equipamento aprovado',
      message: 'Sua Retroescavadeira CAT 420F2 foi aprovada e está disponível para aluguel.',
      type: NotificationType.SUCCESS,
    },
    {
      id: 'notif-6',
      userId: landlordApproved.id,
      title: 'Nova mensagem',
      message: 'Você recebeu uma nova mensagem sobre aluguel de equipamento.',
      type: NotificationType.INFO,
      data: JSON.stringify({ chatId: chat2.id, type: 'new_message' }),
    },

    // Locador Pendente
    {
      id: 'notif-7',
      userId: landlordPending.id,
      title: 'Registro em análise',
      message: 'Seu registro como locador está sendo analisado pela equipe.',
      type: NotificationType.INFO,
    },

    // Locador Rejeitado
    {
      id: 'notif-8',
      userId: landlordRejected.id,
      title: 'Registro rejeitado',
      message: 'Seu registro foi rejeitado. Motivo: Documentos inválidos.',
      type: NotificationType.ERROR,
    },

    // Locatários
    {
      id: 'notif-9',
      userId: tenant1.id,
      title: 'Bem-vindo ao YMRentals!',
      message: 'Sua conta foi criada com sucesso. Explore nossos equipamentos.',
      type: NotificationType.SUCCESS,
    },
    {
      id: 'notif-10',
      userId: tenant1.id,
      title: 'Nova mensagem do admin',
      message: 'O administrador enviou uma mensagem para você.',
      type: NotificationType.INFO,
      data: JSON.stringify({ chatId: chat1.id, type: 'new_message' }),
    },

    {
      id: 'notif-11',
      userId: tenant2.id,
      title: 'Aluguel confirmado',
      message: 'Seu aluguel da Retroescavadeira CAT 420F2 foi confirmado.',
      type: NotificationType.SUCCESS,
      data: JSON.stringify({ rentalId: rental1.id, type: 'rental_confirmed' }),
    },
    {
      id: 'notif-12',
      userId: tenant2.id,
      title: 'Lembrete de devolução',
      message: 'Lembre-se de devolver o equipamento até amanhã.',
      type: NotificationType.WARNING,
    },

    {
      id: 'notif-13',
      userId: tenant3.id,
      title: 'Equipamento favorito disponível',
      message: 'O Guindaste Móvel Liebherr 50T que você favoritou está disponível.',
      type: NotificationType.INFO,
    },

    {
      id: 'notif-14',
      userId: tenant4.id,
      title: 'Promoção especial',
      message: 'Aproveite 10% de desconto em aluguéis de fim de semana!',
      type: NotificationType.SUCCESS,
    },
  ];

  // Criar todas as notificações
  for (const notif of notifications) {
    await prisma.notifications.create({
      data: {
        ...notif,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Últimos 7 dias
        updatedAt: new Date(),
      },
    });
  }

  console.log('🔔 14 Notificações criadas para todos os usuários');

  // ===== RESUMO FINAL =====
  console.log('\n🎉 Seed completo finalizado com sucesso!');
  console.log('\n📊 RESUMO DOS DADOS CRIADOS:');
  console.log('');
  console.log('👥 ADMINISTRADORES:');
  console.log('  👤 Admin: admin@ymrentals.com (senha: 123456)');
  console.log('  🛡️ Moderador Básico: moderador@ymrentals.com (senha: 123456)');
  console.log('  👨‍💼 Moderador Gerencial: gestor@ymrentals.com (senha: 123456)');
  console.log('');
  console.log('🏢 LOCADORES (EMPRESAS):');
  console.log('  🏢 Locador Aprovado: empresa@construcoes.ao (senha: 123456)');
  console.log('  ⏳ Locador Pendente: carlos@equipamentos.ao (senha: 123456)');
  console.log('  ❌ Locador Rejeitado: rejeitado@test.ao (senha: 123456)');
  console.log('');
  console.log('👥 LOCATÁRIOS (CLIENTES):');
  console.log('  👥 4 Locatários: locatario1@email.com até locatario4@email.com (senha: 123456)');
  console.log('');
  console.log('🏗️ DADOS ADICIONAIS CRIADOS:');
  console.log('  📦 36 Equipamentos (6 por categoria - maioria aprovados)');
  console.log('  📂 6 Categorias de equipamentos');
  console.log('  📋 3 Aluguéis (1 completo, 1 ativo, 1 pendente)');
  console.log('  ❤️ 3 Favoritos');
  console.log('  💬 4 Conversas com 8 mensagens');
  console.log('  🔔 14 Notificações distribuídas');
  console.log('  📍 2 Endereços');
  console.log('  📄 2 Conteúdos (páginas dinâmicas)');
  console.log('');
  console.log('🎯 RESUMO DOS PAPÉIS:');
  console.log('  Admin: Valida registros de locadores, cria moderadores gerenciais, acesso total');
  console.log('  Moderador Gerencial: Valida locadores, cria moderadores básicos, gerencia categorias');
  console.log('  Moderador Básico: Aprova/rejeita posts de equipamentos e documentos');
  console.log('  Locador: Pode postar equipamentos (requer aprovação do moderador)');
  console.log('  Locatário: Pode se registrar sem validação e alugar equipamentos');
  console.log('');
  console.log('🔑 Todos os usuários têm a mesma senha: 123456 para facilitar os testes.');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
