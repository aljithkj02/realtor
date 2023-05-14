import { ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { UserType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';

interface SignupParams {
    name: string;
    email: string;
    phone: string;
    password: string;
}

interface SinginParams {
    email: string;
    password: string;
}

interface ProductKeyParams {
    email: string;
    userType: UserType
}

@Injectable()
export class AuthService {

    constructor(private readonly prismaService: PrismaService) { };

    private generateToken(name: string, id: number) {
        return jwt.sign({
            name,
            id
        }, process.env.JSON_TOKEN_KEY, {
            expiresIn: 3600000
        })
    }

    async signup({ name, email, phone, password }: SignupParams, userType: UserType) {
        const userExists = await this.prismaService.user.findUnique({
            where: {
                email
            }
        })

        if (userExists) {
            throw new ConflictException({
                status: false,
                message: 'User with this email already exist!!'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);


        const user = await this.prismaService.user.create({
            data: {
                name,
                email,
                phone,
                password: hashedPassword,
                user_type: userType
            }
        })

        const token = await this.generateToken(name, user.id);

        return {
            status: true,
            token
        };
    }

    async signin({ email, password }: SinginParams) {
        const user = await this.prismaService.user.findUnique({
            where: {
                email
            }
        })

        if (!user) {
            throw new HttpException("User Not Found!!", 400);
        }

        const hashedPassword = user.password;

        const isValidPassword = await bcrypt.compare(password, hashedPassword);

        if (!isValidPassword) {
            throw new HttpException("Invalid password!!", 400);
        }

        const token = await this.generateToken(user.name, user.id);
        return {
            status: true,
            token
        };
    }

    generateProductKey({ email, userType }: ProductKeyParams) {
        const string = `${email}-${userType}-${process.env.PRODUCT_KEY_SECRET}`;

        return bcrypt.hash(string, 10);
    }
}
