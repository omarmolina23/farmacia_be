import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create.category';
import { UpdateCategoryDto } from './dto/update.category';

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    category: {
      create: jest.fn((dto) => Promise.resolve({ id: '1', ...dto.data })),
      findMany: jest.fn(() => Promise.resolve([
        { id: '1', name: 'Category 1' },
        { id: '2', name: 'Category 2' },
      ])),
      findUnique: jest.fn(({ where }) => Promise.resolve({ id: where.id, name: `Category ${where.id}` })),
      update: jest.fn(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
      delete: jest.fn(({ where }) => Promise.resolve({ id: where.id, deleted: true })),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    categoryService = module.get<CategoryService>(CategoryService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const dto: CreateCategoryDto = { name: 'New Category' } as CreateCategoryDto;
      expect(await categoryService.create(dto)).toEqual({
        id: '1',
        name: 'New Category',
      });
      expect(prismaService.category.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      expect(await categoryService.findAll()).toEqual([
        { id: '1', name: 'Category 1' },
        { id: '2', name: 'Category 2' },
      ]);
      expect(prismaService.category.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single category', async () => {
      expect(await categoryService.findOne('1')).toEqual({
        id: '1',
        name: 'Category 1',
      });
      expect(prismaService.category.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const dto: UpdateCategoryDto = { name: 'Updated Category' } as UpdateCategoryDto;
      expect(await categoryService.update('1', dto)).toEqual({
        id: '1',
        name: 'Updated Category',
      });
      expect(prismaService.category.update).toHaveBeenCalledWith({ where: { id: '1' }, data: dto });
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      expect(await categoryService.remove('1')).toEqual({
        id: '1',
        deleted: true,
      });
      expect(prismaService.category.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
