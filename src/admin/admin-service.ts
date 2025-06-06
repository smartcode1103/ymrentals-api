import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  // ===== PERMISSION HELPERS =====
  private async ensureAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
  }

  private async ensureAdminOrManager(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'MODERATOR_MANAGER'].includes(user.role)) {
      throw new ForbiddenException('Admin or Manager access required');
    }
  }

  private async ensureAdminOrModerator(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'MODERATOR_MANAGER', 'MODERATOR'].includes(user.role)) {
      throw new ForbiddenException('Admin or Moderator access required');
    }
  }

  // ===== DASHBOARD =====
  async getDashboardData(adminId: string, role: string) {
    await this.ensureAdminOrModerator(adminId);

    const [
      totalUsers,
      totalEquipment,
      totalRentals,
      pendingLandlords,
      pendingEquipment,
      activeRentals,
      totalRevenue,
      recentActivities
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.equipment.count({ where: { deletedAt: null } }),
      this.prisma.rental.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          userType: 'LANDLORD',
          accountStatus: 'PENDING'
        }
      }),
      this.prisma.equipment.count({
        where: {
          deletedAt: null,
          moderationStatus: 'PENDING'
        }
      }),
      this.prisma.rental.count({
        where: {
          deletedAt: null,
          status: 'ACTIVE'
        }
      }),
      this.prisma.rental.aggregate({
        where: { status: 'COMPLETED', deletedAt: null },
        _sum: { totalAmount: true }
      }),
      this.getRecentActivities(adminId)
    ]);

    return {
      overview: {
        totalUsers,
        totalEquipment,
        totalRentals,
        pendingLandlords,
        pendingEquipment,
        activeRentals,
        totalRevenue: totalRevenue._sum.totalAmount || 0
      },
      recentActivities
    };
  }

  async getDashboardStats(adminId: string) {
    await this.ensureAdminOrModerator(adminId);

    const [
      totalUsers,
      totalEquipment,
      totalRentals,
      pendingApprovals,
      totalRevenue
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.equipment.count({ where: { deletedAt: null } }),
      this.prisma.rental.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          userType: 'LANDLORD',
          accountStatus: 'PENDING'
        }
      }),
      this.prisma.rental.aggregate({
        where: { status: 'COMPLETED', deletedAt: null },
        _sum: { totalAmount: true }
      })
    ]);

    return {
      totalUsers,
      totalEquipment,
      totalRentals,
      pendingApprovals,
      totalRevenue: totalRevenue._sum.totalAmount || 0
    };
  }

  async getStats(adminId: string, role: string, period?: string) {
    await this.ensureAdminOrModerator(adminId);

    // Calcular data de início baseada no período
    let startDate: Date | undefined;
    if (period) {
      const now = new Date();
      switch (period) {
        case '1month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case '3months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case '6months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case '1year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
      }
    }

    const [
      userStats,
      equipmentStats,
      rentalStats,
      categoryStats,
      monthlyGrowth
    ] = await Promise.all([
      this.getUserStats(startDate),
      this.getEquipmentStats(startDate),
      this.getRentalStats(startDate),
      this.getCategoryStats(),
      this.getMonthlyGrowth(period)
    ]);

    return {
      userStats,
      equipmentStats,
      rentalStats,
      categoryStats,
      monthlyGrowth
    };
  }

  private async getUserStats(startDate?: Date) {
    const baseWhere = { deletedAt: null };
    const periodWhere = startDate ? { ...baseWhere, createdAt: { gte: startDate } } : baseWhere;

    const [total, tenants, landlords, pending, approved, rejected, thisMonth, byType, byStatus] = await Promise.all([
      this.prisma.user.count({ where: baseWhere }),
      this.prisma.user.count({ where: { ...baseWhere, userType: 'TENANT' } }),
      this.prisma.user.count({ where: { ...baseWhere, userType: 'LANDLORD' } }),
      this.prisma.user.count({ where: { ...baseWhere, accountStatus: 'PENDING' } }),
      this.prisma.user.count({ where: { ...baseWhere, accountStatus: 'APPROVED' } }),
      this.prisma.user.count({ where: { ...baseWhere, accountStatus: 'REJECTED' } }),
      this.prisma.user.count({ where: periodWhere }),
      this.prisma.user.groupBy({
        by: ['userType'],
        where: baseWhere,
        _count: { userType: true }
      }),
      this.prisma.user.groupBy({
        by: ['accountStatus'],
        where: baseWhere,
        _count: { accountStatus: true }
      })
    ]);

    return { total, tenants, landlords, pending, approved, rejected, thisMonth, byType, byStatus };
  }

  private async getEquipmentStats(startDate?: Date) {
    const baseWhere = { deletedAt: null };
    const periodWhere = startDate ? { ...baseWhere, createdAt: { gte: startDate } } : baseWhere;

    const [total, pending, approved, rejected, available, thisMonth, byStatus, byCategory] = await Promise.all([
      this.prisma.equipment.count({ where: baseWhere }),
      this.prisma.equipment.count({ where: { ...baseWhere, moderationStatus: 'PENDING' } }),
      this.prisma.equipment.count({ where: { ...baseWhere, moderationStatus: 'APPROVED' } }),
      this.prisma.equipment.count({ where: { ...baseWhere, moderationStatus: 'REJECTED' } }),
      this.prisma.equipment.count({ where: { ...baseWhere, isAvailable: true } }),
      this.prisma.equipment.count({ where: periodWhere }),
      this.prisma.equipment.groupBy({
        by: ['moderationStatus'],
        where: baseWhere,
        _count: { moderationStatus: true }
      }),
      this.prisma.equipment.groupBy({
        by: ['category'],
        where: baseWhere,
        _count: { category: true }
      })
    ]);

    return { total, pending, approved, rejected, available, thisMonth, byStatus, byCategory };
  }

  private async getRentalStats(startDate?: Date) {
    const baseWhere = { deletedAt: null };
    const periodWhere = startDate ? { ...baseWhere, createdAt: { gte: startDate } } : baseWhere;

    const [total, pending, active, completed, cancelled, thisMonth, revenue, byStatus] = await Promise.all([
      this.prisma.rental.count({ where: baseWhere }),
      this.prisma.rental.count({ where: { ...baseWhere, status: 'PENDING' } }),
      this.prisma.rental.count({ where: { ...baseWhere, status: 'ACTIVE' } }),
      this.prisma.rental.count({ where: { ...baseWhere, status: 'COMPLETED' } }),
      this.prisma.rental.count({ where: { ...baseWhere, status: 'CANCELLED' } }),
      this.prisma.rental.count({ where: periodWhere }),
      this.prisma.rental.aggregate({
        where: { ...baseWhere, status: 'COMPLETED' },
        _sum: { totalAmount: true }
      }),
      this.prisma.rental.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { status: true }
      })
    ]);

    return {
      total,
      pending,
      active,
      completed,
      cancelled,
      thisMonth,
      revenue: revenue._sum.totalAmount || 0,
      byStatus
    };
  }

  private async getCategoryStats() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: { Equipment: true }
        }
      },
      orderBy: {
        Equipment: {
          _count: 'desc'
        }
      }
    });
  }

  private async getMonthlyGrowth(period?: string) {
    const months = period === '1year' ? 12 : 6;
    const monthlyData: Array<{
      month: string;
      users: number;
      equipment: number;
      rentals: number;
    }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const [users, equipment, rentals] = await Promise.all([
        this.prisma.user.count({
          where: {
            deletedAt: null,
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          }
        }),
        this.prisma.equipment.count({
          where: {
            deletedAt: null,
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          }
        }),
        this.prisma.rental.count({
          where: {
            deletedAt: null,
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          }
        })
      ]);

      monthlyData.push({
        month: date.toLocaleDateString('pt-AO', { month: 'short', year: 'numeric' }),
        users,
        equipment,
        rentals
      });
    }

    return monthlyData;
  }

  async getRecentActivities(adminId: string) {
    await this.ensureAdminOrModerator(adminId);

    const [recentUsers, recentEquipment] = await Promise.all([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          userType: true,
          accountStatus: true,
          createdAt: true
        }
      }),
      this.prisma.equipment.findMany({
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          moderationStatus: true,
          createdAt: true,
          owner: {
            select: { fullName: true }
          }
        }
      })
    ]);

    const activities: any[] = [];

    recentUsers.forEach(user => {
      activities.push({
        type: 'user_registered',
        title: 'Novo usuário registrado',
        description: `${user.fullName} se registrou como ${user.userType}`,
        timestamp: user.createdAt,
        status: user.accountStatus,
        userId: user.id,
      });
    });

    recentEquipment.forEach(equipment => {
      activities.push({
        type: 'equipment_created',
        title: 'Novo equipamento adicionado',
        description: `${equipment.name} foi adicionado por ${equipment.owner.fullName}`,
        timestamp: equipment.createdAt,
        status: equipment.moderationStatus,
        equipmentId: equipment.id,
      });
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return activities.slice(0, 10);
  }

  // ===== USER MANAGEMENT =====
  async getUsers(adminId: string, adminRole: string, filters: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    userType?: string;
  }) {
    await this.ensureAdminOrModerator(adminId);

    const { page, limit, search, status, userType } = filters;
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (userType) {
      if (['TENANT', 'LANDLORD'].includes(userType)) {
        where.userType = userType;
      } else {
        where.role = userType;
      }
    }

    if (status) {
      switch (status) {
        case 'approved':
          where.accountStatus = 'APPROVED';
          break;
        case 'pending':
          where.accountStatus = 'PENDING';
          break;
        case 'rejected':
          where.accountStatus = 'REJECTED';
          break;
        case 'blocked':
          where.isBlocked = true;
          break;
        case 'verified':
          where.isEmailVerified = true;
          break;
      }
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          userType: true,
          role: true,
          accountStatus: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          isBlocked: true,
          isCompany: true,
          companyName: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              ownedEquipments: true,
              renterRentals: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getUserDetails(adminId: string, userId: string) {
    await this.ensureAdminOrModerator(adminId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        ownedEquipments: {
          where: { deletedAt: null },
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        renterRentals: {
          where: { deletedAt: null },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            equipment: { select: { name: true } }
          }
        },
        ownerRentals: {
          where: { deletedAt: null },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            equipment: { select: { name: true } },
            renter: { select: { fullName: true } }
          }
        },
        _count: {
          select: {
            ownedEquipments: true,
            renterRentals: true,
            ownerRentals: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(adminId: string, userId: string, updateData: any) {
    await this.ensureAdminOrModerator(adminId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: updateData.fullName,
        email: updateData.email,
        phoneNumber: updateData.phoneNumber,
        companyName: updateData.companyName,
        isEmailVerified: updateData.isEmailVerified,
        isPhoneVerified: updateData.isPhoneVerified,
      }
    });
  }

  async toggleUserBlock(adminId: string, userId: string, blocked: boolean, reason?: string) {
    await this.ensureAdminOrModerator(adminId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: blocked }
    });
  }

  async deleteUser(adminId: string, userId: string) {
    await this.ensureAdmin(adminId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() }
    });
  }

  // ===== LANDLORD VALIDATION =====
  async getPendingLandlords(adminId: string) {
    await this.ensureAdminOrManager(adminId);

    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        userType: 'LANDLORD',
        accountStatus: 'PENDING'
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        companyName: true,
        companyType: true,
        companyAddress: true,
        companyDocuments: true,
        nif: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async validateLandlord(adminId: string, landlordId: string, approved: boolean, reason?: string) {
    await this.ensureAdminOrManager(adminId);

    const landlord = await this.prisma.user.findUnique({
      where: { id: landlordId, deletedAt: null, userType: 'LANDLORD' }
    });

    if (!landlord) {
      throw new NotFoundException('Landlord not found');
    }

    if (landlord.accountStatus !== 'PENDING') {
      throw new ForbiddenException('Landlord is not pending validation');
    }

    const updateData: any = {
      accountStatus: approved ? 'APPROVED' : 'REJECTED',
      [approved ? 'approvedAt' : 'rejectedAt']: new Date(),
      [approved ? 'approvedBy' : 'rejectedBy']: adminId
    };

    if (!approved && reason) {
      updateData.rejectionReason = reason;
    }

    return this.prisma.user.update({
      where: { id: landlordId },
      data: updateData
    });
  }

  async getLandlordHistory(adminId: string, page: number = 1, limit: number = 10, search?: string, status?: string) {
    await this.ensureAdminOrManager(adminId);

    const skip = (page - 1) * limit;

    // Construir condições de busca
    const whereCondition: any = {
      deletedAt: null,
      userType: 'LANDLORD',
    };

    // Filtrar por status específico se fornecido
    if (status && (status === 'APPROVED' || status === 'REJECTED')) {
      whereCondition.accountStatus = status;
    } else {
      // Se não especificado, buscar ambos
      whereCondition.accountStatus = { in: ['APPROVED', 'REJECTED'] };
    }

    // Adicionar filtro de pesquisa
    if (search) {
      whereCondition.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { nif: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [landlords, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          email: true,
          fullName: true,
          phoneNumber: true,
          companyName: true,
          companyType: true,
          companyAddress: true,
          nif: true,
          companyDocuments: true,
          createdAt: true,
          accountStatus: true,
          approvedAt: true,
          rejectedAt: true,
          approvedBy: true,
          rejectedBy: true,
          rejectionReason: true,
        },
        orderBy: [
          { rejectedAt: 'desc' },
          { approvedAt: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where: whereCondition })
    ]);

    return {
      data: landlords,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // ===== MODERATOR MANAGEMENT =====
  async getModerators(adminId: string, role: string) {
    await this.ensureAdminOrManager(adminId);

    const where: any = {
      deletedAt: null,
      role: { in: ['MODERATOR', 'MODERATOR_MANAGER'] }
    };

    // Se for moderador gerencial, só pode ver moderadores básicos
    if (role === 'MODERATOR_MANAGER') {
      where.role = 'MODERATOR';
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        accountStatus: true,
        isBlocked: true,
        createdAt: true,
        createdBy: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createModerator(adminId: string, moderatorData: any) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId, deletedAt: null },
      select: { role: true }
    });

    if (!admin) {
      throw new ForbiddenException('Admin not found');
    }

    // Verificar permissões para criar moderadores
    if (moderatorData.role === 'MODERATOR_MANAGER' && admin.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create manager moderators');
    }

    if (!['ADMIN', 'MODERATOR_MANAGER'].includes(admin.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Verificar se email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: moderatorData.email }
    });

    if (existingUser) {
      throw new ForbiddenException('Email already exists');
    }

    return this.prisma.user.create({
      data: {
        email: moderatorData.email,
        password: moderatorData.password, // Deve ser hasheado antes
        fullName: moderatorData.fullName,
        phoneNumber: moderatorData.phoneNumber,
        dateOfBirth: new Date(moderatorData.dateOfBirth),
        role: moderatorData.role,
        userType: 'TENANT', // Moderadores são tecnicamente tenants
        accountStatus: 'APPROVED',
        isEmailVerified: true,
        createdBy: adminId,
        approvedBy: adminId,
        approvedAt: new Date()
      }
    });
  }

  async updateModerator(adminId: string, moderatorId: string, updateData: any) {
    await this.ensureAdminOrManager(adminId);

    const moderator = await this.prisma.user.findUnique({
      where: { id: moderatorId, deletedAt: null }
    });

    if (!moderator || !['MODERATOR', 'MODERATOR_MANAGER'].includes(moderator.role)) {
      throw new NotFoundException('Moderator not found');
    }

    return this.prisma.user.update({
      where: { id: moderatorId },
      data: {
        fullName: updateData.fullName,
        email: updateData.email,
        phoneNumber: updateData.phoneNumber,
        isBlocked: updateData.isBlocked
      }
    });
  }

  async deleteModerator(adminId: string, moderatorId: string) {
    await this.ensureAdmin(adminId);

    const moderator = await this.prisma.user.findUnique({
      where: { id: moderatorId, deletedAt: null }
    });

    if (!moderator || !['MODERATOR', 'MODERATOR_MANAGER'].includes(moderator.role)) {
      throw new NotFoundException('Moderator not found');
    }

    return this.prisma.user.update({
      where: { id: moderatorId },
      data: { deletedAt: new Date() }
    });
  }

  // ===== EQUIPMENT MANAGEMENT =====
  async getEquipment(filters: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }) {
    const { page, limit, search, status } = filters;
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.moderationStatus = status.toUpperCase();
    }

    const skip = (page - 1) * limit;

    const [equipment, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
              companyName: true
            }
          },
          Category: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              rentals: true,
              reviews: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.equipment.count({ where })
    ]);

    return {
      data: equipment,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateEquipmentStatus(equipmentId: string, status: string, reason?: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: equipmentId, deletedAt: null }
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    const updateData: any = {
      moderationStatus: status.toUpperCase(),
      moderatedAt: new Date()
    };

    if (status.toUpperCase() === 'REJECTED' && reason) {
      updateData.rejectionReason = reason;
    }

    return this.prisma.equipment.update({
      where: { id: equipmentId },
      data: updateData
    });
  }

  // ===== RENTAL MANAGEMENT =====
  async getRentals(filters: {
    page: number;
    limit: number;
    status?: string;
    paymentReceiptStatus?: string;
  }) {
    const { page, limit, status, paymentReceiptStatus } = filters;
    const where: any = { deletedAt: null };

    if (status) {
      where.status = status.toUpperCase();
    }

    if (paymentReceiptStatus) {
      where.paymentReceiptStatus = paymentReceiptStatus.toUpperCase();
      where.paymentReceipt = { not: null }; // Só incluir aluguéis com comprovativo
    }

    const skip = (page - 1) * limit;

    const [rentals, total] = await Promise.all([
      this.prisma.rental.findMany({
        where,
        skip,
        take: limit,
        include: {
          equipment: {
            select: {
              id: true,
              name: true,
              images: true
            }
          },
          renter: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
              companyName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.rental.count({ where })
    ]);

    return {
      data: rentals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // ===== REPORTS MANAGEMENT =====
  async getReports(filters: {
    page: number;
    limit: number;
    type?: string;
  }) {
    const { page, limit, type } = filters;
    const where: any = {};

    if (type) {
      where.reason = { contains: type, mode: 'insensitive' };
    }

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        include: {
          User_Report_reporterUserIdToUser: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          User_Report_reportedUserIdToUser: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.report.count({ where })
    ]);

    return {
      data: reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async resolveReport(reportId: string, resolution: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: resolution.toUpperCase() as any
      }
    });
  }

  // ===== REVENUE ANALYTICS =====
  async getRevenueAnalytics(filters: {
    period?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { period, startDate, endDate } = filters;
    let dateFilter: any = { deletedAt: null, status: 'COMPLETED' };

    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: startDate,
        lte: endDate
      };
    } else if (period) {
      const now = new Date();
      switch (period) {
        case 'today':
          dateFilter.createdAt = {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          };
          break;
        case 'week':
          dateFilter.createdAt = {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          };
          break;
        case 'month':
          dateFilter.createdAt = {
            gte: new Date(now.getFullYear(), now.getMonth(), 1)
          };
          break;
        case 'year':
          dateFilter.createdAt = {
            gte: new Date(now.getFullYear(), 0, 1)
          };
          break;
      }
    }

    const [totalRevenue, rentalCount, avgRentalValue] = await Promise.all([
      this.prisma.rental.aggregate({
        where: dateFilter,
        _sum: { totalAmount: true }
      }),
      this.prisma.rental.count({ where: dateFilter }),
      this.prisma.rental.aggregate({
        where: dateFilter,
        _avg: { totalAmount: true }
      })
    ]);

    // Dados por categoria
    const revenueByCategory = await this.prisma.rental.groupBy({
      by: ['equipmentId'],
      where: dateFilter,
      _sum: { totalAmount: true },
      _count: true
    });

    // Dados mensais para gráfico
    const monthlyData = await this.getMonthlyRevenueData(dateFilter);

    return {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      rentalCount,
      avgRentalValue: avgRentalValue._avg.totalAmount || 0,
      revenueByCategory,
      monthlyData
    };
  }

  private async getMonthlyRevenueData(baseFilter: any): Promise<Array<{month: string, revenue: number}>> {
    const months: Array<{month: string, revenue: number}> = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthFilter = {
        ...baseFilter,
        createdAt: {
          gte: date,
          lt: nextMonth
        }
      };

      const monthRevenue = await this.prisma.rental.aggregate({
        where: monthFilter,
        _sum: { totalAmount: true }
      });

      months.push({
        month: date.toISOString().slice(0, 7), // YYYY-MM format
        revenue: monthRevenue._sum.totalAmount || 0
      });
    }

    return months;
  }

  private async getPendingApprovalsCount(): Promise<number> {
    const [pendingUsers, pendingEquipment] = await Promise.all([
      this.prisma.user.count({
        where: {
          deletedAt: null,
          accountStatus: 'PENDING'
        }
      }),
      this.prisma.equipment.count({
        where: {
          deletedAt: null,
          moderationStatus: 'PENDING'
        }
      })
    ]);

    return pendingUsers + pendingEquipment;
  }

  // ===== REAL-TIME METRICS =====
  async getRealTimeMetrics() {
    const [
      onlineUsers,
      todayRegistrations,
      todayRentals,
      pendingApprovals,
      activeRentals,
      todayRevenue
    ] = await Promise.all([
      // Simulação de usuários online (pode ser implementado com WebSocket)
      Promise.resolve(Math.floor(Math.random() * 100) + 50),

      this.prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),

      this.prisma.rental.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),

      this.getPendingApprovalsCount(),

      this.prisma.rental.count({
        where: {
          deletedAt: null,
          status: 'ACTIVE'
        }
      }),

      this.prisma.rental.aggregate({
        where: {
          deletedAt: null,
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        },
        _sum: { totalAmount: true }
      })
    ]);

    return {
      onlineUsers,
      todayRegistrations,
      todayRentals,
      pendingApprovals,
      activeRentals,
      todayRevenue: todayRevenue._sum.totalAmount || 0,
      lastUpdated: new Date()
    };
  }

  // ===== DOCUMENT VALIDATION =====
  async getPendingBiValidation(adminId: string) {
    await this.ensureAdminOrModerator(adminId);

    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        biDocument: { not: null },
        biValidated: false,
        biRejectionReason: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        biDocument: true,
        createdAt: true,
        userType: true,
        companyName: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async validateBi(adminId: string, userId: string, approved: boolean, reason?: string) {
    await this.ensureAdminOrModerator(adminId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.biDocument) {
      throw new ForbiddenException('User has no BI document to validate');
    }

    const updateData: any = {
      biValidated: approved,
      biValidatedBy: adminId,
      biValidatedAt: new Date()
    };

    if (!approved && reason) {
      updateData.biRejectionReason = reason;
    } else {
      updateData.biRejectionReason = null;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData
    });
  }

  // ===== PAYMENT VALIDATION =====
  async getPendingPaymentReceipts() {
    return this.prisma.rental.findMany({
      where: {
        paymentReceiptStatus: 'PENDING',
        paymentReceipt: { not: null },
        deletedAt: null
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            images: true
          }
        },
        renter: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            companyName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async validatePaymentReceipt(rentalId: string, isApproved: boolean, moderatorId: string, rejectionReason?: string) {
    const rental = await this.prisma.rental.findUnique({
      where: { id: rentalId, deletedAt: null }
    });

    if (!rental) {
      throw new NotFoundException('Rental not found');
    }

    if (!rental.paymentReceipt) {
      throw new ForbiddenException('No payment receipt to validate');
    }

    const updateData: any = {
      paymentReceiptStatus: isApproved ? 'APPROVED' : 'REJECTED',
      moderatedBy: moderatorId,
      moderatedAt: new Date()
    };

    if (isApproved) {
      updateData.paymentStatus = 'PAID';
      updateData.status = 'APPROVED';
    } else if (rejectionReason) {
      // Adicionar campo para razão de rejeição se necessário
    }

    return this.prisma.rental.update({
      where: { id: rentalId },
      data: updateData,
      include: {
        equipment: true,
        renter: true,
        owner: true
      }
    });
  }

  // ===== EQUIPMENT AVAILABILITY MANAGEMENT =====
  async getAllEquipment(adminId: string, role: string) {
    await this.ensureAdminOrModerator(adminId);

    const equipment = await this.prisma.equipment.findMany({
      where: {
        deletedAt: null
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      success: true,
      data: equipment,
      total: equipment.length
    };
  }

  async toggleEquipmentAvailability(equipmentId: string, isAvailable: boolean, moderatorId: string) {
    await this.ensureAdminOrModerator(moderatorId);

    const equipment = await this.prisma.equipment.findUnique({
      where: { id: equipmentId, deletedAt: null },
      include: {
        owner: true
      }
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    const updatedEquipment = await this.prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        isAvailable: isAvailable,
        updatedAt: new Date()
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    // Notificar o proprietário sobre a mudança
    await this.notificationsService.createNotification({
      userId: equipment.ownerId,
      title: 'Disponibilidade Alterada',
      message: `A disponibilidade do seu equipamento "${equipment.name}" foi ${isAvailable ? 'ativada' : 'desativada'} por um moderador.`,
      type: 'INFO',
      data: JSON.stringify({ equipmentId, isAvailable, type: 'availability_change' })
    });

    return {
      success: true,
      message: `Disponibilidade ${isAvailable ? 'ativada' : 'desativada'} com sucesso`,
      data: updatedEquipment
    };
  }

  // ===== EQUIPMENT EDITS MANAGEMENT =====
  async getEquipmentEdits(adminId: string, role: string) {
    await this.ensureAdminOrModerator(adminId);

    const edits = await this.prisma.equipmentEdit.findMany({
      include: {
        equipment: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                email: true,
                companyName: true
              }
            }
          }
        },
        moderator: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      success: true,
      data: edits,
      total: edits.length
    };
  }

  async moderateEquipmentEdit(editId: string, isApproved: boolean, moderatorId: string, rejectionReason?: string) {
    await this.ensureAdminOrModerator(moderatorId);

    const edit = await this.prisma.equipmentEdit.findUnique({
      where: { id: editId },
      include: {
        equipment: {
          include: {
            owner: true
          }
        }
      }
    });

    if (!edit) {
      throw new NotFoundException('Equipment edit not found');
    }

    if (edit.status !== 'PENDING') {
      throw new BadRequestException('Edit has already been moderated');
    }

    // Atualizar o status da edição
    const updateData: any = {
      status: isApproved ? 'APPROVED' : 'REJECTED',
      moderatedBy: moderatorId,
      moderatedAt: new Date()
    };

    if (!isApproved && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const updatedEdit = await this.prisma.equipmentEdit.update({
      where: { id: editId },
      data: updateData,
      include: {
        equipment: {
          include: {
            owner: true
          }
        }
      }
    });

    // Se aprovado, aplicar as mudanças ao equipamento
    if (isApproved) {
      const equipmentUpdateData: any = {};

      if (edit.name) equipmentUpdateData.name = edit.name;
      if (edit.description) equipmentUpdateData.description = edit.description;
      if (edit.category) equipmentUpdateData.category = edit.category;
      if (edit.categoryId) equipmentUpdateData.categoryId = edit.categoryId;
      if (edit.price) equipmentUpdateData.price = edit.price;
      if (edit.pricePeriod) equipmentUpdateData.pricePeriod = edit.pricePeriod;
      if (edit.salePrice) equipmentUpdateData.salePrice = edit.salePrice;
      if (edit.images && edit.images.length > 0) equipmentUpdateData.images = edit.images;
      if (edit.videos && edit.videos.length > 0) equipmentUpdateData.videos = edit.videos;
      if (edit.documents && edit.documents.length > 0) equipmentUpdateData.documents = edit.documents;
      if (edit.specifications) equipmentUpdateData.specifications = edit.specifications;
      if (edit.isAvailable !== undefined) equipmentUpdateData.isAvailable = edit.isAvailable;
      if (edit.addressId) equipmentUpdateData.addressId = edit.addressId;

      if (Object.keys(equipmentUpdateData).length > 0) {
        equipmentUpdateData.updatedAt = new Date();

        await this.prisma.equipment.update({
          where: { id: edit.equipmentId },
          data: equipmentUpdateData
        });
      }
    }

    // Notificar o proprietário
    await this.notificationsService.createNotification({
      userId: edit.equipment.ownerId,
      title: isApproved ? 'Edição Aprovada' : 'Edição Rejeitada',
      message: isApproved
        ? `Suas alterações no equipamento "${edit.equipment.name}" foram aprovadas e aplicadas.`
        : `Suas alterações no equipamento "${edit.equipment.name}" foram rejeitadas. Motivo: ${rejectionReason}`,
      type: isApproved ? 'SUCCESS' : 'ERROR',
      data: JSON.stringify({ equipmentId: edit.equipmentId, editId, type: 'equipment_edit_moderation' })
    });

    return {
      success: true,
      message: `Edição ${isApproved ? 'aprovada' : 'rejeitada'} com sucesso`,
      data: updatedEdit
    };
  }

  // ===== SYSTEM CONFIGURATION =====
  async getSystemConfig(adminId: string) {
    await this.ensureAdmin(adminId);

    // Buscar configurações existentes ou retornar padrões
    const config = await this.prisma.systemConfig.findFirst();

    if (!config) {
      return this.getDefaultConfig();
    }

    return config;
  }

  async updateSystemConfig(adminId: string, configData: any) {
    await this.ensureAdmin(adminId);

    // Validações
    if (!configData.siteName || configData.siteName.trim().length === 0) {
      throw new BadRequestException('Nome do site é obrigatório');
    }

    if (!configData.contactEmail || !configData.supportEmail) {
      throw new BadRequestException('Emails de contato e suporte são obrigatórios');
    }

    if (configData.maxFileSize < 1 || configData.maxFileSize > 100) {
      throw new BadRequestException('Tamanho máximo de arquivo deve estar entre 1 e 100 MB');
    }

    if (configData.passwordMinLength < 4 || configData.passwordMinLength > 20) {
      throw new BadRequestException('Comprimento mínimo da senha deve estar entre 4 e 20 caracteres');
    }

    // Verificar se já existe configuração
    const existingConfig = await this.prisma.systemConfig.findFirst();

    if (existingConfig) {
      return this.prisma.systemConfig.update({
        where: { id: existingConfig.id },
        data: {
          ...configData,
          updatedAt: new Date(),
          updatedBy: adminId
        }
      });
    } else {
      return this.prisma.systemConfig.create({
        data: {
          ...configData,
          createdBy: adminId,
          updatedBy: adminId
        }
      });
    }
  }

  async resetSystemConfig(adminId: string) {
    await this.ensureAdmin(adminId);

    const defaultConfig = this.getDefaultConfig();
    const existingConfig = await this.prisma.systemConfig.findFirst();

    if (existingConfig) {
      return this.prisma.systemConfig.update({
        where: { id: existingConfig.id },
        data: {
          ...defaultConfig,
          updatedAt: new Date(),
          updatedBy: adminId
        }
      });
    } else {
      return this.prisma.systemConfig.create({
        data: {
          ...defaultConfig,
          createdBy: adminId,
          updatedBy: adminId
        }
      });
    }
  }

  private getDefaultConfig() {
    return {
      siteName: 'YM Rentals',
      siteDescription: 'Plataforma de aluguel de equipamentos em Angola',
      contactEmail: 'contato@ymrentals.com',
      supportEmail: 'suporte@ymrentals.com',
      maxFileSize: 10,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf'],
      emailNotifications: true,
      smsNotifications: false,
      maintenanceMode: false,
      registrationEnabled: true,
      autoApproveEquipment: false,
      autoApproveLandlords: false,
      maxEquipmentPerUser: 50,
      sessionTimeout: 24,
      passwordMinLength: 6,
      requireEmailVerification: true,
      requirePhoneVerification: false,
    };
  }
}
