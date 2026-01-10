let audioContext = null;

const getAudioContext = () => {
	if (audioContext) {
		return audioContext;
	}
	if (typeof window === 'undefined') {
		return null;
	}
	const Context = window.AudioContext || window.webkitAudioContext;
	if (!Context) {
		return null;
	}
	try {
		audioContext = new Context();
		return audioContext;
	} catch {
		return null;
	}
};

const playBeep = (options = {}) => {
	const context = getAudioContext();
	if (!context) {
		return false;
	}

	const frequency = Math.max(200, Number(options.frequency) || 880);
	const duration = Math.max(0.05, Number(options.duration) || 0.08);
	const volume = Math.min(0.15, Math.max(0.01, Number(options.volume) || 0.05));

	try {
		if (context.state === 'suspended') {
			context.resume().catch(() => {});
		}

		const oscillator = context.createOscillator();
		const gain = context.createGain();
		const now = context.currentTime;

		oscillator.type = 'sine';
		oscillator.frequency.value = frequency;
		gain.gain.setValueAtTime(0, now);
		gain.gain.linearRampToValueAtTime(volume, now + 0.01);
		gain.gain.linearRampToValueAtTime(0, now + duration);

		oscillator.connect(gain);
		gain.connect(context.destination);

		oscillator.start(now);
		oscillator.stop(now + duration + 0.02);

		oscillator.onended = () => {
			oscillator.disconnect();
			gain.disconnect();
		};

		return true;
	} catch {
		return false;
	}
};

export { playBeep };
