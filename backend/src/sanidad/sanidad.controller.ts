import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { SanidadService } from './sanidad.service';
import { CreateProgramaSanitarioDto } from './dto/create-programa-sanitario.dto';
import { CreateAplicacionSanitariaDto } from './dto/create-aplicacion-sanitaria.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('sanidad')
@UseGuards(AuthGuard, RolesGuard)
export class SanidadController {
  constructor(private readonly sanidadService: SanidadService) {}

  // Programa Sanitario endpoints
  @Post('programas')
  @Roles('ADMIN', 'GERENTE')
  createPrograma(@Body() createProgramaSanitarioDto: CreateProgramaSanitarioDto) {
    return this.sanidadService.createPrograma(createProgramaSanitarioDto);
  }

  @Get('programas')
  @Roles('ADMIN', 'GERENTE', 'CONTADOR')
  findAllProgramas() {
    return this.sanidadService.findAllProgramas();
  }

  @Get('programas/lote/:loteId')
  @Roles('ADMIN', 'GERENTE', 'GALPONERO', 'CONTADOR')
  findProgramasByLote(@Param('loteId') loteId: string) {
    return this.sanidadService.findProgramasByLote(loteId);
  }

  @Get('programas/pendientes/:loteId')
  @Roles('ADMIN', 'GERENTE', 'GALPONERO')
  findProgramasPendientes(
    @Param('loteId') loteId: string,
    @Query('edadActual') edadActualDias: number
  ) {
    return this.sanidadService.findProgramasPendientes(loteId, edadActualDias);
  }

  @Patch('programas/:id')
  @Roles('ADMIN', 'GERENTE')
  updatePrograma(
    @Param('id') id: string,
    @Body() updateProgramaDto: Partial<CreateProgramaSanitarioDto>
  ) {
    return this.sanidadService.updatePrograma(id, updateProgramaDto);
  }

  @Delete('programas/:id')
  @Roles('ADMIN')
  removePrograma(@Param('id') id: string) {
    return this.sanidadService.removePrograma(id);
  }

  // Aplicación Sanitaria endpoints
  @Post('aplicaciones')
  @Roles('ADMIN', 'GERENTE', 'GALPONERO')
  createAplicacion(@Body() createAplicacionSanitariaDto: CreateAplicacionSanitariaDto) {
    return this.sanidadService.createAplicacion(createAplicacionSanitariaDto);
  }

  @Get('aplicaciones')
  @Roles('ADMIN', 'GERENTE', 'CONTADOR')
  findAllAplicaciones() {
    return this.sanidadService.findAllAplicaciones();
  }

  @Get('aplicaciones/lote/:loteId')
  @Roles('ADMIN', 'GERENTE', 'GALPONERO', 'CONTADOR')
  findAplicacionesByLote(@Param('loteId') loteId: string) {
    return this.sanidadService.findAplicacionesByLote(loteId);
  }

  @Get('aplicaciones/programa/:programaId')
  @Roles('ADMIN', 'GERENTE', 'CONTADOR')
  findAplicacionesByPrograma(@Param('programaId') programaSanitarioId: string) {
    return this.sanidadService.findAplicacionesByPrograma(programaSanitarioId);
  }

  @Patch('aplicaciones/:id')
  @Roles('ADMIN', 'GERENTE')
  updateAplicacion(
    @Param('id') id: string,
    @Body() updateAplicacionDto: Partial<CreateAplicacionSanitariaDto>
  ) {
    return this.sanidadService.updateAplicacion(id, updateAplicacionDto);
  }

  @Delete('aplicaciones/:id')
  @Roles('ADMIN')
  removeAplicacion(@Param('id') id: string) {
    return this.sanidadService.removeAplicacion(id);
  }

  // Utilidades y Reportes
  @Get('historial/:loteId')
  @Roles('ADMIN', 'GERENTE', 'CONTADOR')
  getHistorialSanitarioLote(@Param('loteId') loteId: string) {
    return this.sanidadService.getHistorialSanitarioLote(loteId);
  }

  @Get('calendario/:loteId')
  @Roles('ADMIN', 'GERENTE', 'GALPONERO', 'CONTADOR')
  getCalendarioSanitario(@Param('loteId') loteId: string) {
    return this.sanidadService.getCalendarioSanitario(loteId);
  }

  @Get('reporte/:loteId')
  @Roles('ADMIN', 'GERENTE', 'CONTADOR')
  getReporteSanidad(
    @Param('loteId') loteId: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string
  ) {
    const inicio = fechaInicio ? new Date(fechaInicio) : undefined;
    const fin = fechaFin ? new Date(fechaFin) : undefined;
    
    return this.sanidadService.getReporteSanidad(loteId, inicio, fin);
  }
}
