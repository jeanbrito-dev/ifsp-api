import { Module } from '@nestjs/common';
import { HomenagensController } from './homenagens.controller.js';
import { HomenagensService } from './homenagens.service.js';

@Module({
  controllers: [HomenagensController],
  providers: [HomenagensService],
})
export class HomenagensModule {}
