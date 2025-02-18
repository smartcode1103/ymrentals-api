import { Controller, Get, Post, Delete, Patch, Param, Body } from '@nestjs/common';
import { RentalService } from './rental.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Rentals')
@Controller('rentals')
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new rental' })
  async create(@Body() createRentalDto: CreateRentalDto) {
    return this.rentalService.create(createRentalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all rentals' })
  async findAll() {
    return this.rentalService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a rental by ID' })
  async findOne(@Param('id') id: string) {
    return this.rentalService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update rental status' })
  async update(@Param('id') id: string, @Body() updateRentalDto: UpdateRentalDto) {
    return this.rentalService.update(id, updateRentalDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a rental' })
  async remove(@Param('id') id: string) {
    return this.rentalService.softDelete(id);
  }
}
