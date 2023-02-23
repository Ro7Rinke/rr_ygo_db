import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CardModule } from './card/card.module';
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    CardModule,
    ConfigModule.forRoot(),
    DatabaseModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
