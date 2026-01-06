import { Module } from '@nestjs/common';
import { FincasService } from './fincas.service';
import { FincasController } from './fincas.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [FirebaseModule, AuthModule],
  providers: [FincasService],
  controllers: [FincasController],
})
export class FincasModule {}
