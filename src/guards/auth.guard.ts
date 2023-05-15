import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import * as jwt from 'jsonwebtoken';
import { PrismaService } from "src/prisma/prisma.service";

interface JWTPayload {
    name: string;
    id: number;
    iat: number;
    exp: number;
}

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(
        private readonly reflector: Reflector,
        private readonly prismaService: PrismaService
    ) { };

    async canActivate(context: ExecutionContext) {

        const roles = this.reflector.getAllAndOverride('roles', [
            context.getHandler(),
            context.getClass()
        ])

        if (roles.length) {
            const request = context.switchToHttp().getRequest();
            const token = request?.headers?.authorization?.split(' ')[1];
            try {
                const payload = await jwt.verify(token, process.env.JSON_TOKEN_KEY) as JWTPayload;
                const user = await this.prismaService.user.findUnique({
                    where: {
                        id: payload.id
                    },
                    select: {
                        user_type: true
                    }
                })

                if (!user) return false;

                return roles.includes(user.user_type);
            } catch (error) {
                return false;
            }
        }


        return true;
    }
}