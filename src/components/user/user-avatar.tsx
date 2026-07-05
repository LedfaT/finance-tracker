import type { TelegramWebAppUser } from "../../lib/telegram";

interface UserAvatarProps {
  initials: string;
  user?: TelegramWebAppUser;
}

export const UserAvatar = ({ initials, user }: UserAvatarProps) => {
  if (user?.photo_url) {
    return <img src={user.photo_url} alt="" />;
  }

  return <div className="avatar">{initials}</div>;
};
