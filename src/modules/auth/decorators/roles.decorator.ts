// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRoleAdmin, UserRoleGroup } from 'modules/users/schemas/user.scheme';

// Tên của metadata key
export const ROLES_KEY = 'roles';

// Decorator @Roles() sẽ nhận vào các vai trò
// Ví dụ: @role_admin(UserRoleAdmin.SUPER_ADMIN) 
// @role_group(UserRoleGroup.MANAGER, UserRoleGroup.MEMBER)
export const Roles = (...roles: (UserRoleAdmin | UserRoleGroup)[]) =>
SetMetadata(ROLES_KEY, roles);