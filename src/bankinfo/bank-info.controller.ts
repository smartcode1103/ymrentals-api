import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { BankInfoService } from './bank-info.service';
import { CreateBankInfoDto } from './dto/create-bank-info.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Bank Info')
@Controller('bank-info')
export class BankInfoController {
  constructor(private readonly bankInfoService: BankInfoService) {}

  @Post()
  @ApiOperation({ summary: 'Create bank info' })
  async create(@Body() createBankInfoDto: CreateBankInfoDto) {
    return this.bankInfoService.create(createBankInfoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bank info records' })
  async findAll() {
    return this.bankInfoService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get bank info by user ID' })
  async findByUserId(@Param('userId') userId: string) {
    return this.bankInfoService.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bank info by ID' })
  async findOne(@Param('id') id: string) {
    return this.bankInfoService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete bank info by ID' })
  async remove(@Param('id') id: string) {
    return this.bankInfoService.remove(id);
  }
}
