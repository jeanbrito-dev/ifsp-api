import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateHomenagemDto } from './dto/create-homenagem.dto.js';
import { QueryHomenagemDto } from './dto/query-homenagem.dto.js';
import { UpdateHomenagemDto } from './dto/update-homenagem.dto.js';
import { HomenagensService } from './homenagens.service.js';

@ApiTags('Homenagens')
@Controller('homenagens')
export class HomenagensController {
  constructor(private readonly service: HomenagensService) {}

  @Get()
  findAll(@Query() query: QueryHomenagemDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post() // TODO: proteger com admin
  create(@Body() dto: CreateHomenagemDto) {
    return this.service.create(dto);
  }

  @Put(':id') // TODO: proteger com admin
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHomenagemDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id') // TODO: proteger com admin
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}