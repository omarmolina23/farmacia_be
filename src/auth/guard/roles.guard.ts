import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true; // Si no se requieren roles, permite el acceso

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('Usuario en request:', user); // 👀 Verifica qué llega en request.user

    if (!user) {
      throw new ForbiddenException('No estás autenticado');
    }

    // Verificar si el usuario tiene al menos uno de los roles requeridos
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
