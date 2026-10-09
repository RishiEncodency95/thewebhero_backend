export class ApiResponse<T = unknown> {
  public success: boolean;

  constructor(
    public statusCode: number,
    public data: T,
    public message = "Success"
  ) {
    this.success = statusCode < 400;
  }
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
