import { Test, TestingModule } from '@nestjs/testing';
import { TestimoniesService } from './testimonies.service';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogService } from '@/common/services/audit-log.service';
import { QrCodeService } from '@/common/services/qr-code.service';
import { EmbedIdService } from '@/common/services/embed-id.service';
import { TestimonyStatus, UserRole } from '@prisma/client';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TestimoniesService', () => {
  let service: TestimoniesService;
  let prismaService: PrismaService;
  let auditLogService: AuditLogService;
  let qrCodeService: QrCodeService;
  let embedIdService: EmbedIdService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    testimony: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockAuditLogService = {
    log: jest.fn(),
  };

  const mockQrCodeService = {
    generateQrCodeUrl: jest.fn(),
  };

  const mockEmbedIdService = {
    generateUniqueEmbedId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestimoniesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
        {
          provide: QrCodeService,
          useValue: mockQrCodeService,
        },
        {
          provide: EmbedIdService,
          useValue: mockEmbedIdService,
        },
      ],
    }).compile();

    service = module.get<TestimoniesService>(TestimoniesService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
    qrCodeService = module.get<QrCodeService>(QrCodeService);
    embedIdService = module.get<EmbedIdService>(EmbedIdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTestimony', () => {
    const createTestimonyDto = {
      subjectId: 'subject-uuid',
      content: 'Great service!',
      category: 'SERVICE',
    };

    const authorId = 'author-uuid';

    it('should create a testimony successfully', async () => {
      const mockSubject = { id: 'subject-uuid', fullName: 'John Doe' };
      const mockEmbedId = 'embed123';
      const mockTestimony = {
        id: 'testimony-uuid',
        embedId: mockEmbedId,
        status: TestimonyStatus.PENDING,
        author: { id: authorId, fullName: 'Author Name', profilePhotoUrl: null },
        subject: mockSubject,
        ...createTestimonyDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockSubject);
      mockEmbedIdService.generateUniqueEmbedId.mockResolvedValue(mockEmbedId);
      mockPrismaService.testimony.create.mockResolvedValue(mockTestimony);

      const result = await service.createTestimony(createTestimonyDto, authorId);

      expect(result).toBeDefined();
      expect(result.embedId).toBe(mockEmbedId);
      expect(result.status).toBe(TestimonyStatus.PENDING);
      expect(mockAuditLogService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException if subject not found', async () => {
      // Mock author found, subject not found
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ id: authorId, fullName: 'Author Name' }) // First call for author
        .mockResolvedValueOnce(null); // Second call for subject

      await expect(
        service.createTestimony(createTestimonyDto, authorId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTestimonyByEmbedId', () => {
    const embedId = 'embed123';

    it('should return testimony for valid embed ID', async () => {
      const mockTestimony = {
        id: 'testimony-uuid',
        embedId,
        status: TestimonyStatus.VERIFIED,
        content: 'Great service!',
        author: { fullName: 'Author Name', profilePhotoUrl: null },
        subject: { fullName: 'Subject Name' },
        createdAt: new Date(),
        qrCodeUrl: 'qr-url',
      };

      mockPrismaService.testimony.findUnique.mockResolvedValue(mockTestimony);

      const result = await service.getTestimonyByEmbedId(embedId);

      expect(result).toBeDefined();
      expect(result.embedId).toBe(embedId);
      expect(result.isVerified).toBe(true);
    });

    it('should throw NotFoundException if testimony not found', async () => {
      mockPrismaService.testimony.findUnique.mockResolvedValue(null);

      await expect(
        service.getTestimonyByEmbedId(embedId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if testimony not verified', async () => {
      const mockTestimony = {
        status: TestimonyStatus.PENDING,
      };

      mockPrismaService.testimony.findUnique.mockResolvedValue(mockTestimony);

      await expect(
        service.getTestimonyByEmbedId(embedId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTestimony', () => {
    const testimonyId = 'testimony-uuid';
    const userId = 'user-uuid';

    it('should allow author to delete their own testimony', async () => {
      const mockTestimony = {
        id: testimonyId,
        authorId: userId,
      };

      const mockUser = {
        userId,
        role: UserRole.CONSUMER,
      };

      mockPrismaService.testimony.findUnique.mockResolvedValue(mockTestimony);
      mockPrismaService.testimony.delete.mockResolvedValue(mockTestimony);

      await service.deleteTestimony(testimonyId, mockUser as any);

      expect(mockPrismaService.testimony.delete).toHaveBeenCalledWith({
        where: { id: testimonyId },
      });
      expect(mockAuditLogService.log).toHaveBeenCalled();
    });

    it('should allow admin to delete any testimony', async () => {
      const mockTestimony = {
        id: testimonyId,
        authorId: 'other-user-id',
      };

      const mockUser = {
        userId,
        role: UserRole.ADMIN,
      };

      mockPrismaService.testimony.findUnique.mockResolvedValue(mockTestimony);
      mockPrismaService.testimony.delete.mockResolvedValue(mockTestimony);

      await service.deleteTestimony(testimonyId, mockUser as any);

      expect(mockPrismaService.testimony.delete).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user cannot delete testimony', async () => {
      const mockTestimony = {
        id: testimonyId,
        authorId: 'other-user-id',
      };

      const mockUser = {
        userId,
        role: UserRole.CONSUMER,
      };

      mockPrismaService.testimony.findUnique.mockResolvedValue(mockTestimony);

      await expect(
        service.deleteTestimony(testimonyId, mockUser as any)
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
