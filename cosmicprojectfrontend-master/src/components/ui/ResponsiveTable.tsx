import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableRowProps {
  children: React.ReactNode;
  className?: string;
  data?: Record<string, any>;
}

interface ResponsiveTableCellProps {
  children: React.ReactNode;
  className?: string;
  label?: string;
  isHeader?: boolean;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({ children, className }) => {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="min-w-full divide-y divide-border">
        {children}
      </table>
    </div>
  );
};

export const ResponsiveTableHeader: React.FC<ResponsiveTableHeaderProps> = ({ children, className }) => {
  return (
    <thead className={cn("bg-muted/50", className)}>
      {children}
    </thead>
  );
};

export const ResponsiveTableBody: React.FC<ResponsiveTableBodyProps> = ({ children, className }) => {
  return (
    <tbody className={cn("divide-y divide-border bg-background", className)}>
      {children}
    </tbody>
  );
};

export const ResponsiveTableRow: React.FC<ResponsiveTableRowProps> = ({ children, className, data }) => {
  return (
    <tr className={cn("hover:bg-muted/50 transition-colors", className)}>
      {children}
    </tr>
  );
};

export const ResponsiveTableCell: React.FC<ResponsiveTableCellProps> = ({ 
  children, 
  className, 
  label, 
  isHeader = false 
}) => {
  const Component = isHeader ? 'th' : 'td';
  
  return (
    <Component 
      className={cn(
        "px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base",
        isHeader && "font-medium text-muted-foreground",
        !isHeader && "text-foreground",
        // Mobile: show label before content
        !isHeader && label && "block sm:table-cell",
        !isHeader && label && "before:content-[attr(data-label)] before:block before:font-medium before:text-muted-foreground before:text-xs sm:before:hidden",
        className
      )}
      data-label={label}
    >
      {children}
    </Component>
  );
};

// Mobile-friendly table row component
export const MobileTableRow: React.FC<{
  data: Record<string, any>;
  labels: Record<string, string>;
  actions?: React.ReactNode;
  className?: string;
}> = ({ data, labels, actions, className }) => {
  return (
    <div className={cn("mobile-card space-y-3", className)}>
      {Object.entries(labels).map(([key, label]) => (
        <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <span className="mobile-text-sm font-medium text-muted-foreground sm:hidden">
              {label}:
            </span>
            <span className="mobile-text-sm sm:text-base">
              {data[key] || '-'}
            </span>
          </div>
        </div>
      ))}
      {actions && (
        <div className="flex justify-end pt-2 border-t border-border sm:border-t-0 sm:pt-0">
          {actions}
        </div>
      )}
    </div>
  );
};

// Mobile-friendly table component
export const MobileTable: React.FC<{
  data: any[];
  labels: Record<string, string>;
  renderActions?: (item: any) => React.ReactNode;
  className?: string;
}> = ({ data, labels, renderActions, className }) => {
  if (data.length === 0) {
    return (
      <div className="mobile-empty-state">
        <div className="mobile-empty-state-icon">📋</div>
        <h3 className="mobile-empty-state-title">No data available</h3>
        <p className="mobile-empty-state-description">
          There are no items to display at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {data.map((item, index) => (
        <MobileTableRow
          key={item.id || item._id || index}
          data={item}
          labels={labels}
          actions={renderActions ? renderActions(item) : undefined}
        />
      ))}
    </div>
  );
}; 