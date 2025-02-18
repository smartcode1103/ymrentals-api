import { Controller, Get, Post, Delete, Patch, Param, Body } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Equipment')
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create new equipment' })
  async create(@Body() createEquipmentDto: CreateEquipmentDto) {
    return this.equipmentService.create(createEquipmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all available equipment' })
  async findAll() {
    return this.equipmentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get equipment by ID' })
  async findOne(@Param('id') id: string) {
    return this.equipmentService.findOne(id);
  }

  @Patch(':id/availability')
  @ApiOperation({ summary: 'Update equipment availability' })
  async updateAvailability(@Param('id') id: string, @Body('isAvailable') isAvailable: boolean) {
    return this.equipmentService.updateAvailability(id, isAvailable);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete equipment' })
  async remove(@Param('id') id: string) {
    return this.equipmentService.softDelete(id);
  }
}
