import { Module } from '@nestjs/common';
import { GalponesService } from './galpones.service';
import { GalponesController } from './galpones.controller';

@Module({
  providers: [GalponesService],
  controllers: [GalponesController]
})
export class GalponesModule {}
