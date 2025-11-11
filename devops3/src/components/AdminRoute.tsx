import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type Props = { children: React.ReactElement };

export default function AdminRoute({ children }: Props) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || user.role.toUpperCase() !== "ADMIN") {
    return <Navigate to="/" replace />;
  }
  return children;
}
