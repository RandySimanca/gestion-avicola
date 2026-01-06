import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('ventas')
@UseGuards(AuthGuard, RolesGuard)
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Post()
  @Roles('ADMIN', 'GERENTE', 'GALPONERO')
  create(@Body() createVentaDto: CreateVentaDto) {
    return this.ventasService.create(createVentaDto);
  }

  @Get()
  @Roles('ADMIN', 'GERENTE', 'CONTADOR', 'GALPONERO')
  findAll() {
    return this.ventasService.findAll();
  }

  @Get('lote/:loteId')
  @Roles('ADMIN', 'GERENTE', 'CONTADOR', 'GALPONERO')
  findByLote(@Param('loteId') loteId: string) {
    return this.ventasService.findByLote(loteId);
  }
}
