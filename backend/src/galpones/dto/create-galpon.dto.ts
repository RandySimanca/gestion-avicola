export class CreateGalponDto {
  finca_id: string;
  nombre: string;
  capacidad_max: number;
  tipo_ave_principal: 'ENGORDE' | 'PONEDORA';
}
