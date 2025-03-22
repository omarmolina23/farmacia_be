import { Test, TestingModule } from '@nestjs/testing';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create.supplier';
import { UpdateSupplierDto } from './dto/update.supplier';

describe('SupplierController', () => {
  let supplierController: SupplierController;
  let supplierService: SupplierService;

  const mockSupplierService = {
    create: jest.fn((dto) => ({
      id: '1',
      ...dto,
    })),
    findAll: jest.fn(() => [
      { id: '1', nombre: 'Supplier 1' },
      { id: '2', nombre: 'Supplier 2' },
    ]),
    findOne: jest.fn((id) => ({ id, nombre: `Supplier ${id}` })),
    update: jest.fn((id, dto) => ({ id, ...dto })),
    remove: jest.fn((id) => ({ id, deleted: true })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplierController],
      providers: [{ provide: SupplierService, useValue: mockSupplierService }],
    }).compile();

    supplierController = module.get<SupplierController>(SupplierController);
    supplierService = module.get<SupplierService>(SupplierService);
  });

  it('should be defined', () => {
    expect(supplierController).toBeDefined();
  });

  describe('create', () => {
    it('should create a supplier', async () => {
      const dto: CreateSupplierDto = { nombre: 'New Supplier' } as CreateSupplierDto;
      expect(await supplierController.create(dto)).toEqual({
        id: '1',
        nombre: 'New Supplier',
      });
      expect(supplierService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all suppliers', async () => {
      expect(await supplierController.findAll()).toEqual([
        { id: '1', nombre: 'Supplier 1' },
        { id: '2', nombre: 'Supplier 2' },
      ]);
      expect(supplierService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single supplier', async () => {
      expect(await supplierController.findOne('1')).toEqual({
        id: '1',
        nombre: 'Supplier 1',
      });
      expect(supplierService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a supplier', async () => {
      const dto: UpdateSupplierDto = { nombre: 'Updated Supplier' } as UpdateSupplierDto;
      expect(await supplierController.update('1', dto)).toEqual({
        id: '1',
        nombre: 'Updated Supplier',
      });
      expect(supplierService.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should delete a supplier', async () => {
      expect(await supplierController.remove('1')).toEqual({
        id: '1',
        deleted: true,
      });
      expect(supplierService.remove).toHaveBeenCalledWith('1');
    });
  });
});
