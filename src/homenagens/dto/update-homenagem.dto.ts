import { PartialType } from '@nestjs/mapped-types';
import { CreateHomenagemDto } from './create-homenagem.dto.js';

export class UpdateHomenagemDto extends PartialType(CreateHomenagemDto) {}
