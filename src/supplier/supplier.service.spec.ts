import { Test, TestingModule } from '@nestjs/testing';
import { SupplierService } from './supplier.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create.supplier';
import { UpdateSupplierDto } from './dto/update.supplier';
import { Status } from './dto/create.supplier';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('SupplierService', () => {
  let supplierService: SupplierService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    supplier: {
      create: jest.fn((dto) => Promise.resolve({ id: '1', ...dto.data })),
      findMany: jest.fn(() => Promise.resolve([
        { id: '1', name: 'Proveedor 1', phone: '+573001234567', email: 'proveedor1@example.com', status: Status.ACTIVE },
        { id: '2', name: 'Proveedor 2', phone: '+573009876543', email: 'proveedor2@example.com', status: Status.INACTIVE },
      ])),
      findUnique: jest.fn(({ where }) => Promise.resolve(
        where.id === '1' ? { id: '1', name: 'Proveedor 1', phone: '+573001234567', email: 'proveedor1@example.com', status: Status.ACTIVE } : null
      )),
      update: jest.fn(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
      delete: jest.fn(({ where }) => Promise.resolve({ id: where.id, deleted: true })),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    supplierService = module.get<SupplierService>(SupplierService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(supplierService).toBeDefined();
  });

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
      mockPrismaService.supplier.create.mockRejectedValueOnce({ code: 'P2002' });

      const dto: CreateSupplierDto = {
        name: 'Proveedor Duplicado',
        phone: '+573001234567',
        email: 'duplicado@proveedor.com',
        status: Status.ACTIVE,
      };

      await expect(supplierService.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all suppliers', async () => {
      expect(await supplierService.findAll()).toEqual([
        { id: '1', name: 'Proveedor 1', phone: '+573001234567', email: 'proveedor1@example.com', status: Status.ACTIVE },
        { id: '2', name: 'Proveedor 2', phone: '+573009876543', email: 'proveedor2@example.com', status: Status.INACTIVE },
      ]);
      expect(prismaService.supplier.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single supplier', async () => {
      expect(await supplierService.findOne('1')).toEqual({
        id: '1',
        name: 'Proveedor 1',
        phone: '+573001234567',
        email: 'proveedor1@example.com',
        status: Status.ACTIVE,
      });
      expect(prismaService.supplier.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException if supplier does not exist', async () => {
      await expect(supplierService.findOne('99')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a supplier', async () => {
      const dto: UpdateSupplierDto = { name: 'Proveedor Actualizado' };
      expect(await supplierService.update('1', dto)).toEqual({
        id: '1',
        name: 'Proveedor Actualizado',
      });
      expect(prismaService.supplier.update).toHaveBeenCalledWith({ where: { id: '1' }, data: dto });
    });
  });

  describe('remove', () => {
    it('should delete a supplier', async () => {
      expect(await supplierService.remove('1')).toEqual({
        id: '1',
        deleted: true,
      });
      expect(prismaService.supplier.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
