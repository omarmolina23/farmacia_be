import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create.category';
import { UpdateCategoryDto } from './dto/update.category';

describe('CategoryController', () => {
  let categoryController: CategoryController;
  let categoryService: CategoryService;

  const mockCategoryService = {
    create: jest.fn((dto) => ({
      id: '1',
      ...dto,
    })),
    findAll: jest.fn(() => [
      { id: '1', name: 'Category 1' },
      { id: '2', name: 'Category 2' },
    ]),
    findOne: jest.fn((id) => ({ id, name: `Category ${id}` })),
    update: jest.fn((id, dto) => ({ id, ...dto })),
    remove: jest.fn((id) => ({ id, deleted: true })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [{ provide: CategoryService, useValue: mockCategoryService }],
    }).compile();

    categoryController = module.get<CategoryController>(CategoryController);
    categoryService = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(categoryController).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const dto: CreateCategoryDto = { name: 'New Category' } as CreateCategoryDto;
      expect(await categoryController.create(dto)).toEqual({
        id: '1',
        ...dto,
      });
      expect(categoryService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      expect(await categoryController.findAll()).toEqual([
        { id: '1', name: 'Category 1' },
        { id: '2', name: 'Category 2' },
      ]);
      expect(categoryService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single category', async () => {
      expect(await categoryController.findOne('1')).toEqual({
        id: '1',
        name: 'Category 1',
      });
      expect(categoryService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const dto: UpdateCategoryDto = { name: 'Updated Category' } as UpdateCategoryDto;
      expect(await categoryController.update('1', dto)).toEqual({
        id: '1',
        ...dto,
      });
      expect(categoryService.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      expect(await categoryController.remove('1')).toEqual({
        id: '1',
        deleted: true,
      });
      expect(categoryService.remove).toHaveBeenCalledWith('1');
    });
  });
});
