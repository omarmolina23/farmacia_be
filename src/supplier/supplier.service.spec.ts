import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { NotFoundException } from '@nestjs/common';
import { Status } from '@prisma/client';

describe('SupplierService', () => {
  let supplierService: SupplierService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    supplier: {
      create: jest.fn((dto) => Promise.resolve({ id: '1', ...dto.data })),
      findMany: jest.fn(() =>
        Promise.resolve([
          {
            id: '1',
            name: 'Proveedor 1',
            phone: '+573001234567',
            email: 'proveedor1@example.com',
            status: Status.ACTIVE,
          },
          {
            id: '2',
            name: 'Proveedor 2',
            phone: '+573009876543',
            email: 'proveedor2@example.com',
            status: Status.INACTIVE,
          },
        ]),
      ),
      findUnique: jest.fn(() =>
        Promise.resolve({
          id: '1',
          name: 'Proveedor 1',
          phone: '+573001234567',
          email: 'proveedor1@example.com',
          status: Status.ACTIVE,
        }),
      ),
      update: jest.fn(({ where, data }) =>
        Promise.resolve({ id: where.id, ...data }),
      ),
      delete: jest.fn(({ where }) =>
        Promise.resolve({ id: where.id, deleted: true }),
      ),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaMock = module.get(PrismaService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  const mockUser = {
    id: '1',
    name: 'John Doe',
    phone: '1234567890',
    email: 'john@example.com',
    password: 'hashedPassword',
    birthdate: new Date('1990-01-01'),
    registrationDate: new Date(),
    status: Status.INACTIVE,
    isAdmin: false,
    isEmployee: true,
  };

  describe('create', () => {
    it('should create a supplier', async () => {
      const dto: CreateSupplierDto = {
        name: 'Proveedor Nuevo',
        phone: '+573001234567',
        email: 'nuevo@proveedor.com',
        status: Status.ACTIVE,
      };
      expect(await supplierService.create(dto)).toEqual({
        id: '1',
        ...dto,
      });
      expect(prismaService.supplier.create).toHaveBeenCalledWith({ data: dto });
    });

    it('should throw a ConflictException if supplier already exists', async () => {
      mockPrismaService.supplier.create.mockRejectedValueOnce({
        code: 'P2002',
      });

      const dto: CreateSupplierDto = {
        name: 'Proveedor Duplicado',
        phone: '+573001234567',
        email: 'duplicado@proveedor.com',
        status: Status.ACTIVE,
      };

      await expect(supplierService.create(dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all suppliers', async () => {
      expect(await supplierService.findAll()).toEqual([
        {
          id: '1',
          name: 'Proveedor 1',
          phone: '+573001234567',
          email: 'proveedor1@example.com',
          status: Status.ACTIVE,
        },
        {
          id: '2',
          name: 'Proveedor 2',
          phone: '+573009876543',
          email: 'proveedor2@example.com',
          status: Status.INACTIVE,
        },
      ]);
      expect(prismaService.supplier.findMany).toHaveBeenCalled();
    });
  });

  describe('findByNameOrEmail', () => {
    it('should return all suppliers if no query is provided', async () => {
      const suppliers = mockPrismaService.supplier.findMany();
      const result = await supplierService.findByNameOrEmail();
      expect(result).toEqual(await suppliers);
      expect(prismaService.supplier.findMany).toHaveBeenCalledWith();
    });

    it('should return filtered suppliers if query is provided', async () => {
      const query = 'test';
      const suppliers = mockPrismaService.supplier.findMany();
      jest
        .spyOn(prismaService.supplier, 'findMany')
        .mockResolvedValue(suppliers);

      const result = await supplierService.findByNameOrEmail(query);
      expect(result).toEqual(await suppliers);
      expect(prismaService.supplier.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
      });
    });

    it('should throw NotFoundException if no suppliers match', async () => {
      jest.spyOn(prismaService.supplier, 'findMany').mockResolvedValue([]);

      await expect(
        supplierService.findByNameOrEmail('inexistente'),
      ).rejects.toThrow(
        new NotFoundException(
          'No se encontraron proveedores con el nombre o email "inexistente"',
        ),
      );
    });
  });

  describe('update', () => {
    it('should update a supplier', async () => {
      const dto: UpdateSupplierDto = { name: 'Proveedor Actualizado' };
      expect(await supplierService.update('1', dto)).toEqual({
        id: '1',
        name: 'Proveedor Actualizado',
      });
      expect(prismaService.supplier.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: dto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a supplier', async () => {
      expect(await supplierService.remove('1')).toEqual({
        id: '1',
        status: 'INACTIVE',
      });
      expect(prismaService.supplier.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'INACTIVE' },
      });
    });
  });
});
