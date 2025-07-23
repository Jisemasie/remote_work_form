import { useState, useEffect } from 'react';

interface PaginationProps<T> {
  data: T[];
  initialItemsPerPage?: number;
  itemsPerPageOptions?: number[];
  render: (paginatedData: T[]) => React.ReactNode;
  textDisplay?: (start: number, end: number, total: number) => string;
  previousText?: string;
  nextText?: string;
  maxVisiblePages?: number;
  className?: string;
  itemsPerPageLabel?: string;
  initialPage?: number; // New prop for initial page position
}

export function Pagination<T>({
  data,
  initialItemsPerPage = 10,
  itemsPerPageOptions = [5, 10, 20, 50, 100],
  render,
  textDisplay = (start, end, total) => `Showing ${start} to ${end} of ${total}`,
  previousText = 'Previous',
  nextText = 'Next',
  maxVisiblePages = 5,
  className = '',
  itemsPerPageLabel = 'Items per page:',
  initialPage = 1, // Default to 1 if not provided
}: PaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  
  // Reset to first page if data changes
  useEffect(() => {
    setCurrentPage(initialPage);
  }, [data, initialPage]);

  // Calculate pagination values
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const paginate = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = Number(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let startPage: number, endPage: number;
    
    if (currentPage <= Math.ceil(maxVisiblePages / 2)) {
      startPage = 1;
      endPage = maxVisiblePages;
    } else if (currentPage + Math.floor(maxVisiblePages / 2) >= totalPages) {
      startPage = totalPages - maxVisiblePages + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - Math.floor(maxVisiblePages / 2);
      endPage = currentPage + Math.floor(maxVisiblePages / 2);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  // Always show pagination controls if there's data
  const shouldShowPagination = data.length > 0;

  // Ensure current page is within valid range
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className={className}>
      {/* Render the paginated data */}
      {render(currentItems)}
      
      {/* Pagination controls - always show if there's data */}
      {shouldShowPagination && (
        <div className="flex flex-col gap-4 mt-4">
          {/* Items per page selector */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <label htmlFor="itemsPerPage">{itemsPerPageLabel}</label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="border rounded px-2 py-1"
              >
                {itemsPerPageOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Page info and navigation */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="text-gray-500 text-sm">
                {textDisplay(
                  indexOfFirstItem + 1,
                  Math.min(indexOfLastItem, totalItems),
                  totalItems
                )}
              </div>
              
              <div className="flex gap-1">
                {/* Previous button */}
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {previousText}
                </button>
                
                {/* Page numbers */}
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`px-3 py-1 rounded min-w-[2.5rem] ${
                      currentPage === pageNum 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                
                {/* Next button */}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {nextText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}