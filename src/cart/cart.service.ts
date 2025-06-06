import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserCart(userId: string) {
    return this.prisma.cart.findMany({
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

  async addToCart(userId: string, createCartDto: CreateCartDto) {
    try {
      // Verificar se o equipamento existe
      const equipment = await this.prisma.equipment.findUnique({
        where: { id: createCartDto.equipmentId, deletedAt: null },
      });

      if (!equipment) {
        throw new NotFoundException('Equipment not found');
      }

      // Verificar se já está no carrinho
      const existingCartItem = await this.prisma.cart.findUnique({
        where: {
          userId_equipmentId: {
            userId,
            equipmentId: createCartDto.equipmentId,
          },
        },
      });

      if (existingCartItem) {
        // Se já existe, atualizar quantidade
        return this.prisma.cart.update({
          where: { id: existingCartItem.id },
          data: {
            quantity: existingCartItem.quantity + (createCartDto.quantity || 1),
            startDate: createCartDto.startDate && createCartDto.startDate.trim() ? new Date(createCartDto.startDate) : existingCartItem.startDate,
            endDate: createCartDto.endDate && createCartDto.endDate.trim() ? new Date(createCartDto.endDate) : existingCartItem.endDate,
            period: createCartDto.period || existingCartItem.period,
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
      }

      // Criar novo item no carrinho
      return this.prisma.cart.create({
        data: {
          id: uuidv4(),
          userId,
          equipmentId: createCartDto.equipmentId,
          quantity: createCartDto.quantity || 1,
          startDate: createCartDto.startDate && createCartDto.startDate.trim() ? new Date(createCartDto.startDate) : null,
          endDate: createCartDto.endDate && createCartDto.endDate.trim() ? new Date(createCartDto.endDate) : null,
          period: createCartDto.period,
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
      // Se for erro de constraint única (race condition), tentar buscar o item existente
      if (error.code === 'P2002') {
        const existingCartItem = await this.prisma.cart.findUnique({
          where: {
            userId_equipmentId: {
              userId,
              equipmentId: createCartDto.equipmentId,
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

        if (existingCartItem) {
          return existingCartItem;
        }
      }

      throw error;
    }
  }

  async updateCartItem(userId: string, equipmentId: string, updateCartDto: UpdateCartDto) {
    const cartItem = await this.prisma.cart.findUnique({
      where: {
        userId_equipmentId: {
          userId,
          equipmentId,
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cart.update({
      where: { id: cartItem.id },
      data: {
        quantity: updateCartDto.quantity,
        startDate: updateCartDto.startDate && updateCartDto.startDate.trim() ? new Date(updateCartDto.startDate) : undefined,
        endDate: updateCartDto.endDate && updateCartDto.endDate.trim() ? new Date(updateCartDto.endDate) : undefined,
        period: updateCartDto.period,
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
  }

  async removeFromCart(userId: string, equipmentId: string) {
    const cartItem = await this.prisma.cart.findUnique({
      where: {
        userId_equipmentId: {
          userId,
          equipmentId,
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cart.delete({
      where: { id: cartItem.id },
    });

    return { message: 'Item removed from cart' };
  }

  async clearCart(userId: string) {
    await this.prisma.cart.deleteMany({
      where: { userId },
    });

    return { message: 'Cart cleared' };
  }

  async getCartItemCount(userId: string) {
    const count = await this.prisma.cart.count({
      where: { userId },
    });

    return { count };
  }

  // Migração de carrinho offline para online
  async migrateCart(userId: string, cartItems: any[]) {
    const results: any[] = [];

    for (const item of cartItems) {
      try {
        const result = await this.addToCart(userId, {
          equipmentId: item.id,
          quantity: item.quantity || 1,
          startDate: item.startDate,
          endDate: item.endDate,
          period: item.period,
        });
        results.push({ equipmentId: item.id, success: true, result });
      } catch (error) {
        console.log(`Erro ao migrar item do carrinho ${item.id}:`, error);
        results.push({ equipmentId: item.id, success: false, error });
      }
    }

    return results;
  }
}
