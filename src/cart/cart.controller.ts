import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../user/jwt-auth.guard';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get user cart' })
  async getUserCart(@Request() req) {
    return this.cartService.getUserCart(req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Add item to cart' })
  async addToCart(@Body() createCartDto: CreateCartDto, @Request() req) {
    return this.cartService.addToCart(req.user.userId, createCartDto);
  }

  @Patch(':equipmentId')
  @ApiOperation({ summary: 'Update cart item' })
  async updateCartItem(
    @Param('equipmentId') equipmentId: string,
    @Body() updateCartDto: UpdateCartDto,
    @Request() req
  ) {
    return this.cartService.updateCartItem(req.user.userId, equipmentId, updateCartDto);
  }

  @Delete(':equipmentId')
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeFromCart(@Param('equipmentId') equipmentId: string, @Request() req) {
    return this.cartService.removeFromCart(req.user.userId, equipmentId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear cart' })
  async clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.userId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get cart item count' })
  async getCartItemCount(@Request() req) {
    return this.cartService.getCartItemCount(req.user.userId);
  }

  @Post('migrate')
  @ApiOperation({ summary: 'Migrate offline cart to online' })
  async migrateCart(@Body() body: { cartItems: any[] }, @Request() req) {
    return this.cartService.migrateCart(req.user.userId, body.cartItems);
  }
}
