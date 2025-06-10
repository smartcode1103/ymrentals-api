import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
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
  async getLocationsByType(@Query('type') type: 'province' | 'city' | 'district') {
    return this.addressService.getLocationsByType(type);
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete address by ID' })
  async remove(@Param('id') id: string) {
    return this.addressService.remove(id);
  }
}
