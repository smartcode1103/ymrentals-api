import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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
    return this.getDashboardStats(adminId);
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

  async getStats(adminId: string, role: string) {
    await this.ensureAdminOrModerator(adminId);

    const [
      userStats,
      equipmentStats,
      rentalStats,
      revenueStats
    ] = await Promise.all([
      this.getUserStats(),
      this.getEquipmentStats(),
      this.getRentalStats(),
      this.getRevenueStats()
    ]);

    return {
      users: userStats,
      equipment: equipmentStats,
      rentals: rentalStats,
      revenue: revenueStats
    };
  }

  private async getUserStats() {
    const [total, tenants, landlords, pending, approved, rejected] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, userType: 'TENANT' } }),
      this.prisma.user.count({ where: { deletedAt: null, userType: 'LANDLORD' } }),
      this.prisma.user.count({ where: { deletedAt: null, accountStatus: 'PENDING' } }),
      this.prisma.user.count({ where: { deletedAt: null, accountStatus: 'APPROVED' } }),
      this.prisma.user.count({ where: { deletedAt: null, accountStatus: 'REJECTED' } })
    ]);

    return { total, tenants, landlords, pending, approved, rejected };
  }

  private async getEquipmentStats() {
    const [total, pending, approved, rejected, available] = await Promise.all([
      this.prisma.equipment.count({ where: { deletedAt: null } }),
      this.prisma.equipment.count({ where: { deletedAt: null, moderationStatus: 'PENDING' } }),
      this.prisma.equipment.count({ where: { deletedAt: null, moderationStatus: 'APPROVED' } }),
      this.prisma.equipment.count({ where: { deletedAt: null, moderationStatus: 'REJECTED' } }),
      this.prisma.equipment.count({ where: { deletedAt: null, isAvailable: true } })
    ]);

    return { total, pending, approved, rejected, available };
  }

  private async getRentalStats() {
    const [total, pending, active, completed, cancelled] = await Promise.all([
      this.prisma.rental.count({ where: { deletedAt: null } }),
      this.prisma.rental.count({ where: { deletedAt: null, status: 'PENDING' } }),
      this.prisma.rental.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.rental.count({ where: { deletedAt: null, status: 'COMPLETED' } }),
      this.prisma.rental.count({ where: { deletedAt: null, status: 'CANCELLED' } })
    ]);

    return { total, pending, active, completed, cancelled };
  }

  private async getRevenueStats() {
    const [totalRevenue, monthlyRevenue, weeklyRevenue] = await Promise.all([
      this.prisma.rental.aggregate({
        where: { status: 'COMPLETED', deletedAt: null },
        _sum: { totalAmount: true }
      }),
      this.prisma.rental.aggregate({
        where: {
          status: 'COMPLETED',
          deletedAt: null,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { totalAmount: true }
      }),
      this.prisma.rental.aggregate({
        where: {
          status: 'COMPLETED',
          deletedAt: null,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        _sum: { totalAmount: true }
      })
    ]);

    return {
      total: totalRevenue._sum.totalAmount || 0,
      monthly: monthlyRevenue._sum.totalAmount || 0,
      weekly: weeklyRevenue._sum.totalAmount || 0
    };
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
  }) {
    const { page, limit, status } = filters;
    const where: any = { deletedAt: null };

    if (status) {
      where.status = status.toUpperCase();
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
}
