import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.login(loginUserDto.email, loginUserDto.password);
  }

  @Post('logout')
  @ApiOperation({ summary: 'User logout' })
  async logout() {
    return this.userService.logout();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  async findAll(@Request() req) {
    return this.userService.findAll(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete user' })
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('restore/:id')
  @ApiOperation({ summary: 'Restore a deleted user' })
  async restore(@Param('id') id: string) {
    return this.userService.restore(id);
  }

  // 🔹 ADMIN-ONLY ENDPOINTS

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('admin/:id/permanent')
  @ApiOperation({ summary: 'Permanently delete a user (Admin only)' })
  async deletePermanently(@Request() req, @Param('id') userId: string) {
    return this.userService.deletePermanently(req.user.id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('admin/:id/block')
  @ApiOperation({ summary: 'Block a user (Admin only)' })
  async blockUser(@Request() req, @Param('id') userId: string) {
    return this.userService.blockUser(req.user.id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('admin/:id/unblock')
  @ApiOperation({ summary: 'Unblock a user (Admin only)' })
  async unblockUser(@Request() req, @Param('id') userId: string) {
    return this.userService.unblockUser(req.user.id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('admin/blocked')
  @ApiOperation({ summary: 'Get blocked users (Admin only)' })
  async getBlockedUsers(@Request() req) {
    return this.userService.getBlockedUsers(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('admin/:id/report')
  @ApiOperation({ summary: 'Report a user (Admin only)' })
  async reportUser(@Request() req, @Param('id') reportedUserId: string, @Body() reportData: { reason: string; details: string; evidence: string[] }) {
    return this.userService.reportUser(reportedUserId, req.user.id, reportData);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('admin/:id/role')
  @ApiOperation({ summary: 'Change user role (Admin only)' })
  async changeUserRole(@Request() req, @Param('id') userId: string, @Body() body) {
    return this.userService.changeUserRole(req.user.id, userId, body.newRole);
  }
}
