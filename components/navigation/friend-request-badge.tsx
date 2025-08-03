import { Badge } from "@/components/ui/badge";

interface FriendRequestBadgeProps {
  count: number;
}

export const FriendRequestBadge = ({ count }: FriendRequestBadgeProps) => {
  if (count === 0) return null;

  return (
    <Badge 
      variant="destructive" 
      className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
}; 