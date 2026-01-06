import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { InsumosService } from './insumos.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('insumos')
@UseGuards(AuthGuard, RolesGuard)
export class InsumosController {
  constructor(private readonly insumosService: InsumosService) {}

  @Post()
  @Roles('ADMIN', 'GERENTE')
  create(@Body() createInsumoDto: CreateInsumoDto) {
    return this.insumosService.create(createInsumoDto);
  }

  @Get()
  findAll() {
    return this.insumosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.insumosService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'GERENTE')
  update(@Param('id') id: string, @Body() updateInsumoDto: UpdateInsumoDto) {
    return this.insumosService.update(id, updateInsumoDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'GERENTE')
  remove(@Param('id') id: string) {
    return this.insumosService.remove(id);
  }
}