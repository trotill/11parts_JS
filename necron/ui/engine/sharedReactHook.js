import { useCallback, useState } from 'react';

export function useForceUpdate() {
	const [, updateState] = useState();
	return useCallback(() => updateState({}), []);
}
