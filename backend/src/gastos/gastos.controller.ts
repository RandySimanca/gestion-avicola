import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { GastosService } from './gastos.service';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { UpdateGastoDto } from './dto/update-gasto.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('gastos')
@UseGuards(AuthGuard, RolesGuard)
export class GastosController {
  constructor(private readonly gastosService: GastosService) {}

  @Post()
  @Roles('ADMIN', 'GERENTE', 'GALPONERO')
  create(@Body() createGastoDto: CreateGastoDto) {
    return this.gastosService.create(createGastoDto);
  }

  @Get()
  @Roles('ADMIN', 'GERENTE', 'CONTADOR')
  findAll(@Query('loteId') loteId?: string) {
    if (loteId) {
      return this.gastosService.findByLote(loteId);
    }
    return this.gastosService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'GERENTE', 'CONTADOR')
  findOne(@Param('id') id: string) {
    return this.gastosService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'GERENTE')
  update(@Param('id') id: string, @Body() updateGastoDto: UpdateGastoDto) {
    return this.gastosService.update(id, updateGastoDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.gastosService.remove(id);
  }
}
