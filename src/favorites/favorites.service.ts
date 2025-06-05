import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserFavorites(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        Equipment: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                profilePicture: true,
                isEmailVerified: true,
                isPhoneVerified: true,
              },
            },
            Address: true,
            reviews: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addToFavorites(userId: string, equipmentId: string) {
    try {
      // Verificar se o equipamento existe
      const equipment = await this.prisma.equipment.findUnique({
        where: { id: equipmentId, deletedAt: null },
      });

      if (!equipment) {
        throw new NotFoundException('Equipment not found');
      }

      // Verificar se já está nos favoritos
      const existingFavorite = await this.prisma.favorite.findUnique({
        where: {
          userId_equipmentId: {
            userId,
            equipmentId,
          },
        },
      });

      if (existingFavorite) {
        // Se já existe, retornar o favorito existente em vez de erro
        return this.prisma.favorite.findUnique({
          where: { id: existingFavorite.id },
          include: {
            Equipment: {
              include: {
                owner: {
                  select: {
                    id: true,
                    fullName: true,
                    profilePicture: true,
                  },
                },
              },
            },
          },
        });
      }

      // Criar novo favorito
      return this.prisma.favorite.create({
        data: {
          id: uuidv4(),
          userId,
          equipmentId,
        },
        include: {
          Equipment: {
            include: {
              owner: {
                select: {
                  id: true,
                  fullName: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      // Se for erro de constraint única (race condition), tentar buscar o favorito existente
      if (error.code === 'P2002') {
        const existingFavorite = await this.prisma.favorite.findUnique({
          where: {
            userId_equipmentId: {
              userId,
              equipmentId,
            },
          },
          include: {
            Equipment: {
              include: {
                owner: {
                  select: {
                    id: true,
                    fullName: true,
                    profilePicture: true,
                  },
                },
              },
            },
          },
        });

        if (existingFavorite) {
          return existingFavorite;
        }
      }

      throw error;
    }
  }

  async removeFromFavorites(userId: string, equipmentId: string) {
    try {
      const favorite = await this.prisma.favorite.findUnique({
        where: {
          userId_equipmentId: {
            userId,
            equipmentId,
          },
        },
      });

      if (!favorite) {
        // Se não existe, retornar sucesso silenciosamente (idempotente)
        return { success: true, message: 'Favorite already removed' };
      }

      await this.prisma.favorite.delete({
        where: { id: favorite.id },
      });

      return { success: true, message: 'Favorite removed successfully' };
    } catch (error) {
      // Se o favorito já foi deletado por outra requisição, retornar sucesso
      if (error.code === 'P2025') {
        return { success: true, message: 'Favorite already removed' };
      }

      throw error;
    }
  }

  async isFavorite(userId: string, equipmentId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_equipmentId: {
          userId,
          equipmentId,
        },
      },
    });

    return { isFavorite: !!favorite };
  }

  async toggleFavorite(userId: string, equipmentId: string) {
    try {
      // Verificar se o equipamento existe
      const equipment = await this.prisma.equipment.findUnique({
        where: { id: equipmentId, deletedAt: null },
      });

      if (!equipment) {
        throw new NotFoundException('Equipment not found');
      }

      // Verificar se já está nos favoritos
      const existingFavorite = await this.prisma.favorite.findUnique({
        where: {
          userId_equipmentId: {
            userId,
            equipmentId,
          },
        },
      });

      if (existingFavorite) {
        // Remover dos favoritos
        await this.prisma.favorite.delete({
          where: { id: existingFavorite.id },
        });

        return {
          action: 'removed',
          isFavorite: false,
          message: 'Removed from favorites'
        };
      } else {
        // Adicionar aos favoritos
        await this.prisma.favorite.create({
          data: {
            id: uuidv4(),
            userId,
            equipmentId,
          },
        });

        return {
          action: 'added',
          isFavorite: true,
          message: 'Added to favorites'
        };
      }
    } catch (error) {
      // Tratar race conditions
      if (error.code === 'P2002') {
        // Constraint única violada - favorito já existe
        return {
          action: 'already_exists',
          isFavorite: true,
          message: 'Already in favorites'
        };
      } else if (error.code === 'P2025') {
        // Registro não encontrado para deletar
        return {
          action: 'already_removed',
          isFavorite: false,
          message: 'Already removed from favorites'
        };
      }

      throw error;
    }
  }
}
