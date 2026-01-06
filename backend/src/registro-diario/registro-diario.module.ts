import { Module } from '@nestjs/common';
import { RegistroDiarioService } from './registro-diario.service';
import { RegistroDiarioController } from './registro-diario.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [FirebaseModule, AuthModule],
  controllers: [RegistroDiarioController],
  providers: [RegistroDiarioService],
  exports: [RegistroDiarioService],
})
export class RegistroDiarioModule {}
