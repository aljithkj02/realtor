import { Injectable, NotFoundException } from '@nestjs/common';
import { PropertyType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { HomeResponseDto } from './dto/home.dto';

interface GetHomesParams {
    city: string,
    price?: {
        gte?: number,
        lte?: number,
    }
    property_type?: PropertyType
}

interface CreateHomeParams {
    address: string;
    numberOfBedrooms: number;
    numberOfBathrooms: number;
    city: string;
    price: number;
    landSize: number;
    propertyType: PropertyType;
    images: { url: string }[]
}

interface UpdateHomeParams {
    address?: string;
    numberOfBedrooms?: number;
    numberOfBathrooms?: number;
    city?: string;
    price?: number;
    landSize?: number;
    propertyType?: PropertyType;
}

@Injectable()
export class HomeService {

    constructor(private readonly prismaService: PrismaService) { };

    async getHomes(filters: GetHomesParams): Promise<HomeResponseDto[]> {
        const homes = await this.prismaService.home.findMany({
            select: {
                id: true,
                address: true,
                city: true,
                price: true,
                property_type: true,
                number_of_bathrooms: true,
                number_of_bedrooms: true,
                images: {
                    select: {
                        url: true
                    },
                    take: 1
                }
            },
            where: filters
        });

        if (!homes.length) {
            throw new NotFoundException();
        }

        return homes.map((home) => {
            const fetchHome = { ...home, image: home.images[0].url };
            delete fetchHome.images;
            return new HomeResponseDto(fetchHome);
        });
    }

    async getHome(id: number): Promise<HomeResponseDto> {
        const home = await this.prismaService.home.findUnique({
            where: {
                id
            }
        })
        return new HomeResponseDto(home);
    }

    async createHome({
        address,
        numberOfBathrooms,
        numberOfBedrooms,
        city,
        landSize,
        price,
        propertyType,
        images
    }: CreateHomeParams, userId: number) {
        const home = await this.prismaService.home.create({
            data: {
                address,
                number_of_bathrooms: numberOfBathrooms,
                number_of_bedrooms: numberOfBedrooms,
                property_type: propertyType,
                price,
                city,
                land_size: landSize,
                realtor_id: userId
            }
        })

        const homeImages = images.map((img) => {
            return {
                ...img,
                home_id: home.id
            }
        })

        await this.prismaService.image.createMany({
            data: homeImages
        })

        return new HomeResponseDto(home);
    }

    async updateHome(body: UpdateHomeParams, id: number) {
        const home = await this.prismaService.home.findUnique({
            where: {
                id
            }
        })

        if (!home) {
            throw new NotFoundException();
        }

        const updatedHome = await this.prismaService.home.update({
            where: {
                id
            },
            data: body
        })

        return new HomeResponseDto(updatedHome);
    }

    async deleteHome(id: number) {
        await this.prismaService.image.deleteMany({
            where: {
                home_id: id
            }
        })
        const deletedHome = await this.prismaService.home.delete({
            where: {
                id
            }
        })
        return new HomeResponseDto(deletedHome);
    }
}
