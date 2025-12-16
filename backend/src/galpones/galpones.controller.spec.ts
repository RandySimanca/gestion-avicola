import { Test, TestingModule } from '@nestjs/testing';
import { GalponesController } from './galpones.controller';

describe('GalponesController', () => {
  let controller: GalponesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GalponesController],
    }).compile();

    controller = module.get<GalponesController>(GalponesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
