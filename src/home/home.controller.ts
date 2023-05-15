import {
    Body,
    Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards
} from '@nestjs/common';
import { PropertyType, UserType } from '@prisma/client';
import { Roles } from 'src/decorotors/roles.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { IUserType, User } from 'src/user/decorotors/user.decorotor';
import { CreateHomeDto, HomeResponseDto, UpdateHomeDto } from './dto/home.dto';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {

    constructor(private readonly homeService: HomeService) { };

    @Get()
    getHomes(
        @Query('city') city?: string,
        @Query('minPrice') minPrice?: string,
        @Query('maxPrice') maxPrice?: string,
        @Query('propertyType') propertyType?: PropertyType
    ): Promise<HomeResponseDto[]> {

        const price = minPrice || maxPrice ? {
            ...(minPrice && { gte: parseFloat(minPrice) }),
            ...(maxPrice && { lte: parseFloat(maxPrice) })
        } : undefined

        const filters = {
            ...(city && { city }),
            ...(propertyType && { property_type: propertyType }),
            ...(price && { price })
        }
        return this.homeService.getHomes(filters);
    }

    @Get(":id")
    getHome(
        @Param('id', ParseIntPipe) id: number
    ): Promise<HomeResponseDto> {
        return this.homeService.getHome(id);
    }

    @Roles(UserType.REALTOR, UserType.ADMIN)
    @UseGuards(AuthGuard)
    @Post()
    createHome(
        @Body() createHomeDto: CreateHomeDto,
        @User() user: IUserType
    ) {
        return user;
        // return this.homeService.createHome(createHomeDto, user.id);
    }

    @Put(":id")
    updateHome(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateHomeDto: UpdateHomeDto
    ) {
        return this.homeService.updateHome(updateHomeDto, id);
    }

    @Delete(":id")
    deleteHome(
        @Param('id', ParseIntPipe) id: number
    ) {
        return this.homeService.deleteHome(id);
    }
}
