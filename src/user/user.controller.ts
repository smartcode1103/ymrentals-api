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
  Req,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

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

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req) {
    return this.userService.findOne(req.user.userId);
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
  @Post('change-password')
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(@Request() req, @Body() body: { currentPassword: string; newPassword: string }) {
    return this.userService.changePassword(req.user.userId, body.currentPassword, body.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/verify-email')
  @ApiOperation({ summary: 'Send email verification' })
  async sendEmailVerification(@Param('id') id: string) {
    return this.userService.sendEmailVerification(id);
  }

  @Post('verify-email/:token')
  @ApiOperation({ summary: 'Verify email with token' })
  async verifyEmail(@Param('token') token: string) {
    return this.userService.verifyEmail(token);
  }

  // Google OAuth endpoints
  @Get('auth/google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth(@Req() req) {
    // Guard redirects to Google
  }

  @Get('auth/google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const result = await this.userService.googleLogin(req.user);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth/google/success?token=${result.accessToken}&user=${encodeURIComponent(JSON.stringify(result.user))}`;

    return res.redirect(redirectUrl);
  }

  // Endpoints para moderadores validarem BI
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('pending-bi-validation')
  @ApiOperation({ summary: 'Get users with pending BI validation (Moderator only)' })
  async getPendingBiValidation(@Request() req) {
    return this.userService.getPendingBiValidation(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/validate-bi')
  @ApiOperation({ summary: 'Validate user BI document (Moderator only)' })
  async validateBi(
    @Param('id') userId: string,
    @Body() body: { approved: boolean; reason?: string },
    @Request() req
  ) {
    return this.userService.validateBi(req.user.userId, userId, body.approved, body.reason);
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

  // Endpoints para moderadores
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('moderators')
  @ApiOperation({ summary: 'Create a new moderator (Admin/Manager only)' })
  async createModerator(@Body() moderatorData: any, @Request() req) {
    return this.userService.createModerator(req.user.userId, moderatorData);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('moderators')
  @ApiOperation({ summary: 'Get all moderators (Admin/Manager only)' })
  async getModerators(@Request() req) {
    return this.userService.getModerators(req.user.userId);
  }

  // Endpoints para validação de landlords
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('landlords/pending')
  @ApiOperation({ summary: 'Get pending landlords for validation (Admin/Manager only)' })
  async getPendingLandlords(@Request() req) {
    return this.userService.getPendingLandlords(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('landlords/:id/validate')
  @ApiOperation({ summary: 'Validate landlord registration (Admin/Manager only)' })
  async validateLandlord(
    @Param('id') landlordId: string,
    @Body() body: { approved: boolean; reason?: string },
    @Request() req
  ) {
    return this.userService.validateLandlord(req.user.userId, landlordId, body.approved, body.reason);
  }


}
