import { Module } from '@nestjs/common';
import { ConsumoInsumosService } from './consumo-insumos.service';
import { ConsumoInsumosController } from './consumo-insumos.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [FirebaseModule, AuthModule],
  providers: [ConsumoInsumosService],
  controllers: [ConsumoInsumosController],
  exports: [ConsumoInsumosService],
})
export class ConsumoInsumosModule {}
