import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.page.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(slug: string) {
    const page = await this.prisma.page.findUnique({
      where: { slug },
    });

    if (!page) {
      throw new NotFoundException(`Page with slug "${slug}" not found`);
    }

    return page;
  }

  async create(createPageDto: CreatePageDto) {
    return this.prisma.page.create({
      data: createPageDto,
    });
  }

  async update(slug: string, updatePageDto: UpdatePageDto) {
    const page = await this.findOne(slug);

    return this.prisma.page.update({
      where: { slug },
      data: updatePageDto,
    });
  }

  async remove(slug: string) {
    const page = await this.findOne(slug);
    
    return this.prisma.page.delete({
      where: { slug },
    });
  }
}

