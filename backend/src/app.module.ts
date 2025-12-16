import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { UsersModule } from './users/users.module';
import { FincasModule } from './fincas/fincas.module';
import { GalponesModule } from './galpones/galpones.module';
import { LotesModule } from './lotes/lotes.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
