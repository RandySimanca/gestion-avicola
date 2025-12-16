import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { GalponesService } from './galpones.service';
import { CreateGalponDto } from './dto/create-galpon.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('galpones')
@UseGuards(AuthGuard, RolesGuard)
export class GalponesController {
  constructor(private readonly galponesService: GalponesService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createGalponDto: CreateGalponDto) {
    return this.galponesService.create(createGalponDto);
  }

  @Get()
  @Roles('ADMIN', 'GERENTE', 'GALPONERO')
  findAll() {
    return this.galponesService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'GERENTE', 'GALPONERO')
  findOne(@Param('id') id: string) {
    return this.galponesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateGalponDto: Partial<CreateGalponDto>) {
    return this.galponesService.update(id, updateGalponDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.galponesService.remove(id);
  }
}
