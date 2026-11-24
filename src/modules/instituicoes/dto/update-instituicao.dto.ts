import { PartialType } from '@nestjs/swagger';
import { CreateInstituicaoDto } from './create-instituicao.dto.js';

export class UpdateInstituicaoDto extends PartialType(CreateInstituicaoDto) {}

