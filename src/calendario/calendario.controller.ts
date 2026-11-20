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
import { CalendarioService } from './calendario.service.js';
import { CreateEventoDto } from './dto/create-evento.dto.js';
import { QueryEventoDto } from './dto/query-evento.dto.js';
import { UpdateEventoDto } from './dto/update-evento.dto.js';

@ApiTags('Calendário')
@Controller('calendario')
export class CalendarioController {
  constructor(private readonly service: CalendarioService) {}

  @Get()
  findAll(@Query() query: QueryEventoDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post() // TODO: proteger com admin
  create(@Body() dto: CreateEventoDto) {
    return this.service.create(dto);
  }

  @Put(':id') // TODO: proteger com admin
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id') // TODO: proteger com admin
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}