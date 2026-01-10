import { useCallback, useLayoutEffect, useMemo, useState } from 'react';

const findStartIndex = (offsets, value) => {
	let low = 0;
	let high = offsets.length - 1;
	let result = 0;

	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		if (offsets[mid] <= value) {
			result = mid;
			low = mid + 1;
		} else {
			high = mid - 1;
		}
	}

	return result;
};

const useVirtualList = ({
	items,
	getItemKey,
	estimateSize,
	overScan = 8,
	scrollRef,
}) => {
	const [sizeMap, setSizeMap] = useState(() => new Map());
	const [scrollTop, setScrollTop] = useState(0);
	const [viewportHeight, setViewportHeight] = useState(0);

	const setSize = useCallback(
		(key, size) => {
			if (!key || typeof size !== 'number' || size <= 0) {
				return;
			}
			setSizeMap((prevMap) => {
				const prev = prevMap.get(key);
				if (prev === size) {
					return prevMap;
				}
				const nextMap = new Map(prevMap);
				nextMap.set(key, size);
				return nextMap;
			});
		},
		[]
	);

	useLayoutEffect(() => {
		const el = scrollRef.current;
		if (!el) {
			return undefined;
		}

		const handleScroll = () => {
			setScrollTop(el.scrollTop || 0);
		};

		el.addEventListener('scroll', handleScroll);

		let observer;
		if (typeof ResizeObserver !== 'undefined') {
			observer = new ResizeObserver(() => {
				setViewportHeight(el.clientHeight || 0);
				setScrollTop(el.scrollTop || 0);
			});
			observer.observe(el);
		}

		return () => {
			el.removeEventListener('scroll', handleScroll);
			if (observer) {
				observer.disconnect();
			}
		};
	}, [scrollRef]);

	const { virtualItems, totalHeight } = useMemo(() => {
		const itemCount = items.length;
		if (!itemCount) {
			return { virtualItems: [], totalHeight: 0 };
		}

		const offsets = new Array(itemCount);
		let total = 0;

		for (let index = 0; index < itemCount; index += 1) {
			offsets[index] = total;
			const item = items[index];
			const key = getItemKey(item, index);
			const size = sizeMap.get(key) ?? estimateSize(item, index);
			total += Number.isFinite(size) ? size : 0;
		}

		const startOffset = Math.max(0, scrollTop - 50);
		const endOffset = scrollTop + (viewportHeight || 0) + 50;
		const startIndex = findStartIndex(offsets, startOffset);
		const endIndex = findStartIndex(offsets, endOffset);
		const rangeStart = Math.max(0, startIndex - overScan);
		const rangeEnd = Math.min(itemCount - 1, endIndex + overScan);

		const nextItems = [];
		for (let index = rangeStart; index <= rangeEnd; index += 1) {
			const item = items[index];
			const key = getItemKey(item, index);
			nextItems.push({
				index,
				key,
				start: offsets[index],
				item,
			});
		}

		return { virtualItems: nextItems, totalHeight: total };
	}, [estimateSize, getItemKey, items, overScan, scrollTop, sizeMap, viewportHeight]);

	return {
		virtualItems,
		totalHeight,
		setSize,
	};
};

export { useVirtualList };
