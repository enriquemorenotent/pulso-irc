import { useEffect } from 'react';

const Modal = ({ children, onClose, title, inline = false }) => {
	useEffect(() => {
		if (inline || !onClose) return;
		const handleEsc = (e) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleEsc);
		return () => window.removeEventListener('keydown', handleEsc);
	}, [onClose, inline]);

	if (inline) {
		return (
			<div className="flex-1 flex items-center justify-center p-4 bg-neutral-100/50 overflow-hidden dark:bg-neutral-900">
				<div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden flex flex-col max-h-full border border-neutral-200/50 dark:bg-neutral-950 dark:border-neutral-800">
					<div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-white dark:bg-neutral-900 dark:border-neutral-800">
						<h2 className="text-base font-bold text-neutral-900 dark:text-white">
							{title}
						</h2>
					</div>
					<div className="overflow-y-auto">{children}</div>
				</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 dark:bg-black/70">
			<div
				className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-neutral-200/50 dark:bg-neutral-900 dark:border-neutral-800"
				role="dialog"
				aria-modal="true"
			>
				<div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-white dark:bg-neutral-900 dark:border-neutral-800">
					<h2 className="text-base font-bold text-neutral-900 dark:text-white">
						{title}
					</h2>
					{onClose && (
						<button
							onClick={onClose}
							className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors cursor-pointer dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
							aria-label="Close"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<line x1="18" y1="6" x2="6" y2="18"></line>
								<line x1="6" y1="6" x2="18" y2="18"></line>
							</svg>
						</button>
					)}
				</div>
				<div className="overflow-y-auto bg-white dark:bg-neutral-950">
					{children}
				</div>
			</div>
			<div
				className="absolute inset-0 -z-10 cursor-pointer"
				onClick={onClose}
			></div>
		</div>
	);
};

export { Modal };
