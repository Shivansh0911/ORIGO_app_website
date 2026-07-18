interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon = '✨', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
      <div className="text-5xl">{icon}</div>
      <p className="text-text-primary font-semibold text-lg">{title}</p>
      {description && <p className="text-text-muted text-sm max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
