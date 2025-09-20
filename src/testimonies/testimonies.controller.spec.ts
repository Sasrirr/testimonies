import { Test, TestingModule } from '@nestjs/testing';
import { TestimoniesController } from './testimonies.controller';
import { TestimoniesService } from './testimonies.service';
import { CreateTestimonyDto } from './dto/testimony.dto';
import { UserRole } from '@prisma/client';

describe('TestimoniesController', () => {
  let controller: TestimoniesController;
  let service: TestimoniesService;

  const mockTestimoniesService = {
    createTestimony: jest.fn(),
    getTestimonyByEmbedId: jest.fn(),
    updateTestimony: jest.fn(),
    deleteTestimony: jest.fn(),
    getPendingTestimonies: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestimoniesController],
      providers: [
        {
          provide: TestimoniesService,
          useValue: mockTestimoniesService,
        },
      ],
    }).compile();

    controller = module.get<TestimoniesController>(TestimoniesController);
    service = module.get<TestimoniesService>(TestimoniesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTestimony', () => {
    it('should create a testimony', async () => {
      const createTestimonyDto: CreateTestimonyDto = {
        subjectId: 'subject-uuid',
        content: 'Great service!',
        category: 'SERVICE',
      };

      const userId = 'user-uuid';
      const expectedResult = {
        id: 'testimony-uuid',
        embedId: 'embed123',
        // ... other properties
      };

      mockTestimoniesService.createTestimony.mockResolvedValue(expectedResult);

      const result = await controller.createTestimony(createTestimonyDto, userId);

      expect(result).toBe(expectedResult);
      expect(service.createTestimony).toHaveBeenCalledWith(createTestimonyDto, userId);
    });
  });

  describe('getTestimonyByEmbedId', () => {
    it('should return a testimony by embed ID', async () => {
      const embedId = 'embed123';
      const expectedResult = {
        embedId,
        authorName: 'John Doe',
        content: 'Great service!',
        isVerified: true,
      };

      mockTestimoniesService.getTestimonyByEmbedId.mockResolvedValue(expectedResult);

      const result = await controller.getTestimonyByEmbedId(embedId);

      expect(result).toBe(expectedResult);
      expect(service.getTestimonyByEmbedId).toHaveBeenCalledWith(embedId);
    });
  });
});
