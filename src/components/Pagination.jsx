const Pagination = ({ currentPage, totalCount, pageSize, onPageChange }) => {
  // Return null if there's only one page or less
  if (totalCount <= pageSize) {
    return null;
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  // Generate page numbers with ellipsis logic
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7; // Maximum visible page numbers

    if (totalPages <= maxVisible) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're near the start
      if (currentPage <= 3) {
        endPage = Math.min(5, totalPages - 1);
        startPage = 2;
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 4);
        endPage = totalPages - 1;
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push('ellipsis-start');
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-end');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      {/* Previous Button */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded-lg border ${
          currentPage === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
        }`}
      >
        السابق
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded-lg border ${
                page === currentPage
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 rounded-lg border ${
          currentPage === totalPages
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
        }`}
      >
        التالي
      </button>
    </div>
  );
};

export default Pagination;

