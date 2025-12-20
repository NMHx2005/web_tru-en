import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  async search(
    @Query('q') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categories') categories?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    if (!query || query.trim().length < 2) {
      return {
        data: [],
        meta: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    return this.searchService.searchStories(query, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      categories: categories ? categories.split(',').filter(Boolean) : undefined,
      status,
      sortBy,
    });
  }

  @Public()
  @Get('suggestions')
  async getSuggestions(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    return this.searchService.getSuggestions(query, limit ? parseInt(limit, 10) : 10);
  }
}

