import { useState, useCallback, useEffect } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

interface UsePaginationResult {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  totalPages: number;
  setTotalPages: (totalPages: number) => void;
  totalItems: number;
  setTotalItems: (totalItems: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  canNextPage: boolean;
  canPrevPage: boolean;
  pageNumbers: number[];
  isFirstPage: boolean;
  isLastPage: boolean;
}

/**
 * Custom hook for handling pagination state and logic
 * @param options Pagination options
 * @returns Pagination state and helper functions
 */
export function usePagination({
  initialPage = 1,
  initialPageSize = 10,
  onPageChange,
  onPageSizeChange,
}: UsePaginationOptions = {}): UsePaginationResult {
  const [page, setPageInternal] = useState(initialPage);
  const [pageSize, setPageSizeInternal] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Ensure page is within valid range when totalPages changes
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPageInternal(totalPages);
    }
  }, [totalPages, page]);

  // Wrap setPage to ensure it's within valid range and call onPageChange callback
  const setPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setPageInternal(validPage);
    onPageChange?.(validPage);
  }, [totalPages, onPageChange]);

  // Wrap setPageSize to call onPageSizeChange callback
  const setPageSize = useCallback((newPageSize: number) => {
    setPageSizeInternal(newPageSize);
    onPageSizeChange?.(newPageSize);
  }, [onPageSizeChange]);

  // Navigation helper functions
  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }, [page, totalPages, setPage]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page, setPage]);

  const firstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages, setPage]);

  // Computed properties
  const canNextPage = page < totalPages;
  const canPrevPage = page > 1;
  const isFirstPage = page === 1;
  const isLastPage = page === totalPages;

  // Generate array of page numbers to display
  const pageNumbers = useCallback(() => {
    const maxPageButtons = 5; // Maximum number of page buttons to show
    
    if (totalPages <= maxPageButtons) {
      // Show all pages if there are few pages
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Calculate range to show
    const leftSiblingIndex = Math.max(page - 1, 1);
    const rightSiblingIndex = Math.min(page + 1, totalPages);
    
    // Calculate whether to show dots on left and right
    const showLeftDots = leftSiblingIndex > 2;
    const showRightDots = rightSiblingIndex < totalPages - 1;
    
    if (!showLeftDots && showRightDots) {
      // Show first few pages
      const leftRange = Array.from({ length: maxPageButtons - 1 }, (_, i) => i + 1);
      return [...leftRange, totalPages];
    } else if (showLeftDots && !showRightDots) {
      // Show last few pages
      const rightRange = Array.from(
        { length: maxPageButtons - 1 },
        (_, i) => totalPages - (maxPageButtons - 2) + i
      );
      return [1, ...rightRange];
    } else if (showLeftDots && showRightDots) {
      // Show pages around current page
      const middleRange = [leftSiblingIndex, page, rightSiblingIndex];
      return [1, ...middleRange, totalPages];
    } else {
      // Show all pages (shouldn't reach here based on earlier condition)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
  }, [page, totalPages]);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    totalPages,
    setTotalPages,
    totalItems,
    setTotalItems,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    canNextPage,
    canPrevPage,
    pageNumbers: pageNumbers(),
    isFirstPage,
    isLastPage,
  };
} 