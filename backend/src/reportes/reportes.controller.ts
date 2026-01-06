import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('reportes')
@UseGuards(AuthGuard, RolesGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('contable/:loteId')
  @Roles('ADMIN', 'GERENTE', 'CONTADOR')
  getResumenContable(@Param('loteId') loteId: string) {
    return this.reportesService.getResumenContable(loteId);
  }

  @Get('global')
  @Roles('ADMIN', 'GERENTE', 'CONTADOR')
  getResumenGlobal() {
    return this.reportesService.getResumenGlobal();
  }
}
