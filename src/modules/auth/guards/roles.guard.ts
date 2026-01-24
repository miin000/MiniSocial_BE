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
            return false;
        }

        /**
         * Ví dụ user:
         * user.adminRole?: UserRoleAdmin
         * user.groupRole?: UserRoleGroup
         */
        const userRoles: AppRole[] = [
            user.adminRole,
            user.groupRole,
        ].filter(Boolean);

        return requiredRoles.some((role) =>
            userRoles.includes(role),
        );
    }
}