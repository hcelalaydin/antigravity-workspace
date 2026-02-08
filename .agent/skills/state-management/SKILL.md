---
name: State Management
description: React state yönetimi - Zustand, React Query ve Context API
---

# State Management Skill

## Zustand (Client State)

### Kurulum
```bash
npm install zustand
```

### Store Örneği
```typescript
// src/stores/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false })
    }),
    { name: 'auth-storage' }
  )
);
```

### Kullanım
```tsx
function Header() {
  const { user, logout, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) return <LoginButton />;
  return (
    <div>
      <span>{user?.name}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## React Query (Server State)

### Kurulum
```bash
npm install @tanstack/react-query
```

### Provider Setup
```tsx
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 }
  }
});

<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

### Query Hook
```typescript
// src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useUsers = () => useQuery({
  queryKey: ['users'],
  queryFn: () => api.get('/users').then(r => r.data)
});

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserInput) => api.post('/users', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });
};
```

### Kullanım
```tsx
function UserList() {
  const { data: users, isLoading, error } = useUsers();
  const createUser = useCreateUser();

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {users.map(user => <UserCard key={user.id} user={user} />)}
      <button onClick={() => createUser.mutate({ name: 'New' })}>Add</button>
    </div>
  );
}
```

## Ne Zaman Ne Kullan?

| State Tipi | Çözüm |
|------------|-------|
| Server data (API) | React Query |
| Global UI state | Zustand |
| Form state | React Hook Form |
| Component-local | useState |
| Deep prop drilling | Context API |
