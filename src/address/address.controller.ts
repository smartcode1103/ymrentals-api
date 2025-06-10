import { Controller, Get, Post, Delete, Param, Body, Query, Put } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Address')
@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @ApiOperation({ summary: 'Create address' })
  async create(@Body() createAddressDto: CreateAddressDto) {
    return this.addressService.create(createAddressDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all addresses' })
  async findAll() {
    return this.addressService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get location statistics' })
  async getLocationStats() {
    return this.addressService.getLocationStats();
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get locations by type' })
  @ApiQuery({ name: 'type', enum: ['province', 'city', 'district'], required: true })
  @ApiQuery({ name: 'parentId', description: 'Parent location ID for hierarchical navigation', required: false })
  async getLocationsByType(
    @Query('type') type: 'province' | 'city' | 'district',
    @Query('parentId') parentId?: string
  ) {
    return this.addressService.getLocationsByType(type, parentId);
  }

  @Get('hierarchy/:parentId/children')
  @ApiOperation({ summary: 'Get child locations for hierarchical navigation' })
  @ApiQuery({ name: 'type', enum: ['city', 'district'], required: true })
  async getChildLocations(
    @Param('parentId') parentId: string,
    @Query('type') type: 'city' | 'district'
  ) {
    return this.addressService.getChildLocations(parentId, type);
  }

  @Get('hierarchy/:locationId/equipment')
  @ApiOperation({ summary: 'Get equipment in a specific location' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false })
  async getEquipmentByLocation(
    @Param('locationId') locationId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.addressService.getEquipmentByLocation(locationId, page, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search locations' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  async searchLocations(@Query('q') query: string) {
    return this.addressService.searchLocations(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get address by ID' })
  async findOne(@Param('id') id: string) {
    return this.addressService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update address by ID' })
  async update(@Param('id') id: string, @Body() updateAddressDto: CreateAddressDto) {
    return this.addressService.update(id, updateAddressDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete address by ID' })
  async remove(@Param('id') id: string) {
    return this.addressService.remove(id);
  }
}
