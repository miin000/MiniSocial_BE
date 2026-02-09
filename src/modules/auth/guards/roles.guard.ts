// src/auth/guards/roles.guard.ts
import {
    Injectable,
    CanActivate,
    ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import {
    UserRoleAdmin,
    UserRoleGroup,
} from 'modules/users/schemas/user.scheme';

type AppRole = UserRoleAdmin | UserRoleGroup;

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles =
            this.reflector.getAllAndOverride<AppRole[]>(
                ROLES_KEY,
                [context.getHandler(), context.getClass()],
            );

        // Không có @Roles → cho qua
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            console.log('❌ RolesGuard: No user in request');
            return false;
        }

        /**
         * Lấy tất cả roles từ user (roles_admin và roles_group là arrays)
         */
        const userRoles: AppRole[] = [
            ...(user.roles_admin || []),
            ...(user.roles_group || []),
        ];

        console.log('🔒 RolesGuard Check:');
        console.log('  Required roles:', requiredRoles);
        console.log('  User:', user.username || user.email);
        console.log('  User roles_admin:', user.roles_admin);
        console.log('  User roles_group:', user.roles_group);
        console.log('  Combined roles:', userRoles);
        console.log('  Access granted:', requiredRoles.some((role) => userRoles.includes(role)));

        return requiredRoles.some((role) =>
            userRoles.includes(role),
        );
    }
}