import { useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai';
import { authTokenAtom, userDataAtom, isAuthenticatedAtom } from '@/lib/state/atoms/authAtoms';

export const useLogout = () => {
	const setAuthToken = useSetAtom(authTokenAtom);
	const setUserData = useSetAtom(userDataAtom);
	const setIsAuthenticated = useSetAtom(isAuthenticatedAtom);
	const navigate = useNavigate();

	const logout = () => {
		// Clear auth-related atoms
		setAuthToken(null);
		setUserData({
			id: null,
			email: null,
			firstName: null,
			lastName: null,
			name: null,
			role: null
		});
		setIsAuthenticated(false);

		navigate('/auth/login', { replace: true });
	};

	return logout;
};
