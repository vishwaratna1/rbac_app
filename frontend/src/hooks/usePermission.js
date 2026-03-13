import { useAuth } from '../context/AuthContext';

export default function usePermission(resource, action) {
  const { hasPermission, getScope } = useAuth();
  return {
    allowed: hasPermission(resource, action),
    scope: getScope(resource, action),
  };
}
