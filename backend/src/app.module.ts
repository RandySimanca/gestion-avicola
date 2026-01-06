import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { UsersModule } from './users/users.module';
import { FincasModule } from './fincas/fincas.module';
import { GalponesModule } from './galpones/galpones.module';
import { LotesModule } from './lotes/lotes.module';
import { InsumosModule } from './insumos/insumos.module';
import { SanidadModule } from './sanidad/sanidad.module';
import { RegistroDiarioModule } from './registro-diario/registro-diario.module';
import { AuthModule } from './auth/auth.module';
import { VentasModule } from './ventas/ventas.module';
import { ConsumoInsumosModule } from './consumo-insumos/consumo-insumos.module';
import { ReportesModule } from './reportes/reportes.module';
import { GastosModule } from './gastos/gastos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FirebaseModule,
    UsersModule,
    FincasModule,
    GalponesModule,
    LotesModule,
    InsumosModule,
    SanidadModule,
    RegistroDiarioModule,
    AuthModule,
    VentasModule,
    ConsumoInsumosModule,
    ReportesModule,
    GastosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
