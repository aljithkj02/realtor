import { Body, Controller, Param, ParseEnumPipe, Post, UnauthorizedException } from '@nestjs/common';
import { UserType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { GenerateProductKeyDto, SigninDto, SignupDto } from '../dtos/auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { }

    @Post('/signup/:usertype')
    async signup(
        @Body() signupDto: SignupDto,
        @Param('usertype', new ParseEnumPipe(UserType)) userType: UserType
    ) {
        if (userType !== UserType.BUYER) {
            if (!signupDto.productKey) {
                throw new UnauthorizedException();
            }

            const validProductKey = `${signupDto.email}-${userType}-${process.env.PRODUCT_KEY_SECRET}`;
            const isValidProductKey = await bcrypt.compare(validProductKey, signupDto.productKey);
            if (!isValidProductKey) {
                throw new UnauthorizedException();
            }
        }
        return this.authService.signup(signupDto, userType);
    }

    @Post('signin')
    signin(
        @Body() signinDto: SigninDto
    ) {
        return this.authService.signin(signinDto);
    }

    @Post('/key')
    generateProductKey(
        @Body() generateProductKeyDto: GenerateProductKeyDto
    ) {
        return this.authService.generateProductKey(generateProductKeyDto);
    }
}
