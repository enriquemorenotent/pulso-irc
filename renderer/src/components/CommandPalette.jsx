import { Hash, Terminal, User } from 'lucide-react';
import { useEffect, useRef } from 'react';

const CommandPalette = ({
	open,
	query,
	items,
	activeIndex,
	onClose,
	onInputChange,
	onInputKeyDown,
	onItemSelect,
}) => {
	const inputRef = useRef(null);

	useEffect(() => {
		if (!open) {
			return;
		}
		const focusInput = () => {
			if (inputRef.current) {
				inputRef.current.focus();
				inputRef.current.select();
			}
		};
		requestAnimationFrame(focusInput);
	}, [open]);

	if (!open) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center bg-neutral-900/50 backdrop-blur-sm p-4 pt-24 animate-in fade-in duration-150 dark:bg-black/70">
			<div
				className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-neutral-200/70 overflow-hidden animate-in zoom-in-95 duration-150 dark:bg-neutral-900 dark:border-neutral-800"
				role="dialog"
				aria-modal="true"
			>
				<div className="border-b border-neutral-200/70 px-4 py-3 dark:border-neutral-800">
					<input
						ref={inputRef}
						value={query}
						onChange={onInputChange}
						onKeyDown={onInputKeyDown}
						placeholder="Search channels, users, or type /command"
						className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500"
					/>
				</div>

				<div className="max-h-72 overflow-y-auto">
					{items.length ? (
						items.map((item, index) => {
							const isActive = index === activeIndex;
							const icon =
								item.type === 'command' ? (
									<Terminal className="w-4 h-4" />
								) : item.isChannel ? (
									<Hash className="w-4 h-4" />
								) : (
									<User className="w-4 h-4" />
								);

							return (
								<button
									key={item.id}
									type="button"
									onClick={() => onItemSelect(item)}
									className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
										isActive
											? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
											: 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800/60'
									}`}
								>
									<div className="flex items-center gap-3 min-w-0">
										<div className="text-neutral-400 dark:text-neutral-500">
											{icon}
										</div>
										<div className="min-w-0">
											<div className="font-medium truncate">
												{item.label}
											</div>
											{item.description ? (
												<div className="text-xs text-neutral-400 truncate dark:text-neutral-500">
													{item.description}
												</div>
											) : null}
										</div>
									</div>
									{item.type === 'command' && item.needsArgs ? (
										<span className="text-[10px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
											Args
										</span>
									) : null}
								</button>
							);
						})
					) : (
						<div className="px-4 py-6 text-sm text-neutral-500 dark:text-neutral-400">
							No matches found.
						</div>
					)}
				</div>

				<div className="flex items-center justify-between border-t border-neutral-200/70 px-4 py-2 text-[11px] text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
					<span>Enter to select</span>
					<span>Esc to close</span>
				</div>
			</div>
			<div className="absolute inset-0 -z-10" onClick={onClose}></div>
		</div>
	);
};

export { CommandPalette };
