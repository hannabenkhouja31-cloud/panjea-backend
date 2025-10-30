export class PaginatedTripsQueryDto {
  page?: number = 1;
  limit?: number = 15;
  sortBy?: 'createdAt' | 'budgetEur' = 'createdAt';
  order?: 'asc' | 'desc' = 'desc';
}

export interface PaginatedTripsResponse {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}