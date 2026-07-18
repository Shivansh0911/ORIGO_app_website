interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  ring?: boolean;
}

export default function Avatar({ src, name, size = 40, ring = false }: AvatarProps) {
  const initial = name?.charAt(0).toUpperCase() ?? '?';
  const ringClass = ring ? 'ring-2 ring-primary ring-offset-2 ring-offset-bg' : '';

  return src ? (
    <img
      src={src}
      alt={name}
      style={{ width: size, height: size }}
      className={`rounded-full object-cover shrink-0 ${ringClass}`}
    />
  ) : (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={`rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold shrink-0 ${ringClass}`}
    >
      {initial}
    </div>
  );
}
