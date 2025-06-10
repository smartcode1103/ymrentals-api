import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAddressDto: CreateAddressDto) {
    return this.prisma.address.create({ data: createAddressDto });
  }

  async findAll() {
    return this.prisma.address.findMany();
  }

  async findOne(id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    return address;
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

  async getLocationsByType(type: 'province' | 'city' | 'district') {
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
          equipmentCount
        });
      }
    } else if (type === 'city') {
      const cities = await this.prisma.address.findMany({
        where: {
          city: { not: null },
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
        const equipmentCount = await this.prisma.equipment.count({
          where: {
            moderationStatus: 'APPROVED',
            deletedAt: null,
            Address: { city: address.city }
          }
        });

        results.push({
          id: `city-${address.city?.toLowerCase().replace(/\s+/g, '-')}`,
          name: address.city,
          type: 'city',
          latitude: address.latitude,
          longitude: address.longitude,
          equipmentCount
        });
      }
    } else if (type === 'district') {
      const districts = await this.prisma.address.findMany({
        where: {
          district: { not: null },
          latitude: { not: null },
          longitude: { not: null },
          Equipment: { some: { moderationStatus: 'APPROVED', deletedAt: null } }
        },
        select: {
          district: true,
          latitude: true,
          longitude: true
        },
        distinct: ['district']
      });

      for (const address of districts) {
        const equipmentCount = await this.prisma.equipment.count({
          where: {
            moderationStatus: 'APPROVED',
            deletedAt: null,
            Address: { district: address.district }
          }
        });

        results.push({
          id: `district-${address.district?.toLowerCase().replace(/\s+/g, '-')}`,
          name: address.district,
          type: 'district',
          latitude: address.latitude,
          longitude: address.longitude,
          equipmentCount
        });
      }
    }

    return results.filter(loc => loc.latitude !== 0 && loc.longitude !== 0);
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
        latitude: true,
        longitude: true
      },
      distinct: ['district']
    });

    for (const address of districts) {
      if (address.district) {
        const key = `district-${address.district}`;
        if (!seen.has(key)) {
          seen.add(key);

          const equipmentCount = await this.prisma.equipment.count({
            where: {
              moderationStatus: 'APPROVED',
              deletedAt: null,
              Address: { district: address.district }
            }
          });

          results.push({
            id: `district-${address.district.toLowerCase().replace(/\s+/g, '-')}`,
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
