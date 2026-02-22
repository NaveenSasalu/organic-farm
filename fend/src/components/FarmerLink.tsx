"use client";

export default function FarmerLink({
  farmerId,
  children,
  className,
}: {
  farmerId: number | string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={`/farmer/${farmerId}`}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = `/farmer/${farmerId}`;
      }}
    >
      {children}
    </a>
  );
}
