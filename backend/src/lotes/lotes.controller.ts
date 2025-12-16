import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { LotesService } from './lotes.service';
import { CreateLoteDto } from './dto/create-lote.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('lotes')
@UseGuards(AuthGuard, RolesGuard)
export class LotesController {
  constructor(private readonly lotesService: LotesService) {}

  @Post()
  @Roles('ADMIN', 'GERENTE')
  create(@Body() createLoteDto: CreateLoteDto) {
    return this.lotesService.create(createLoteDto);
  }

  @Get()
  @Roles('ADMIN', 'GERENTE', 'GALPONERO')
  findAll() {
    return this.lotesService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'GERENTE', 'GALPONERO')
  findOne(@Param('id') id: string) {
    return this.lotesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'GERENTE')
  update(@Param('id') id: string, @Body() updateLoteDto: Partial<CreateLoteDto>) {
    return this.lotesService.update(id, updateLoteDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.lotesService.remove(id);
  }
}
