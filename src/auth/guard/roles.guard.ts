import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true; 

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No estás autenticado');
    }

    const hasRole = requiredRoles.some((role) => {
      if (role === 'admin') return user.isAdmin;
      if (role === 'employee') return user.isEmployee;
      return false;
    });

    if (!hasRole) {
      throw new ForbiddenException('Not enough permissions');
    }

    return true;
  }
}
