import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  async login(@Body() body: { email: string; password: string }) {
    return this.userService.login(body.email, body.password);
  }

  @Post('logout')
  @ApiOperation({ summary: 'User logout' })
  async logout() {
    return this.userService.logout();
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async findAll() {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete user' })
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('restore/:id')
  @ApiOperation({ summary: 'Restore a deleted user' })
  async restore(@Param('id') id: string) {
    return this.userService.restore(id);
  }
}
