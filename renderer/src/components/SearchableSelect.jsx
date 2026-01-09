import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import { inputClass } from '../ui/classes.js';

/**
 * A searchable dropdown select component.
 * Displays a text input that filters options, with a dropdown list below.
 */
const SearchableSelect = ({
	options,
	value,
	onChange,
	placeholder = 'Select...',
	renderOption,
	getOptionLabel = (opt) => opt.label,
	getOptionValue = (opt) => opt.value,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState('');
	const [dropdownStyle, setDropdownStyle] = useState(null);
	const containerRef = useRef(null);
	const inputRef = useRef(null);
	const dropdownRef = useRef(null);

	const selectedOption = options.find((opt) => getOptionValue(opt) === value);
	const displayValue = selectedOption ? getOptionLabel(selectedOption) : '';

	const filteredOptions = search
		? options.filter((opt) =>
				getOptionLabel(opt).toLowerCase().includes(search.toLowerCase())
		  )
		: options;

	const updateDropdownPosition = () => {
		if (!containerRef.current) {
			return;
		}

		const rect = containerRef.current.getBoundingClientRect();
		const viewportHeight =
			window.innerHeight || document.documentElement.clientHeight;
		const spaceBelow = viewportHeight - rect.bottom;
		const spaceAbove = rect.top;
		const preferAbove = spaceBelow < 240 && spaceAbove > spaceBelow;
		const spacing = 8;
		const availableSpace = Math.max(
			0,
			(preferAbove ? spaceAbove : spaceBelow) - spacing
		);
		const maxHeight =
			availableSpace < 140 ? availableSpace : Math.min(320, availableSpace);

		const base = {
			position: 'fixed',
			left: rect.left,
			width: rect.width,
			zIndex: 60,
			maxHeight,
		};

		if (preferAbove) {
			setDropdownStyle({
				...base,
				bottom: viewportHeight - rect.top + spacing,
			});
			return;
		}

		setDropdownStyle({
			...base,
			top: rect.bottom + spacing,
		});
	};

	useLayoutEffect(() => {
		if (!isOpen) {
			return;
		}
		updateDropdownPosition();
	}, [isOpen, search, filteredOptions.length]);

	useEffect(() => {
		if (!isOpen) {
			return () => {};
		}

		const handleWindowChange = () => updateDropdownPosition();
		window.addEventListener('resize', handleWindowChange);
		window.addEventListener('scroll', handleWindowChange, true);

		return () => {
			window.removeEventListener('resize', handleWindowChange);
			window.removeEventListener('scroll', handleWindowChange, true);
		};
	}, [isOpen]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			const container = containerRef.current;
			const dropdown = dropdownRef.current;
			if (container && container.contains(event.target)) {
				return;
			}
			if (dropdown && dropdown.contains(event.target)) {
				return;
			}
			setIsOpen(false);
			setSearch('');
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () =>
			document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleInputChange = (e) => {
		setSearch(e.target.value);
		if (!isOpen) {
			setIsOpen(true);
		}
	};

	const handleInputFocus = () => {
		setIsOpen(true);
		setSearch('');
	};

	const handleSelect = (opt) => {
		onChange(getOptionValue(opt));
		setIsOpen(false);
		setSearch('');
		inputRef.current?.blur();
	};

	const handleKeyDown = (e) => {
		if (e.key === 'Escape') {
			setIsOpen(false);
			setSearch('');
			inputRef.current?.blur();
		} else if (e.key === 'Enter' && filteredOptions.length === 1) {
			handleSelect(filteredOptions[0]);
		}
	};

	return (
		<div ref={containerRef} className="relative">
			<div className="relative">
				<input
					ref={inputRef}
					type="text"
					className={`${inputClass} pr-8`}
					placeholder={placeholder}
					value={isOpen ? search : displayValue}
					onChange={handleInputChange}
					onFocus={handleInputFocus}
					onKeyDown={handleKeyDown}
				/>
				<button
					type="button"
					onClick={() => {
						if (isOpen) {
							setIsOpen(false);
							setSearch('');
						} else {
							inputRef.current?.focus();
						}
					}}
					className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
					tabIndex={-1}
				>
					<ChevronDown
						className={`w-5 h-5 transition-transform ${
							isOpen ? 'rotate-180' : ''
						}`}
					/>
				</button>
			</div>

			{isOpen && dropdownStyle
				? createPortal(
						<div
							ref={dropdownRef}
							style={dropdownStyle}
							className="bg-white border border-neutral-200 rounded-xl shadow-lg overflow-y-auto dark:bg-neutral-800 dark:border-neutral-700"
						>
							{filteredOptions.length === 0 ? (
								<div className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
									No matches found
								</div>
							) : (
								filteredOptions.map((opt) => {
									const optValue = getOptionValue(opt);
									const isSelected = optValue === value;
									return (
										<button
											key={optValue}
											type="button"
											onMouseDown={(event) => {
												event.preventDefault();
												handleSelect(opt);
											}}
											className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
												isSelected
													? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
													: 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700/50'
											}`}
										>
											{renderOption
												? renderOption(opt, isSelected)
												: getOptionLabel(opt)}
										</button>
									);
								})
							)}
						</div>,
						document.body
				  )
				: null}
		</div>
	);
};

export { SearchableSelect };
