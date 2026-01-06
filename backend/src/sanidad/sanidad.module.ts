import { Module } from '@nestjs/common';
import { SanidadService } from './sanidad.service';
import { SanidadController } from './sanidad.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [FirebaseModule, AuthModule],
  controllers: [SanidadController],
  providers: [SanidadService],
  exports: [SanidadService],
})
export class SanidadModule {}
