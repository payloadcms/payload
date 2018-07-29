import React from 'react';

import './Tooltip.css';

export default (props) => {

	let className = props.className ? `tooltip ${props.className}` : 'tooltip';

	return (
		<aside className={className}>
			{props.children}
			<span></span>
		</aside>
	);
}