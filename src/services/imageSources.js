function normalizeImageSrc(value) {
	if (!value) {
		return "";
	}

	const src = String(value).trim();
	if (!src) {
		return "";
	}

	if (/^(https?:|data:|blob:|\/)/i.test(src)) {
		return src;
	}

	return `/${src.replace(/^\.?\//, "")}`;
}

function firstImage(...values) {
	for (const value of values) {
		const src = normalizeImageSrc(value);
		if (src) {
			return src;
		}
	}

	return "";
}

export function localPilotImage(pilot) {
	return `/pilots/${String(pilot?.callsign || "UNKNOWN").toUpperCase()}.webp`;
}

export function localMechImage(pilot) {
	return `/mechs/${String(pilot?.callsign || "UNKNOWN").toUpperCase()}.webp`;
}

export function pilotImageSrc(pilot) {
	return firstImage(
		pilot?.cloud_portrait,
		pilot?.portrait,
		pilot?.img?.cloud_portrait,
		pilot?.img?.portrait,
		pilot?.img?.avatar,
		localPilotImage(pilot)
	);
}

export function mechImageSrc(mech, pilot) {
	return firstImage(
		mech?.cloud_portrait,
		mech?.portrait,
		mech?.img?.cloud_portrait,
		mech?.img?.portrait,
		mech?.img?.avatar,
		mech?.frameData?.image_url,
		localMechImage(pilot)
	);
}
