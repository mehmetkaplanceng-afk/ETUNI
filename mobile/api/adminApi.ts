import { API_URL, authFetch } from './authFetch';

export interface DashboardStats {
    totalUsers: number;
    totalEvents: number;
    activeUniversities: number;
}

export interface AdminUser {
    id: number;
    fullName: string;
    email: string;
    role: string;
    universityId: number | null;
    universityName: string | null;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const res = await authFetch(`/api/admin/dashboard-stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    const json = await res.json();
    return json.data;
};

export const searchUsers = async (query: string = ''): Promise<AdminUser[]> => {
    const q = query ? `?q=${encodeURIComponent(query)}` : '';
    const res = await authFetch(`/api/admin/search-users${q}`);
    if (!res.ok) throw new Error('Failed to search users');
    const json = await res.json();
    return json.data || [];
};

export const updateUser = async (id: number, data: { fullName: string; email: string; role: string; universityId?: number }) => {
    const res = await authFetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Update failed');
    }
    return await res.json();
};
