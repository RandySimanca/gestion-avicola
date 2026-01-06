import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { FincasService } from './fincas.service';
import { CreateFincaDto } from './dto/create-finca.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('fincas')
@UseGuards(AuthGuard, RolesGuard)
export class FincasController {
  constructor(private readonly fincasService: FincasService) {}

  @Post()
  @Roles('ADMIN', 'GERENTE', 'GALPONERO')
  create(@Body() createFincaDto: CreateFincaDto) {
    return this.fincasService.create(createFincaDto);
  }

  @Get()
  @Roles('ADMIN', 'GERENTE', 'GALPONERO')
  findAll() {
    return this.fincasService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'GERENTE')
  findOne(@Param('id') id: string) {
    return this.fincasService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateFincaDto: Partial<CreateFincaDto>) {
    return this.fincasService.update(id, updateFincaDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'GERENTE', 'GALPONERO')
  remove(@Param('id') id: string) {
    return this.fincasService.remove(id);
  }
}
