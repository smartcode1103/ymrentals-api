import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin-service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../user/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ===== DASHBOARD =====
  @Get('dashboard')
  @Roles('ADMIN', 'MODERATOR_MANAGER', 'MODERATOR')
  @ApiOperation({ summary: 'Get admin dashboard data' })
  async getDashboard(@Request() req) {
    return this.adminService.getDashboardData(req.user.userId, req.user.role);
  }

  @Get('stats')
  @Roles('ADMIN', 'MODERATOR_MANAGER', 'MODERATOR')
  @ApiOperation({ summary: 'Get system statistics' })
  async getStats(@Request() req) {
    return this.adminService.getStats(req.user.userId, req.user.role);
  }

  @Get('recent-activities')
  @Roles('ADMIN', 'MODERATOR_MANAGER', 'MODERATOR')
  @ApiOperation({ summary: 'Get recent system activities' })
  async getRecentActivities(@Request() req) {
    return this.adminService.getRecentActivities(req.user.userId);
  }

  // ===== USER MANAGEMENT =====
  @Get('users')
  @Roles('ADMIN', 'MODERATOR_MANAGER', 'MODERATOR')
  @ApiOperation({ summary: 'Get all users with pagination' })
  async getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('userType') userType?: string,
    @Request() req?
  ) {
    return this.adminService.getUsers(req.user.userId, req.user.role, {
      page: page || 1,
      limit: limit || 10,
      search,
      status,
      userType,
    });
  }

  @Get('users/:id')
  @Roles('ADMIN', 'MODERATOR_MANAGER', 'MODERATOR')
  @ApiOperation({ summary: 'Get user details' })
  async getUserDetails(@Param('id') userId: string, @Request() req) {
    return this.adminService.getUserDetails(req.user.userId, userId);
  }

  @Patch('users/:id')
  @Roles('ADMIN', 'MODERATOR_MANAGER')
  @ApiOperation({ summary: 'Update user' })
  async updateUser(@Param('id') userId: string, @Body() updateData: any, @Request() req) {
    return this.adminService.updateUser(req.user.userId, userId, updateData);
  }

  @Post('users/:id/block')
  @Roles('ADMIN', 'MODERATOR_MANAGER')
  @ApiOperation({ summary: 'Block/Unblock user' })
  async toggleUserBlock(@Param('id') userId: string, @Body() data: { blocked: boolean; reason?: string }, @Request() req) {
    return this.adminService.toggleUserBlock(req.user.userId, userId, data.blocked, data.reason);
  }

  @Delete('users/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  async deleteUser(@Param('id') userId: string, @Request() req) {
    return this.adminService.deleteUser(req.user.userId, userId);
  }

  // ===== LANDLORD VALIDATION =====
  @Get('pending-landlords')
  @Roles('ADMIN', 'MODERATOR_MANAGER')
  @ApiOperation({ summary: 'Get pending landlords for validation' })
  async getPendingLandlords(@Request() req) {
    return this.adminService.getPendingLandlords(req.user.userId);
  }

  @Post('validate-landlord/:id')
  @Roles('ADMIN', 'MODERATOR_MANAGER')
  @ApiOperation({ summary: 'Validate landlord registration' })
  async validateLandlord(
    @Param('id') landlordId: string,
    @Body() validationData: { approved: boolean; reason?: string },
    @Request() req
  ) {
    return this.adminService.validateLandlord(
      req.user.userId,
      landlordId,
      validationData.approved,
      validationData.reason
    );
  }

  // ===== MODERATOR MANAGEMENT =====
  @Get('moderators')
  @Roles('ADMIN', 'MODERATOR_MANAGER')
  @ApiOperation({ summary: 'Get all moderators' })
  async getModerators(@Request() req) {
    return this.adminService.getModerators(req.user.userId, req.user.role);
  }

  @Post('moderators')
  @Roles('ADMIN', 'MODERATOR_MANAGER')
  @ApiOperation({ summary: 'Create new moderator' })
  async createModerator(@Body() moderatorData: any, @Request() req) {
    return this.adminService.createModerator(req.user.userId, moderatorData);
  }

  @Patch('moderators/:id')
  @Roles('ADMIN', 'MODERATOR_MANAGER')
  @ApiOperation({ summary: 'Update moderator' })
  async updateModerator(@Param('id') moderatorId: string, @Body() updateData: any, @Request() req) {
    return this.adminService.updateModerator(req.user.userId, moderatorId, updateData);
  }

  @Delete('moderators/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete moderator (Admin only)' })
  async deleteModerator(@Param('id') moderatorId: string, @Request() req) {
    return this.adminService.deleteModerator(req.user.userId, moderatorId);
  }

  @Get('equipment')
  @Roles('ADMIN', 'MODERATOR_MANAGER', 'MODERATOR')
  @ApiOperation({ summary: 'Get all equipment with pagination' })
  async getEquipment(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Request() req?
  ) {
    return this.adminService.getEquipment({
      page: page || 1,
      limit: limit || 10,
      search,
      status,
    });
  }

  @Patch('equipment/:id/status')
  @Roles('ADMIN', 'MODERATOR_MANAGER', 'MODERATOR')
  @ApiOperation({ summary: 'Update equipment status' })
  async updateEquipmentStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('reason') reason?: string,
    @Request() req?
  ) {
    return this.adminService.updateEquipmentStatus(id, status, reason);
  }

  @Get('rentals')
  @Roles('ADMIN', 'MODERATOR_MANAGER', 'MODERATOR')
  @ApiOperation({ summary: 'Get all rentals with pagination' })
  async getRentals(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Request() req?
  ) {
    return this.adminService.getRentals({
      page: page || 1,
      limit: limit || 10,
      status,
    });
  }

  @Get('reports')
  @Roles('ADMIN', 'MODERATOR_MANAGER', 'MODERATOR')
  @ApiOperation({ summary: 'Get reports' })
  async getReports(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Request() req?
  ) {
    return this.adminService.getReports({
      page: page || 1,
      limit: limit || 10,
      type,
    });
  }

  @Patch('reports/:id/resolve')
  @Roles('ADMIN', 'MODERATOR_MANAGER', 'MODERATOR')
  @ApiOperation({ summary: 'Resolve report' })
  async resolveReport(
    @Param('id') id: string,
    @Body('resolution') resolution: string,
    @Request() req?
  ) {
    return this.adminService.resolveReport(id, resolution);
  }

  @Get('revenue')
  @Roles('ADMIN', 'MODERATOR_MANAGER')
  @ApiOperation({ summary: 'Get revenue analytics' })
  async getRevenue(
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?
  ) {
    return this.adminService.getRevenueAnalytics({
      period,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('metrics/real-time')
  @Roles('ADMIN', 'MODERATOR_MANAGER', 'MODERATOR')
  @ApiOperation({ summary: 'Get real-time metrics' })
  async getRealTimeMetrics(@Request() req) {
    return this.adminService.getRealTimeMetrics();
  }

  // ===== DOCUMENT VALIDATION =====
  @Get('pending-bi-validation')
  @Roles('ADMIN', 'MODERATOR_MANAGER', 'MODERATOR')
  @ApiOperation({ summary: 'Get users with pending BI validation' })
  async getPendingBiValidation(@Request() req) {
    return this.adminService.getPendingBiValidation(req.user.userId);
  }

  @Patch('users/:id/validate-bi')
  @Roles('ADMIN', 'MODERATOR_MANAGER', 'MODERATOR')
  @ApiOperation({ summary: 'Validate user BI document' })
  async validateBi(
    @Param('id') userId: string,
    @Body() body: { approved: boolean; reason?: string },
    @Request() req
  ) {
    return this.adminService.validateBi(req.user.userId, userId, body.approved, body.reason);
  }

  // ===== PAYMENT VALIDATION =====
  @Get('pending-payment-receipts')
  @Roles('ADMIN', 'MODERATOR_MANAGER', 'MODERATOR')
  @ApiOperation({ summary: 'Get pending payment receipts' })
  async getPendingPaymentReceipts(@Request() req) {
    return this.adminService.getPendingPaymentReceipts();
  }

  @Patch('rentals/:id/validate-payment')
  @Roles('ADMIN', 'MODERATOR_MANAGER', 'MODERATOR')
  @ApiOperation({ summary: 'Validate payment receipt' })
  async validatePaymentReceipt(
    @Param('id') rentalId: string,
    @Body() body: { isApproved: boolean; rejectionReason?: string },
    @Request() req
  ) {
    return this.adminService.validatePaymentReceipt(rentalId, body.isApproved, req.user.userId, body.rejectionReason);
  }
}
