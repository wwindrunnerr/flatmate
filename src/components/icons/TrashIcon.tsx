export default function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="#1f1b2d"
      strokeWidth={1.8}
      width="20"
      height="20"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0l1 11a1 1 0 001 1h6a1 1 0 001-1l1-11"
      />
    </svg>
  );
}