import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RegistroDiarioService } from './registro-diario.service';
import { CreateRegistroDiarioDto } from './dto/create-registro-diario.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('registro-diario')
@UseGuards(AuthGuard, RolesGuard)
export class RegistroDiarioController {
  constructor(private readonly registroDiarioService: RegistroDiarioService) {}

  @Post()
  @Roles('ADMIN', 'GERENTE', 'GALPONERO')
  create(@Body() createRegistroDiarioDto: CreateRegistroDiarioDto) {
    return this.registroDiarioService.create(createRegistroDiarioDto);
  }

  @Get()
  @Roles('ADMIN', 'GERENTE', 'CONTADOR')
  findAll() {
    return this.registroDiarioService.findAll();
  }

  @Get('lote/:loteId')
  @Roles('ADMIN', 'GERENTE', 'GALPONERO', 'CONTADOR')
  findByLote(@Param('loteId') loteId: string) {
    return this.registroDiarioService.findByLote(loteId);
  }

  @Get('kpi/:loteId')
  @Roles('ADMIN', 'GERENTE', 'CONTADOR')
  calcularKPIsLote(@Param('loteId') loteId: string) {
    return this.registroDiarioService.calcularKPIsLote(loteId);
  }

  @Get(':id')
  @Roles('ADMIN', 'GERENTE', 'GALPONERO', 'CONTADOR')
  findOne(@Param('id') id: string) {
    return this.registroDiarioService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'GERENTE')
  update(@Param('id') id: string, @Body() updateRegistroDiarioDto: Partial<CreateRegistroDiarioDto>) {
    return this.registroDiarioService.update(id, updateRegistroDiarioDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.registroDiarioService.remove(id);
  }

  @Get('engorde/:loteId')
  @Roles('ADMIN', 'GERENTE', 'CONTADOR')
  getRegistrosEngorde(@Param('loteId') loteId: string) {
    return this.registroDiarioService.getRegistrosEngorde(loteId);
  }

  @Get('postura/:loteId')
  @Roles('ADMIN', 'GERENTE', 'CONTADOR')
  getRegistrosPostura(@Param('loteId') loteId: string) {
    return this.registroDiarioService.getRegistrosPostura(loteId);
  }

  @Get('dashboard/global-kpis')
  @Roles('ADMIN', 'GERENTE', 'CONTADOR', 'GALPONERO')
  getGlobalKPIs() {
    return this.registroDiarioService.getGlobalKPIs();
  }
}
