import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return this.prisma.user.create({
      data: { ...createUserDto, password: hashedPassword },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null }, // Apenas usuários ativos
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found or has been deleted');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    return this.prisma.user.update({
      where: { id: user.id },
      data: updateUserDto,
    });
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    return this.prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() }, // Soft delete
    });
  }

  async restore(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || !user.deletedAt) {
      throw new NotFoundException('User not found or is not deleted');
    }

    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: null }, // Restaura o usuário
    });
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    console.log('Usuário encontrado:', user);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    /*if (!user || password !== user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }*/
    // Comparando depois da descriptografia
    const ValidacaoSenha = await bcrypt.compare(password, user.password);

    console.log('Senha válida?', ValidacaoSenha); 
  
    if (!ValidacaoSenha) {
      throw new UnauthorizedException('Incorrect password');
    }

    const payload = { sub: user.id, email: user.email };
    
    //Verficar se os tokens de acesso estão a ser gerados
    const token = this.jwtService.sign(payload);
    console.log('Token de acesso:', token);
    
    return { accessToken: this.jwtService.sign(payload) };
  }

  async logout() {
    // Simulação de logout, idealmente gerenciamos uma blacklist de tokens
    return { message: 'User logged out successfully' };
  }
}
