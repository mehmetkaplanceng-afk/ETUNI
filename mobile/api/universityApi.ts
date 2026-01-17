import { API_URL } from './authFetch';

export interface University {
    id: number;
    name: string;
}

export const getUniversities = async (): Promise<University[]> => {
    const res = await fetch(`${API_URL}/api/universities`);
    if (!res.ok) throw new Error('Failed to fetch universities');
    const json = await res.json();
    return json.data || [];
};
