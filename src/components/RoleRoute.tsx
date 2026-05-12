import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { User, UserRole } from '../models/models';

type RoleRouteProps = {
  user: User;
  allow: UserRole[];
  children: ReactNode;
};

const RoleRoute = ({ user, allow, children }: RoleRouteProps) => {
  if (!allow.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
};

export default RoleRoute;
