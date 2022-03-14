import * as React from 'react';

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import buttonBase from '../base/buttonBase';

test('buttonBase check element', () => {
	const butObj = {
		id: 'button',
		name: 'button'
	};
	render(buttonBase.buttonBase.test(butObj));
	const linkElement = document.getElementById(butObj.id); //screen.getByTestId('Button');
	expect(linkElement).toBeInTheDocument();
});
