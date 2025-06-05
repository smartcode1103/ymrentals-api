import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getPlatformStats() {
    const [
      equipmentCount,
      supplierCount,
      cityCount,
      categoryCount,
      activeRentals
    ] = await Promise.all([
      // Contar equipamentos aprovados e disponíveis
      this.prisma.equipment.count({
        where: {
          moderationStatus: 'APPROVED',
          deletedAt: null,
          isAvailable: true
        }
      }),
      
      // Contar fornecedores (usuários com equipamentos)
      this.prisma.user.count({
        where: {
          deletedAt: null,
          userType: 'LANDLORD'
        }
      }),
      
      // Contar cidades únicas baseadas nos endereços dos equipamentos
      this.prisma.address.findMany({
        where: {
          Equipment: {
            some: {
              moderationStatus: 'APPROVED',
              deletedAt: null
            }
          }
        },
        select: {
          city: true
        },
        distinct: ['city']
      }).then(addresses => addresses.length),
      
      // Contar categorias ativas
      this.prisma.category.count({
        where: {
          isActive: true
        }
      }),
      
      // Contar aluguéis ativos
      this.prisma.rental.count({
        where: {
          status: 'ACTIVE',
          deletedAt: null
        }
      })
    ]);

    return {
      equipment: equipmentCount,
      suppliers: supplierCount,
      cities: cityCount || 12, // Fallback para valor padrão
      categories: categoryCount,
      activeRentals
    };
  }
}
