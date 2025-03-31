import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { Status } from "./dto/create-user.dto";
import { NotFoundException } from "@nestjs/common";

describe("UsersService", () => {
  let userService: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      create: jest.fn((dto) => Promise.resolve({ id: '1', ...dto.data })),
      findMany: jest.fn(() => Promise.resolve([
        { id: '1', name: 'User 1', email: 'user1@example.com', status: Status.ACTIVE },
        { id: '2', name: 'User 2', email: 'user2@example.com', status: Status.INACTIVE },
      ])),
      findUnique: jest.fn(({ where }) => {
        if (where.id === '1') {
          return Promise.resolve({
            id: '1',
            name: 'User 1',
            email: 'user1@example.com',
            status: Status.ACTIVE,
          });
        }
        if (where.email === 'user1@example.com') {
          return Promise.resolve({
            id: '1',
            name: 'User 1',
            email: 'user1@example.com',
            status: Status.ACTIVE,
          });
        }
        return Promise.resolve(null);
      }),
      update: jest.fn(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
      delete: jest.fn(({ where }) => Promise.resolve({ id: where.id, deleted: true })),
    },
  };
  
  

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    userService = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(userService).toBeDefined();
  });

  describe("create", () => {
    it("should create a user", async () => {
      const dto: CreateUserDto = {
        id: "1",
        name: "User 1",
        email: "user1@example.com",
        status: Status.ACTIVE,
        phone: "+573001234567",
        birthdate: new Date(),
      };

    });
  });

  describe("findAll", () => {
    it("should return all users", async () => {
      expect(await userService.findAll()).toEqual([
        { id: '1', name: 'User 1', email: 'user1@example.com', status: Status.ACTIVE },
        { id: '2', name: 'User 2', email: 'user2@example.com', status: Status.INACTIVE },
      ]);
      expect(prismaService.user.findMany).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a single user", async () => {
      expect(await userService.findOne('1')).toEqual({
        id: '1',
        name: 'User 1',
        email: 'user1@example.com',
        status: Status.ACTIVE,
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it("should throw NotFoundException if user does not exist", async () => {
      await expect(userService.findOne('99')).rejects.toThrow(NotFoundException);
    });
  });

  describe("findOneByEmail", () => {
    it("should return a single user by email", async () => {
      expect(await userService.findOneByEmail('user1@example.com')).toEqual({
        id: '1',
        name: 'User 1',
        email: 'user1@example.com',
        status: Status.ACTIVE,
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { email: 'user1@example.com' } });
    });

    it("should throw NotFoundException if user does not exist", async () => {
      await expect(userService.findOneByEmail('H2l0X@example.com')).rejects.toThrow(NotFoundException);
    });
  });

  describe("findOneByNameOrId", () => {
    it("should return all users if no query is provided", async () => {
      const users = await userService.findOneByNameOrId();
      expect(users).toEqual([
        { id: '1', name: 'User 1', email: 'user1@example.com', status: Status.ACTIVE },
        { id: '2', name: 'User 2', email: 'user2@example.com', status: Status.INACTIVE },
      ]);
      expect(prismaService.user.findMany).toHaveBeenCalled();
    });
  
    it("should return a user when searching by ID", async () => {
      mockPrismaService.user.findMany.mockResolvedValueOnce([
        { id: '1', name: 'User 1', email: 'user1@example.com', status: Status.ACTIVE },
      ]);
  
      const user = await userService.findOneByNameOrId('1');
      expect(user).toEqual([
        { id: '1', name: 'User 1', email: 'user1@example.com', status: Status.ACTIVE },
      ]);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: '1', mode: 'insensitive' } },
            { id: '1' },
          ],
        },
      });
    });
  
    it("should return users when searching by name", async () => {
      mockPrismaService.user.findMany.mockResolvedValueOnce([
        { id: '1', name: 'User 1', email: 'user1@example.com', status: Status.ACTIVE },
      ]);
  
      const user = await userService.findOneByNameOrId('User 1');
      expect(user).toEqual([
        { id: '1', name: 'User 1', email: 'user1@example.com', status: Status.ACTIVE },
      ]);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'User 1', mode: 'insensitive' } },
            { id: 'User 1' },
          ],
        },
      });
    });
  
    it("should return an empty array if no user matches the query", async () => {
      mockPrismaService.user.findMany.mockResolvedValueOnce([]);
  
      const user = await userService.findOneByNameOrId('NonExistentUser');
      expect(user).toEqual([]);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'NonExistentUser', mode: 'insensitive' } },
            { id: 'NonExistentUser' },
          ],
        },
      });
    });
  });
  
  describe("update", () => {
    it("should update a user", async () => {
      const dto: UpdateUserDto = { name: "Updated User" } as UpdateUserDto;
      expect(await userService.update('1', dto)).toEqual({
        id: '1',
        name: 'Updated User',
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({ where: { id: '1' }, data: dto });
    });
  }) 

  describe("remove", () => {
    it("should set user status to INACTIVE if user exists", async () => {
      const id = "1";
  
      await expect(userService.remove(id)).resolves.toEqual({
        id: "1",
        status: "INACTIVE",
      });
  
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { id } });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id },
        data: { status: "INACTIVE" },
      });
    });
  });
});