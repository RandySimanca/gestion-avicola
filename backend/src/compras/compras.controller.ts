import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ComprasService } from './compras.service';
import { CreateCompraDto } from './dto/create-compra.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('compras')
@UseGuards(AuthGuard, RolesGuard)
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Post()
  @Roles('ADMIN', 'GERENTE', 'GALPONERO')
  create(@Body() createCompraDto: CreateCompraDto) {
    return this.comprasService.create(createCompraDto);
  }

  @Get()
  @Roles('ADMIN', 'GERENTE', 'CONTADOR')
  findAll(@Query('loteId') loteId?: string) {
    if (loteId) {
      return this.comprasService.findByLote(loteId);
    }
    return this.comprasService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'GERENTE', 'CONTADOR')
  findOne(@Param('id') id: string) {
    return this.comprasService.findOne(id);
  }
}
