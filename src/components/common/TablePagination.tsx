import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TablePaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeOptions?: boolean;
  className?: string;
}

const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50],
  showPageSizeOptions = true,
  className,
}) => {
  // Calculate start and end item numbers
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const maxPageButtons = 5; // Maximum number of page buttons to show
    
    if (totalPages <= maxPageButtons) {
      // Show all pages if there are few pages
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Calculate range to show
    const leftSiblingIndex = Math.max(currentPage - 1, 1);
    const rightSiblingIndex = Math.min(currentPage + 1, totalPages);
    
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
      const middleRange = [leftSiblingIndex, currentPage, rightSiblingIndex];
      return [1, ...middleRange, totalPages];
    } else {
      // Show all pages (shouldn't reach here based on earlier condition)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 py-4", className)}>
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{startItem}</span> to{" "}
        <span className="font-medium">{endItem}</span> of{" "}
        <span className="font-medium">{totalItems}</span> items
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Page size selector */}
        {showPageSizeOptions && (
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">Rows per page</p>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Navigation buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          
          {/* Page number buttons */}
          <div className="hidden sm:flex items-center space-x-1">
            {pageNumbers.map((pageNumber, index) => {
              // Check if we need to render ellipsis
              const showEllipsisLeft = index === 1 && pageNumber > 2;
              const showEllipsisRight = index === pageNumbers.length - 2 && pageNumber < totalPages - 1;
              
              return (
                <React.Fragment key={pageNumber}>
                  {showEllipsisLeft && (
                    <span className="px-2 text-muted-foreground">...</span>
                  )}
                  <Button
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                  {showEllipsisRight && (
                    <span className="px-2 text-muted-foreground">...</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          
          {/* Mobile page indicator */}
          <span className="sm:hidden text-sm">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last page</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TablePagination; 