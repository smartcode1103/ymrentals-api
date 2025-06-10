import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAddressDto: CreateAddressDto) {
    // Validações aprimoradas para dados de endereço
    if (!createAddressDto.province || !createAddressDto.city) {
      throw new Error('Província e cidade são obrigatórias');
    }

    // Validar coordenadas se fornecidas
    if (createAddressDto.latitude !== undefined && createAddressDto.longitude !== undefined) {
      if (createAddressDto.latitude === 0 || createAddressDto.longitude === 0) {
        throw new Error('Coordenadas inválidas (0,0) não são permitidas');
      }

      // Validar se as coordenadas estão dentro de Angola (aproximadamente)
      if (createAddressDto.latitude < -18.5 || createAddressDto.latitude > -4.5 ||
          createAddressDto.longitude < 11.5 || createAddressDto.longitude > 24.5) {
        throw new Error('Coordenadas devem estar dentro de Angola');
      }
    }

    console.log('📍 Criando endereço:', {
      province: createAddressDto.province,
      city: createAddressDto.city,
      district: createAddressDto.district,
      hasCoordinates: !!(createAddressDto.latitude && createAddressDto.longitude)
    });

    try {
      const address = await this.prisma.address.create({ data: createAddressDto });
      console.log('✅ Endereço criado com sucesso:', address.id);
      return address;
    } catch (error) {
      console.error('❌ Erro ao criar endereço:', error);
      throw new Error('Erro ao salvar endereço na base de dados');
    }
  }

  async findAll() {
    return this.prisma.address.findMany();
  }

  async findOne(id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  async update(id: string, updateAddressDto: CreateAddressDto) {
    // Verificar se o endereço existe
    await this.findOne(id);

    // Aplicar as mesmas validações do create
    if (!updateAddressDto.province || !updateAddressDto.city) {
      throw new Error('Província e cidade são obrigatórias');
    }

    // Validar coordenadas se fornecidas
    if (updateAddressDto.latitude !== undefined && updateAddressDto.longitude !== undefined) {
      if (updateAddressDto.latitude === 0 || updateAddressDto.longitude === 0) {
        throw new Error('Coordenadas inválidas (0,0) não são permitidas');
      }

      // Validar se as coordenadas estão dentro de Angola (aproximadamente)
      if (updateAddressDto.latitude < -18.5 || updateAddressDto.latitude > -4.5 ||
          updateAddressDto.longitude < 11.5 || updateAddressDto.longitude > 24.5) {
        throw new Error('Coordenadas devem estar dentro de Angola');
      }
    }

    console.log('📍 Atualizando endereço:', {
      id,
      province: updateAddressDto.province,
      city: updateAddressDto.city,
      district: updateAddressDto.district,
      hasCoordinates: !!(updateAddressDto.latitude && updateAddressDto.longitude)
    });

    try {
      const updatedAddress = await this.prisma.address.update({
        where: { id },
        data: updateAddressDto
      });
      console.log('✅ Endereço atualizado com sucesso:', updatedAddress.id);
      return updatedAddress;
    } catch (error) {
      console.error('❌ Erro ao atualizar endereço:', error);
      throw new Error('Erro ao atualizar endereço na base de dados');
    }
  }

  async remove(id: string) {
    const address = await this.findOne(id);
    return this.prisma.address.delete({ where: { id: address.id } });
  }

  // Novos métodos para localizações
  async getLocationStats() {
    // Buscar províncias únicas
    const provinces = await this.prisma.address.findMany({
      where: {
        province: { not: null },
        Equipment: { some: { moderationStatus: 'APPROVED', deletedAt: null } }
      },
      select: { province: true },
      distinct: ['province']
    });

    // Buscar cidades únicas
    const cities = await this.prisma.address.findMany({
      where: {
        city: { not: null },
        Equipment: { some: { moderationStatus: 'APPROVED', deletedAt: null } }
      },
      select: { city: true },
      distinct: ['city']
    });

    // Buscar distritos únicos
    const districts = await this.prisma.address.findMany({
      where: {
        district: { not: null },
        Equipment: { some: { moderationStatus: 'APPROVED', deletedAt: null } }
      },
      select: { district: true },
      distinct: ['district']
    });

    const totalEquipment = await this.prisma.equipment.count({
      where: { moderationStatus: 'APPROVED', deletedAt: null }
    });

    return {
      provinces: provinces.length,
      cities: cities.length,
      districts: districts.length,
      totalEquipment
    };
  }

  async getLocationsByType(type: 'province' | 'city' | 'district', parentId?: string) {
    const results: any[] = [];

    if (type === 'province') {
      const provinces = await this.prisma.address.findMany({
        where: {
          province: { not: null },
          latitude: { not: null },
          longitude: { not: null },
          Equipment: { some: { moderationStatus: 'APPROVED', deletedAt: null } }
        },
        select: {
          province: true,
          latitude: true,
          longitude: true
        },
        distinct: ['province']
      });

      for (const address of provinces) {
        const equipmentCount = await this.prisma.equipment.count({
          where: {
            moderationStatus: 'APPROVED',
            deletedAt: null,
            Address: { province: address.province }
          }
        });

        results.push({
          id: `province-${address.province?.toLowerCase().replace(/\s+/g, '-')}`,
          name: address.province,
          type: 'province',
          latitude: address.latitude,
          longitude: address.longitude,
          equipmentCount,
          hasChildren: true
        });
      }
    } else if (type === 'city') {
      let whereClause: any = {
        city: { not: null },
        latitude: { not: null },
        longitude: { not: null },
        Equipment: { some: { moderationStatus: 'APPROVED', deletedAt: null } }
      };

      // Se parentId for fornecido, filtrar por província
      if (parentId) {
        const provinceName = parentId.replace('province-', '').replace(/-/g, ' ');
        whereClause.province = {
          equals: provinceName,
          mode: 'insensitive'
        };
      }

      const cities = await this.prisma.address.findMany({
        where: whereClause,
        select: {
          city: true,
          province: true,
          latitude: true,
          longitude: true
        },
        distinct: ['city']
      });

      for (const address of cities) {
        const equipmentCount = await this.prisma.equipment.count({
          where: {
            moderationStatus: 'APPROVED',
            deletedAt: null,
            Address: {
              city: address.city,
              ...(parentId && { province: address.province })
            }
          }
        });

        results.push({
          id: `city-${address.city?.toLowerCase().replace(/\s+/g, '-')}`,
          name: address.city,
          type: 'city',
          latitude: address.latitude,
          longitude: address.longitude,
          equipmentCount,
          parentId: parentId || `province-${address.province?.toLowerCase().replace(/\s+/g, '-')}`,
          hasChildren: true
        });
      }
    } else if (type === 'district') {
      let whereClause: any = {
        district: { not: null },
        city: { not: null },
        latitude: { not: null },
        longitude: { not: null },
        Equipment: { some: { moderationStatus: 'APPROVED', deletedAt: null } }
      };

      // Se parentId for fornecido, filtrar por cidade
      if (parentId) {
        const cityName = parentId.replace('city-', '').replace(/-/g, ' ');
        whereClause.city = {
          equals: cityName,
          mode: 'insensitive'
        };
      }

      const districts = await this.prisma.address.findMany({
        where: whereClause,
        select: {
          district: true,
          city: true,
          province: true,
          latitude: true,
          longitude: true
        },
        distinct: ['district', 'city'] // Incluir city no distinct para evitar duplicatas
      });

      for (const address of districts) {
        // Validar se os dados essenciais estão presentes
        if (!address.district || !address.city || !address.latitude || !address.longitude) {
          console.warn('Distrito com dados incompletos ignorado:', {
            district: address.district,
            city: address.city,
            latitude: address.latitude,
            longitude: address.longitude
          });
          continue;
        }

        const equipmentCount = await this.prisma.equipment.count({
          where: {
            moderationStatus: 'APPROVED',
            deletedAt: null,
            Address: {
              district: address.district,
              city: address.city // Sempre incluir a cidade na contagem
            }
          }
        });

        // Sempre criar ID único que inclui a cidade para evitar conflitos
        const districtId = `district-${address.district.toLowerCase().replace(/\s+/g, '-')}-${address.city.toLowerCase().replace(/\s+/g, '-')}`;

        results.push({
          id: districtId,
          name: address.district,
          type: 'district',
          latitude: address.latitude,
          longitude: address.longitude,
          equipmentCount,
          parentId: parentId || `city-${address.city.toLowerCase().replace(/\s+/g, '-')}`,
          hasChildren: false
        });
      }
    }

    return results.filter(loc => loc.latitude !== 0 && loc.longitude !== 0);
  }

  async getChildLocations(parentId: string, type: 'city' | 'district') {
    if (type === 'city') {
      // Buscar cidades de uma província específica
      return this.getLocationsByType('city', parentId);
    } else if (type === 'district') {
      // Buscar distritos de uma cidade específica
      return this.getLocationsByType('district', parentId);
    }
    return [];
  }

  async getEquipmentByLocation(locationId: string, page: number = 1, limit: number = 10) {
    const parts = locationId.split('-');
    const locationType = parts[0];

    let whereClause: any = {
      moderationStatus: 'APPROVED',
      deletedAt: null,
      Address: {}
    };

    // Definir filtro baseado no tipo de localização
    switch (locationType) {
      case 'province':
        const provinceName = parts.slice(1).join(' ').replace(/-/g, ' ');
        whereClause.Address.province = {
          equals: provinceName,
          mode: 'insensitive'
        };
        break;
      case 'city':
        const cityName = parts.slice(1).join(' ').replace(/-/g, ' ');
        whereClause.Address.city = {
          equals: cityName,
          mode: 'insensitive'
        };
        break;
      case 'district':
        // Para distritos, o ID sempre tem formato: district-nome-distrito-nome-cidade
        if (parts.length >= 3) {
          const districtName = parts[1].replace(/-/g, ' ');
          const cityName = parts.slice(2).join(' ').replace(/-/g, ' ');
          whereClause.Address.district = {
            equals: districtName,
            mode: 'insensitive'
          };
          whereClause.Address.city = {
            equals: cityName,
            mode: 'insensitive'
          };
        } else {
          // Formato antigo para compatibilidade: district-nome-distrito
          const districtName = parts.slice(1).join(' ').replace(/-/g, ' ');
          whereClause.Address.district = {
            equals: districtName,
            mode: 'insensitive'
          };
          console.warn(`ID de distrito no formato antigo: ${locationId}. Considere usar o formato district-nome-distrito-nome-cidade`);
        }
        break;
      default:
        throw new Error('Tipo de localização inválido');
    }

    const skip = (page - 1) * limit;

    const [equipment, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where: whereClause,
        include: {
          Category: true,
          Address: true,
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profilePicture: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.equipment.count({ where: whereClause })
    ]);

    // Determinar o nome da localização baseado no tipo
    let locationName = '';
    switch (locationType) {
      case 'province':
        locationName = parts.slice(1).join(' ').replace(/-/g, ' ');
        break;
      case 'city':
        locationName = parts.slice(1).join(' ').replace(/-/g, ' ');
        break;
      case 'district':
        locationName = parts[1].replace(/-/g, ' ');
        break;
    }

    return {
      data: equipment,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      location: {
        id: locationId,
        type: locationType,
        name: locationName
      }
    };
  }

  async searchLocations(query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim();
    const results: any[] = [];
    const seen = new Set();

    // Buscar províncias
    const provinces = await this.prisma.address.findMany({
      where: {
        province: {
          contains: searchTerm,
          mode: 'insensitive'
        },
        latitude: { not: null },
        longitude: { not: null },
        Equipment: { some: { moderationStatus: 'APPROVED', deletedAt: null } }
      },
      select: {
        province: true,
        latitude: true,
        longitude: true
      },
      distinct: ['province']
    });

    for (const address of provinces) {
      if (address.province) {
        const key = `province-${address.province}`;
        if (!seen.has(key)) {
          seen.add(key);

          const equipmentCount = await this.prisma.equipment.count({
            where: {
              moderationStatus: 'APPROVED',
              deletedAt: null,
              Address: { province: address.province }
            }
          });

          results.push({
            id: `province-${address.province.toLowerCase().replace(/\s+/g, '-')}`,
            name: address.province,
            type: 'province',
            latitude: address.latitude,
            longitude: address.longitude,
            equipmentCount
          });
        }
      }
    }

    // Buscar cidades
    const cities = await this.prisma.address.findMany({
      where: {
        city: {
          contains: searchTerm,
          mode: 'insensitive'
        },
        latitude: { not: null },
        longitude: { not: null },
        Equipment: { some: { moderationStatus: 'APPROVED', deletedAt: null } }
      },
      select: {
        city: true,
        latitude: true,
        longitude: true
      },
      distinct: ['city']
    });

    for (const address of cities) {
      if (address.city) {
        const key = `city-${address.city}`;
        if (!seen.has(key)) {
          seen.add(key);

          const equipmentCount = await this.prisma.equipment.count({
            where: {
              moderationStatus: 'APPROVED',
              deletedAt: null,
              Address: { city: address.city }
            }
          });

          results.push({
            id: `city-${address.city.toLowerCase().replace(/\s+/g, '-')}`,
            name: address.city,
            type: 'city',
            latitude: address.latitude,
            longitude: address.longitude,
            equipmentCount
          });
        }
      }
    }

    // Buscar distritos
    const districts = await this.prisma.address.findMany({
      where: {
        district: {
          contains: searchTerm,
          mode: 'insensitive'
        },
        latitude: { not: null },
        longitude: { not: null },
        Equipment: { some: { moderationStatus: 'APPROVED', deletedAt: null } }
      },
      select: {
        district: true,
        city: true,
        latitude: true,
        longitude: true
      },
      distinct: ['district', 'city']
    });

    for (const address of districts) {
      if (address.district && address.city) {
        const key = `district-${address.district}-${address.city}`;
        if (!seen.has(key)) {
          seen.add(key);

          const equipmentCount = await this.prisma.equipment.count({
            where: {
              moderationStatus: 'APPROVED',
              deletedAt: null,
              Address: {
                district: address.district,
                city: address.city
              }
            }
          });

          results.push({
            id: `district-${address.district.toLowerCase().replace(/\s+/g, '-')}-${address.city.toLowerCase().replace(/\s+/g, '-')}`,
            name: address.district,
            type: 'district',
            latitude: address.latitude,
            longitude: address.longitude,
            equipmentCount
          });
        }
      }
    }

    return results;
  }
}
