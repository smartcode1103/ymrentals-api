import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../user/jwt-auth.guard';
import { EquipmentEditService } from './equipment-edit.service';
import { CreateEquipmentEditDto } from './dto/create-equipment-edit.dto';
import { ApproveEditDto } from './dto/approve-edit.dto';
import { RejectEditDto } from './dto/reject-edit.dto';

@Controller('equipment-edits')
@UseGuards(JwtAuthGuard)
export class EquipmentEditController {
  constructor(private readonly equipmentEditService: EquipmentEditService) {}

  @Post('equipment/:equipmentId/edit')
  async createEquipmentEdit(
    @Param('equipmentId') equipmentId: string,
    @Body() createDto: CreateEquipmentEditDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const result = await this.equipmentEditService.createEquipmentEdit(
      equipmentId,
      userId,
      createDto,
    );
    
    return {
      message: 'Solicitação de edição criada com sucesso',
      edit: result,
    };
  }

  @Get('pending')
  async getPendingEdits(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status: string = 'PENDING',
  ) {
    return this.equipmentEditService.getPendingEdits(
      parseInt(page),
      parseInt(limit),
      status,
    );
  }

  @Get('my-edits')
  async getUserEdits(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status: string | undefined,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.equipmentEditService.getUserEdits(
      userId,
      parseInt(page),
      parseInt(limit),
      status,
    );
  }

  @Get(':editId')
  async getEditById(
    @Param('editId') editId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.equipmentEditService.getEditById(editId, userId, userRole);
  }

  @Put(':editId/approve')
  async approveEdit(
    @Param('editId') editId: string,
    @Body() approveDto: ApproveEditDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const result = await this.equipmentEditService.approveEdit(
      editId,
      userId,
      userRole,
    );
    
    return {
      message: 'Edição aprovada e aplicada com sucesso',
      edit: result.updatedEdit,
      equipment: result.updatedEquipment,
    };
  }

  @Put(':editId/reject')
  async rejectEdit(
    @Param('editId') editId: string,
    @Body() rejectDto: RejectEditDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const result = await this.equipmentEditService.rejectEdit(
      editId,
      userId,
      userRole,
      rejectDto,
    );
    
    return {
      message: 'Edição rejeitada com sucesso',
      edit: result,
    };
  }
}
