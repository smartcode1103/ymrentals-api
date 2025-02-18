import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

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

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get addresses by user ID' })
  async findByUserId(@Param('userId') userId: string) {
    return this.addressService.findByUserId(userId);
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
