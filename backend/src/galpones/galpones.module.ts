import { Module } from '@nestjs/common';
import { GalponesService } from './galpones.service';
import { GalponesController } from './galpones.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [FirebaseModule, AuthModule],
  providers: [GalponesService],
  controllers: [GalponesController],
})
export class GalponesModule {}
