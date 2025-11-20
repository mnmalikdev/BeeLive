/**
 * UI state management store
 */

import { writable } from 'svelte/store';

export interface UIState {
	sidebarOpen: boolean;
	theme: 'light' | 'dark' | 'system';
	isLoading: boolean;
	loadingMessage?: string;
	notifications: Notification[];
}

export interface Notification {
	id: string;
	type: 'success' | 'error' | 'warning' | 'info';
	message: string;
	duration?: number;
}

function createUIStore() {
	const { subscribe, set, update } = writable<UIState>({
		sidebarOpen: false,
		theme: 'system',
		isLoading: false,
		notifications: [],
	});

	return {
		subscribe,
		toggleSidebar: () => update((state) => ({ ...state, sidebarOpen: !state.sidebarOpen })),
		setSidebarOpen: (open: boolean) => update((state) => ({ ...state, sidebarOpen: open })),
		setTheme: (theme: UIState['theme']) => update((state) => ({ ...state, theme })),
		setLoading: (isLoading: boolean, message?: string) =>
			update((state) => ({ ...state, isLoading, loadingMessage: message })),
		addNotification: (notification: Omit<Notification, 'id'>) => {
			const id = crypto.randomUUID();
			update((state) => ({
				...state,
				notifications: [...state.notifications, { ...notification, id }],
			}));
			return id;
		},
		removeNotification: (id: string) =>
			update((state) => ({
				...state,
				notifications: state.notifications.filter((n) => n.id !== id),
			})),
		clearNotifications: () => update((state) => ({ ...state, notifications: [] })),
		reset: () =>
			set({
				sidebarOpen: false,
				theme: 'system',
				isLoading: false,
				notifications: [],
			}),
	};
}

export const uiStore = createUIStore();


