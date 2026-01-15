import type { IPagination } from "./interfaces";

export const paginateData = <T>(data: T[], pagination: IPagination): T[] => {
  const {page, pageSize} = pagination
  const startIndex = (page - 1) * pageSize;
  return data.slice(startIndex, startIndex + pageSize);
}
