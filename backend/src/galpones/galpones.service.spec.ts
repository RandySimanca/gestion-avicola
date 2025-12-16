import { Test, TestingModule } from '@nestjs/testing';
import { GalponesService } from './galpones.service';

describe('GalponesService', () => {
  let service: GalponesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GalponesService],
    }).compile();

    service = module.get<GalponesService>(GalponesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
