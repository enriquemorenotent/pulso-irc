const FormSection = ({ title, children }) => (
	<div className="space-y-4">
		<h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 pb-2 border-b border-neutral-100 dark:border-neutral-700">
			{title}
		</h3>
		{children}
	</div>
);

export { FormSection };
