import { Test, TestingModule } from '@nestjs/testing';
import { AddressService } from './address.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

describe('AddressService', () => {
  let service: AddressService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    address: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    equipment: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AddressService>(AddressService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create address with valid data', async () => {
      const createAddressDto: CreateAddressDto = {
        street: 'Rua da Independência',
        number: '123',
        district: 'Maianga',
        city: 'Luanda',
        province: 'Luanda',
        latitude: -8.8390,
        longitude: 13.2894,
      };

      const expectedAddress = {
        id: 'test-id',
        ...createAddressDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.address.create.mockResolvedValue(expectedAddress);

      const result = await service.create(createAddressDto);

      expect(mockPrismaService.address.create).toHaveBeenCalledWith({
        data: createAddressDto,
      });
      expect(result).toEqual(expectedAddress);
    });

    it('should throw error when province is missing', async () => {
      const createAddressDto: CreateAddressDto = {
        street: 'Rua da Independência',
        city: 'Luanda',
        province: '', // Empty province
        latitude: -8.8390,
        longitude: 13.2894,
      };

      await expect(service.create(createAddressDto)).rejects.toThrow(
        'Província e cidade são obrigatórias'
      );
    });

    it('should throw error when city is missing', async () => {
      const createAddressDto: CreateAddressDto = {
        street: 'Rua da Independência',
        city: '', // Empty city
        province: 'Luanda',
        latitude: -8.8390,
        longitude: 13.2894,
      };

      await expect(service.create(createAddressDto)).rejects.toThrow(
        'Província e cidade são obrigatórias'
      );
    });

    it('should throw error when coordinates are (0,0)', async () => {
      const createAddressDto: CreateAddressDto = {
        city: 'Luanda',
        province: 'Luanda',
        latitude: 0, // Invalid coordinate
        longitude: 0, // Invalid coordinate
      };

      await expect(service.create(createAddressDto)).rejects.toThrow(
        'Coordenadas inválidas (0,0) não são permitidas'
      );
    });

    it('should throw error when coordinates are outside Angola bounds', async () => {
      const createAddressDto: CreateAddressDto = {
        city: 'Luanda',
        province: 'Luanda',
        latitude: -25.0, // Outside Angola bounds
        longitude: 13.2894,
      };

      await expect(service.create(createAddressDto)).rejects.toThrow(
        'Coordenadas devem estar dentro de Angola'
      );
    });

    it('should accept valid coordinates within Angola bounds', async () => {
      const createAddressDto: CreateAddressDto = {
        city: 'Luanda',
        province: 'Luanda',
        latitude: -8.8390, // Valid Angola coordinate
        longitude: 13.2894, // Valid Angola coordinate
      };

      const expectedAddress = {
        id: 'test-id',
        ...createAddressDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.address.create.mockResolvedValue(expectedAddress);

      const result = await service.create(createAddressDto);

      expect(result).toEqual(expectedAddress);
    });

    it('should handle database errors gracefully', async () => {
      const createAddressDto: CreateAddressDto = {
        city: 'Luanda',
        province: 'Luanda',
        latitude: -8.8390,
        longitude: 13.2894,
      };

      mockPrismaService.address.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createAddressDto)).rejects.toThrow(
        'Erro ao salvar endereço na base de dados'
      );
    });

    it('should work without coordinates', async () => {
      const createAddressDto: CreateAddressDto = {
        city: 'Luanda',
        province: 'Luanda',
        // No coordinates provided
      };

      const expectedAddress = {
        id: 'test-id',
        ...createAddressDto,
        latitude: null,
        longitude: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.address.create.mockResolvedValue(expectedAddress);

      const result = await service.create(createAddressDto);

      expect(result).toEqual(expectedAddress);
    });
  });
});
