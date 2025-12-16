import { Module } from '@nestjs/common';
import { FincasService } from './fincas.service';
import { FincasController } from './fincas.controller';

@Module({
  providers: [FincasService],
  controllers: [FincasController]
})
export class FincasModule {}
