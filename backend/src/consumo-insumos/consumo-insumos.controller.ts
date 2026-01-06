import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ConsumoInsumosService } from './consumo-insumos.service';
import { CreateConsumoInsumoDto } from './dto/create-consumo-insumo.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('consumo-insumos')
@UseGuards(AuthGuard, RolesGuard)
export class ConsumoInsumosController {
  constructor(private readonly consumoInsumosService: ConsumoInsumosService) {}

  @Post()
  @Roles('ADMIN', 'GERENTE', 'GALPONERO')
  create(@Body() createConsumoInsumoDto: CreateConsumoInsumoDto) {
    return this.consumoInsumosService.create(createConsumoInsumoDto);
  }

  @Get()
  @Roles('ADMIN', 'GERENTE', 'CONTADOR')
  findAll() {
    return this.consumoInsumosService.findAll();
  }

  @Get('lote/:loteId')
  @Roles('ADMIN', 'GERENTE', 'CONTADOR', 'GALPONERO')
  findByLote(@Param('loteId') loteId: string) {
    return this.consumoInsumosService.findByLote(loteId);
  }
}
