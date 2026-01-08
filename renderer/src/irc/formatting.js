const IRC_COLOR_CLASSES = [
	{
		text: '!text-red-600 dark:!text-red-400',
		bg: 'bg-red-200/70 dark:bg-red-900/40',
	},
	{
		text: '!text-orange-600 dark:!text-orange-400',
		bg: 'bg-orange-200/70 dark:bg-orange-900/40',
	},
	{
		text: '!text-amber-600 dark:!text-amber-400',
		bg: 'bg-amber-200/70 dark:bg-amber-900/40',
	},
	{
		text: '!text-yellow-600 dark:!text-yellow-300',
		bg: 'bg-yellow-200/70 dark:bg-yellow-900/40',
	},
	{
		text: '!text-lime-600 dark:!text-lime-400',
		bg: 'bg-lime-200/70 dark:bg-lime-900/40',
	},
	{
		text: '!text-green-600 dark:!text-green-400',
		bg: 'bg-green-200/70 dark:bg-green-900/40',
	},
	{
		text: '!text-emerald-600 dark:!text-emerald-400',
		bg: 'bg-emerald-200/70 dark:bg-emerald-900/40',
	},
	{
		text: '!text-teal-600 dark:!text-teal-400',
		bg: 'bg-teal-200/70 dark:bg-teal-900/40',
	},
	{
		text: '!text-cyan-600 dark:!text-cyan-400',
		bg: 'bg-cyan-200/70 dark:bg-cyan-900/40',
	},
	{
		text: '!text-sky-600 dark:!text-sky-400',
		bg: 'bg-sky-200/70 dark:bg-sky-900/40',
	},
	{
		text: '!text-blue-600 dark:!text-blue-400',
		bg: 'bg-blue-200/70 dark:bg-blue-900/40',
	},
	{
		text: '!text-indigo-600 dark:!text-indigo-400',
		bg: 'bg-indigo-200/70 dark:bg-indigo-900/40',
	},
	{
		text: '!text-violet-600 dark:!text-violet-400',
		bg: 'bg-violet-200/70 dark:bg-violet-900/40',
	},
	{
		text: '!text-purple-600 dark:!text-purple-400',
		bg: 'bg-purple-200/70 dark:bg-purple-900/40',
	},
	{
		text: '!text-fuchsia-600 dark:!text-fuchsia-400',
		bg: 'bg-fuchsia-200/70 dark:bg-fuchsia-900/40',
	},
	{
		text: '!text-pink-600 dark:!text-pink-400',
		bg: 'bg-pink-200/70 dark:bg-pink-900/40',
	},
	{
		text: '!text-rose-600 dark:!text-rose-400',
		bg: 'bg-rose-200/70 dark:bg-rose-900/40',
	},
	{
		text: '!text-red-700 dark:!text-red-300',
		bg: 'bg-red-300/70 dark:bg-red-800/50',
	},
	{
		text: '!text-amber-700 dark:!text-amber-300',
		bg: 'bg-amber-300/70 dark:bg-amber-800/50',
	},
	{
		text: '!text-green-700 dark:!text-green-300',
		bg: 'bg-green-300/70 dark:bg-green-800/50',
	},
	{
		text: '!text-emerald-700 dark:!text-emerald-300',
		bg: 'bg-emerald-300/70 dark:bg-emerald-800/50',
	},
	{
		text: '!text-blue-700 dark:!text-blue-300',
		bg: 'bg-blue-300/70 dark:bg-blue-800/50',
	},
	{
		text: '!text-indigo-700 dark:!text-indigo-300',
		bg: 'bg-indigo-300/70 dark:bg-indigo-800/50',
	},
	{
		text: '!text-purple-700 dark:!text-purple-300',
		bg: 'bg-purple-300/70 dark:bg-purple-800/50',
	},
];

const CONTROL = {
	bold: '\u0002',
	italic: '\u001d',
	underline: '\u001f',
	reset: '\u000f',
	color: '\u0003',
};

const STRIP_COLOR_REGEX = new RegExp(
	`${String.fromCharCode(3)}(\\d{1,2}(,\\d{1,2})?)?`,
	'g'
);
const STRIP_CONTROL_REGEX = new RegExp(
	`[${[2, 0x1d, 0x1f, 0x0f, 0x16, 0x1e]
		.map((code) => String.fromCharCode(code))
		.join('')}]`,
	'g'
);

const readColorCode = (text, index) => {
	const slice = text.slice(index);
	const match = slice.match(/^(\d{1,2})(,(\d{1,2}))?/);
	if (!match) {
		return { fg: null, bg: null, length: 0 };
	}

	const fg = Number.parseInt(match[1], 10);
	const bg = match[3] ? Number.parseInt(match[3], 10) : null;

	return {
		fg: Number.isNaN(fg) ? null : fg,
		bg: Number.isNaN(bg) ? null : bg,
		length: match[0].length,
	};
};

const parseIrcFormatting = (text) => {
	const segments = [];
	let buffer = '';
	let bold = false;
	let italic = false;
	let underline = false;
	let fg = null;
	let bg = null;

	const flush = () => {
		if (!buffer) {
			return;
		}

		segments.push({ text: buffer, bold, italic, underline, fg, bg });
		buffer = '';
	};

	for (let i = 0; i < text.length; i += 1) {
		const char = text[i];

		if (char === CONTROL.bold) {
			flush();
			bold = !bold;
			continue;
		}

		if (char === CONTROL.italic) {
			flush();
			italic = !italic;
			continue;
		}

		if (char === CONTROL.underline) {
			flush();
			underline = !underline;
			continue;
		}

		if (char === CONTROL.reset) {
			flush();
			bold = false;
			italic = false;
			underline = false;
			fg = null;
			bg = null;
			continue;
		}

		if (char === CONTROL.color) {
			flush();
			const {
				fg: nextFg,
				bg: nextBg,
				length,
			} = readColorCode(text, i + 1);
			if (length === 0) {
				fg = null;
				bg = null;
			} else {
				fg = nextFg;
				bg = nextBg;
				i += length;
			}
			continue;
		}

		buffer += char;
	}

	flush();
	return segments;
};

const getIrcColorClasses = (code) => {
	if (code === null || code === undefined) {
		return null;
	}

	return IRC_COLOR_CLASSES[code] || null;
};

const stripIrcFormatting = (text) => {
	if (!text) {
		return '';
	}

	const raw = String(text);
	const withoutColors = raw.replace(STRIP_COLOR_REGEX, '');
	return withoutColors.replace(STRIP_CONTROL_REGEX, '');
};

const getNickColorClasses = (nick) => {
	if (!nick) return null;
	let hash = 0;
	for (let i = 0; i < nick.length; i++) {
		hash = nick.charCodeAt(i) + ((hash << 5) - hash);
	}

	const paletteSize = IRC_COLOR_CLASSES.length;
	if (!paletteSize) return null;
	const index = Math.abs(hash) % paletteSize;
	return IRC_COLOR_CLASSES[index];
};

export {
	parseIrcFormatting,
	getIrcColorClasses,
	stripIrcFormatting,
	getNickColorClasses,
};
