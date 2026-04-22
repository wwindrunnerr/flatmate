export default function PencilIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#1f1b2d"
      strokeWidth="2"
      width="20"
      height="20"
      className={className}
    >
      <path
        d="M4 20h4l10-10-4-4L4 16v4z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 7l4 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}