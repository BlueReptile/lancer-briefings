const CC_API_KEY = "fcFvjjrnQy2hypelJQi4X9dRI55r5KuI4bC07Maf";
const CC_API_URI = "https://api.compcon.app";
const CC_BUCKET_URI = "https://ds69h3g1zxwgy.cloudfront.net";

const CORS_PROXIES = [
	(url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
	(url) => `https://lasossis-lancer-cors.m-cescutti.workers.dev/?url=${encodeURIComponent(url)}`,
];

const V2_SHARE_CODE = /^[A-Z0-9]{6}$/;
const V3_SHARE_CODE = /^[A-Z0-9]{12}$/;

function clone(value) {
	return JSON.parse(JSON.stringify(value));
}

function codeFromValue(value) {
	if (typeof value !== "string") {
		return "";
	}

	const raw = value.trim();
	if (!raw) {
		return "";
	}

	try {
		const url = new URL(raw);
		const queryCode = url.searchParams.get("code") || url.searchParams.get("share") || url.searchParams.get("id");
		if (queryCode) {
			return queryCode.trim().toUpperCase();
		}

		const lastSegment = url.pathname.split("/").filter(Boolean).pop();
		if (lastSegment) {
			return lastSegment.trim().toUpperCase();
		}
	} catch {
		// Not a URL; treat it as the raw share code.
	}

	return raw.toUpperCase();
}

function isPilotData(value) {
	return !!value && typeof value === "object" && (value.EXPORT_TYPE || value.data || value.callsign || value.itemType === "pilot");
}

export function hasPilotSources(config) {
	if (Array.isArray(config)) {
		return config.length > 0;
	}

	if (!config || typeof config !== "object") {
		return false;
	}

	return (config.codes || []).length > 0 || (config.pilots || []).length > 0;
}

function normalizeSourceEntries(config) {
	const entries = Array.isArray(config) ? config : [...(config.codes || []), ...(config.pilots || [])];

	return entries
		.map((entry) => {
			if (typeof entry === "string") {
				return { code: codeFromValue(entry) };
			}

			if (entry && typeof entry === "object" && entry.code) {
				return { ...entry, code: codeFromValue(entry.code) };
			}

			if (isPilotData(entry)) {
				return { data: entry };
			}

			return null;
		})
		.filter(Boolean);
}

async function fetchWithCorsFallback(url, init = {}) {
	const attempts = [url, ...CORS_PROXIES.map((wrap) => wrap(url))];
	let lastError = null;

	for (const attempt of attempts) {
		try {
			const response = await fetch(attempt, init);
			if (!response.ok) {
				lastError = new Error(`${response.status} ${response.statusText}`);
				continue;
			}

			return response;
		} catch (error) {
			lastError = error;
		}
	}

	throw lastError || new Error(`Unable to fetch ${url}`);
}

async function fetchJson(url, init = {}) {
	const response = await fetchWithCorsFallback(url, init);
	return response.json();
}

function unwrapData(json) {
	if (json && json.data && !json.name && !json.callsign && !json.itemType) {
		return typeof json.data === "string" ? JSON.parse(json.data) : json.data;
	}

	return json;
}

async function fetchV2PilotViaShareCode(code) {
	const shareObj = await fetchJson(`${CC_API_URI}/share?code=${encodeURIComponent(code)}`, {
		headers: { "x-api-key": CC_API_KEY },
	});

	if (!shareObj?.presigned) {
		throw new Error(`No presigned pilot payload for V2 code ${code}`);
	}

	return fetchJson(shareObj.presigned);
}

async function fetchV3PilotsViaShareCodes(codes) {
	if (codes.length === 0) {
		return [];
	}

	const url = `${CC_API_URI}/v3/code?codes=${encodeURIComponent(JSON.stringify(codes))}&scope=items`;
	const sourceObjs = await fetchJson(url, {
		headers: { "x-api-key": CC_API_KEY },
	});

	if (!Array.isArray(sourceObjs)) {
		throw new Error("Unexpected COMP/CON v3 code response");
	}

	return Promise.all(
		sourceObjs
			.filter((source) => source?.uri)
			.map((source) => fetchJson(`${CC_BUCKET_URI}/${source.uri}?cb=${Date.now()}`))
	);
}

export async function loadPilotsFromSources(config) {
	const entries = normalizeSourceEntries(config);
	const inlinePilots = entries.filter((entry) => entry.data).map((entry) => entry.data);
	const codeEntries = entries.filter((entry) => entry.code);
	const v2Codes = codeEntries.map((entry) => entry.code).filter((code) => V2_SHARE_CODE.test(code));
	const v3Codes = codeEntries.map((entry) => entry.code).filter((code) => V3_SHARE_CODE.test(code));
	const invalidCodes = codeEntries.map((entry) => entry.code).filter((code) => !V2_SHARE_CODE.test(code) && !V3_SHARE_CODE.test(code));

	invalidCodes.forEach((code) => console.warn(`[Pilots] Ignoring invalid COMP/CON share code: ${code}`));

	const [v3Pilots, v2Pilots] = await Promise.all([
		fetchV3PilotsViaShareCodes(v3Codes),
		Promise.all(v2Codes.map((code) => fetchV2PilotViaShareCode(code))),
	]);

	return [...inlinePilots, ...v3Pilots, ...v2Pilots].map(unwrapData);
}

function normalizeBondData(pilot) {
	const bond = pilot.bond;
	if (!bond || typeof bond !== "object") {
		return;
	}

	if (pilot.bondId === undefined) pilot.bondId = bond.bondId || bond.data?.id || "";
	if (!Array.isArray(pilot.bondPowers)) pilot.bondPowers = Array.isArray(bond.bondPowers) ? bond.bondPowers : [];
	if (!Array.isArray(pilot.burdens)) pilot.burdens = Array.isArray(bond.burdens) ? bond.burdens : [];
	if (!Array.isArray(pilot.clocks)) pilot.clocks = Array.isArray(bond.clocks) ? bond.clocks : [];
	if (!Array.isArray(pilot.bondAnswers)) pilot.bondAnswers = Array.isArray(bond.bondAnswers) ? bond.bondAnswers : [];
	if (pilot.minorIdeal === undefined) pilot.minorIdeal = bond.minorIdeal || "";
	if (pilot.xp === undefined) pilot.xp = bond.xp || 0;
	if (pilot.stress === undefined) pilot.stress = bond.stress || 0;
	if (pilot.isBroken === undefined) pilot.isBroken = !!bond.isBroken;
	if (pilot.powerSelections === undefined) pilot.powerSelections = bond.powerSelections || 0;
	if (pilot.maxStress === undefined) pilot.maxStress = bond.maxStress || 8;
}

function normalizeMech(mech) {
	const normalized = mech;
	normalized.loadouts = Array.isArray(normalized.loadouts) ? normalized.loadouts : [];
	normalized.active_loadout_index = normalized.active_loadout_index ?? normalized.active_index ?? 0;
	normalized.cloud_portrait =
		normalized.cloud_portrait ||
		normalized.portrait ||
		normalized.img?.cloud_portrait ||
		normalized.img?.portrait ||
		normalized.img?.avatar ||
		normalized.frameData?.image_url ||
		"";

	normalized.loadouts.forEach((loadout) => {
		loadout.systems = Array.isArray(loadout.systems) ? loadout.systems : [];
		loadout.mounts = Array.isArray(loadout.mounts) ? loadout.mounts : [];
	});

	return normalized;
}

export function normalizePilotData(rawPilot) {
	const unwrapped = unwrapData(rawPilot);
	const source = unwrapped?.EXPORT_TYPE && unwrapped.data ? unwrapped.data : unwrapped;

	if (!source || typeof source !== "object" || !source.callsign) {
		return null;
	}

	const pilot = clone(source);
	pilot.name = pilot.name || "Unnamed";
	pilot.level = pilot.level ?? 0;
	pilot.background = pilot.background || "";
	pilot.skills = Array.isArray(pilot.skills) ? pilot.skills : [];
	pilot.talents = Array.isArray(pilot.talents) ? pilot.talents : [];
	pilot.licenses = Array.isArray(pilot.licenses) ? pilot.licenses : [];
	pilot.mechSkills = Array.isArray(pilot.mechSkills) ? pilot.mechSkills : [0, 0, 0, 0];
	pilot.mechs = Array.isArray(pilot.mechs) ? pilot.mechs.map(normalizeMech) : [];
	pilot.reserves = Array.isArray(pilot.reserves) ? pilot.reserves : [];
	pilot.orgs = Array.isArray(pilot.orgs) ? pilot.orgs : [];
	pilot.history = pilot.history || "";
	pilot.text_appearance = pilot.text_appearance || "";
	pilot.cloud_portrait =
		pilot.cloud_portrait ||
		pilot.portrait ||
		pilot.img?.cloud_portrait ||
		pilot.img?.portrait ||
		pilot.img?.avatar ||
		"";
	pilot.lastModified = pilot.lastModified || pilot.save?.lastModified || pilot.lastUpdate_cloud || "";
	pilot.loadouts = Array.isArray(pilot.loadouts) ? pilot.loadouts : [];
	pilot.loadout = pilot.loadout || pilot.loadouts[pilot.active_index ?? pilot.active_loadout_index ?? 0] || {
		id: "",
		name: "Default Loadout",
		armor: [],
		weapons: [],
		gear: [],
		extendedWeapons: [],
		extendedGear: [],
	};

	pilot.loadout.armor = Array.isArray(pilot.loadout.armor) ? pilot.loadout.armor : [];
	pilot.loadout.weapons = Array.isArray(pilot.loadout.weapons) ? pilot.loadout.weapons : [];
	pilot.loadout.gear = Array.isArray(pilot.loadout.gear) ? pilot.loadout.gear : [];

	normalizeBondData(pilot);

	pilot.clocks = Array.isArray(pilot.clocks) ? pilot.clocks : [];
	pilot.burdens = Array.isArray(pilot.burdens) ? pilot.burdens : [];
	pilot.bondPowers = Array.isArray(pilot.bondPowers) ? pilot.bondPowers : [];
	pilot.bondAnswers = Array.isArray(pilot.bondAnswers) ? pilot.bondAnswers : [];

	const activeMech =
		pilot.mechs.find((mech) => mech.id === pilot.state?.active_mech_id) ||
		pilot.mechs.find((mech) => mech.id === pilot.favorite_mech) ||
		pilot.mechs.find((mech) => mech.mounted) ||
		pilot.mechs[0] ||
		null;

	pilot.state = {
		...(pilot.state || {}),
		active_mech_id: activeMech?.id || "",
	};

	if (!pilot.id) {
		pilot.id = pilot.cloudID || pilot.originId || pilot.instanceId || pilot.callsign;
	}

	return pilot;
}
