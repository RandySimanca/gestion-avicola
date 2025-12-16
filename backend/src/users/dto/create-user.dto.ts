export class CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'GERENTE' | 'GALPONERO' | 'CONTADOR';
}
