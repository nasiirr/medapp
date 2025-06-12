import type React from 'react';

interface PageTitleProps {
  title: string;
  icon?: React.ReactNode;
  className?: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ title, icon, className }) => {
  return (
    <div className={`flex items-center gap-3 mb-6 ${className}`}>
      {icon}
      <h1 className="text-3xl font-headline font-semibold text-primary">{title}</h1>
    </div>
  );
};

export default PageTitle;
