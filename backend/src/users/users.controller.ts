import { Controller, Get, Post, Body, UseGuards, Patch, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('ADMIN', 'GERENTE')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('pending')
  @Roles('ADMIN')
  getPendingUsers() {
    return this.usersService.getPendingUsers();
  }

  @Patch(':id/approve')
  @Roles('ADMIN')
  approveUser(@Param('id') id: string) {
    return this.usersService.approveUser(id);
  }

  @Patch(':id/reject')
  @Roles('ADMIN')
  rejectUser(@Param('id') id: string) {
    return this.usersService.rejectUser(id);
  }

  @Patch(':id/toggle')
  @Roles('ADMIN')
  toggleUserStatus(@Param('id') id: string) {
    return this.usersService.toggleUserStatus(id);
  }

  @Patch(':id/role')
  @Roles('ADMIN')
  updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.usersService.updateRole(id, role);
  }

  @Post(':id/delete') // Usamos Post o Delete, pero como los otros son Patch/Post...
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
