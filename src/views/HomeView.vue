<template>
	<div class="home-wrapper">
		<!-- Left Panel -->
		<div class="home-left">
			<div class="home-title-block">
				<img class="home-logo" src="/faction-logos/msmc.svg" />
				<div class="home-title-text">
					<div class="home-title-main">
						<span class="ht-bold">{{ config.header.headerTitle }}</span>
						<span class="ht-light">{{ config.header.headerSubtitle }}</span>
					</div>
					<div class="home-title-sub">
						<span>{{ config.header.subheaderTitle }}</span>
						<span class="ht-mono">// {{ config.header.subheaderSubtitle }}</span>
					</div>
				</div>
			</div>

			<nav class="home-nav">
				<router-link
					class="menu-item"
					to="/status"
					@mouseenter="onHover('status')"
					@mouseleave="onLeave"
				>
					<div class="menu-item-bg clipped-menu-forward">
						<img src="/icons/orbital.svg" />
						<div class="menu-item-text">
							<span class="menu-item-title">Mission Status</span>
							<span class="menu-item-subtitle">&gt; Mission Log &amp; Current Assignment</span>
						</div>
					</div>
				</router-link>

				<router-link
					class="menu-item"
					to="/pilots"
					@mouseenter="onHover('pilots')"
					@mouseleave="onLeave"
				>
					<div class="menu-item-bg clipped-menu-forward">
						<img src="/icons/pilot.svg" />
						<div class="menu-item-text">
							<span class="menu-item-title">Pilot Roster</span>
							<span class="menu-item-subtitle">&gt; Squad Overview &amp; Loadouts</span>
						</div>
					</div>
				</router-link>

				<router-link
					class="menu-item"
					to="/events"
					@mouseenter="onHover('events')"
					@mouseleave="onLeave"
				>
					<div class="menu-item-bg clipped-menu-forward">
						<img src="/icons/events.svg" />
						<div class="menu-item-text">
							<span class="menu-item-title">Events Log</span>
							<span class="menu-item-subtitle">&gt; After-Action Reports &amp; Intel</span>
						</div>
					</div>
				</router-link>
			</nav>

			<div class="home-footer-info">
				<span class="home-footer-item">{{ config.header.year }}</span>
				<span class="home-footer-sep">//</span>
				<span class="home-footer-item">{{ config.header.system }}</span>
				<span class="home-footer-sep">//</span>
				<span class="home-footer-item">{{ config.header.planet }}</span>
			</div>
		</div>

		<!-- Right Panel: Terminal -->
		<div class="home-terminal">
			<div class="terminal-header">
				<span class="terminal-header-text">COMPANION/CONCIERGE UNIT // ACTIVE SESSION</span>
				<span class="terminal-blink">&#9646;</span>
			</div>
			<div class="terminal-body" ref="terminalBody">
				<div
					v-for="(line, i) in visibleLines"
					:key="i"
					class="terminal-line"
					:class="line.type"
				>
					<span class="t-prompt" v-if="line.type === 'cmd'">$ </span>
					<span class="t-prompt-out" v-if="line.type === 'out'">&gt;//[COMP/CON: </span>
					<span class="t-text">{{ line.text }}</span>
					<span class="t-close-bracket" v-if="line.type === 'out'">]</span>
				</div>
				<div class="terminal-cursor" v-if="showCursor">
					<span class="t-prompt">$ </span><span class="terminal-blink">&#9646;</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Config from "@/assets/info/general-config.json";

const BOOT_LINES = [
	{ type: "boot", text: "COMPANION/CONCIERGE UNIT INITIALIZING" },
	{ type: "boot", text: `GMS COMP/CON Unit Mk XI Rev 11.4.1c` },
	{ type: "boot", text: `${Config.header.year.replace("u", "")} General Massive Systems // Please Operate Responsibly` },
	{ type: "boot", text: "Initializing semantic manifold . . . done" },
	{ type: "boot", text: "Initializing logic gradients . . . done" },
	{ type: "boot", text: "  1.0255EB FREE (3.6EB TOTAL)" },
	{ type: "boot", text: "KERNEL supported CPUs:" },
	{ type: "boot", text: "  GMS MISSISSIPPI Series (MkII+)" },
	{ type: "boot", text: "  IPS-N Carronade v9.1+" },
	{ type: "boot", text: "  SSC Premier IV-XIV" },
	{ type: "boot", text: "  HA DOMINANCE line/all" },
	{ type: "boot", text: "  [WN UNKNOWN UNKNOWN UNKNOWN UNKNOWN UNKNOWN UNKN]" },
	{ type: "boot", text: `Policy Zone: 48::${Config.header.ring.toUpperCase()} SECTOR` },
	{ type: "boot", text: "Demand map ICRS at 3c0001000-23c0001000." },
	{ type: "boot", text: "Heap//PSIM at 23c0002000-43c0002000." },
	{ type: "boot", text: `Thread "Idle": pointer: 0x23c0002010, stack: 0x6440000` },
	{ type: "boot", text: `Thread "Main": pointer: 0x23c0002f70, stack: 0x6460000` },
	{ type: "boot-warn", text: "****** VDOMAIN for frame//integrator ******" },
	{ type: "boot", text: "backend at /local/domain/0/backend/gms/" },
	{ type: "boot", text: "Failed to read /local/domain/0/ssc/fs_sync." },
	{ type: "boot", text: "Failed to read /local/domain/0/gms/dummy_plug." },
	{ type: "boot", text: "Failed to read /local/domain/0/gms/manual_controls." },
	{ type: "boot-warn", text: "WARNING: FRAME NOT PRESENT OR INVALID" },
	{ type: "boot-warn", text: "******************************************" },
	{ type: "boot", text: "Initializing gms-cc-subsys v_int" },
	{ type: "boot", text: "Initializing gms-cc-subsys tests" },
	{ type: "boot", text: "Initializing gms-cc-subsys omninet_cls" },
	{ type: "boot", text: "Initializing gms-cc-subsys events" },
	{ type: "boot", text: "Hierarchical RCU implementation." },
	{ type: "boot", text: "RCU subjective-clock acceleration is DISABLED." },
	{ type: "boot", text: `Establishing encrypted link (65::${Config.header.gate.toUpperCase()}) . . . done` },
	{ type: "boot", text: "AM-LI in unprivileged domain disabled" },
	{ type: "boot", text: "No sensory bridge found // manual input mode enabled" },
	{ type: "sep", text: "" },
	{ type: "out", text: "Welcome, Lancer. Input Command." },
	{ type: "sep", text: "" },
];

export default {
	props: {
		missions: { type: Array, default: () => [] },
		pilots: { type: Array, default: () => [] },
		events: { type: Array, default: () => [] },
	},

	data() {
		return {
			config: Config,
			visibleLines: [],
			showCursor: false,
			bootDone: false,
			lineInterval: null,
			hoverInterval: null,
		};
	},

	computed: {
		statusHoverLines() {
			const lines = [
				{ type: "sep", text: "" },
				{ type: "cmd", text: "man mission-status↵" },
				{ type: "out", text: "View the current mission log and active assignment." },
				{ type: "sep", text: "" },
				{ type: "cmd", text: "ls missions/↵" },
			];
			this.missions.forEach(m => {
				lines.push({ type: "out", text: `[${m.status}] ${m.name}` });
			});
			lines.push({ type: "sep", text: "" });
			lines.push({ type: "cmd", text: "status --deployment↵" });
			lines.push({ type: "out", text: `Theater: ${Config.header.planet} // ${Config.header.system}` });
			lines.push({ type: "out", text: `Ring: ${Config.header.ring} // Gate: ${Config.header.gate}` });
			lines.push({ type: "out", text: `Year: ${Config.header.year}` });
			return lines;
		},
		pilotsHoverLines() {
			const lines = [
				{ type: "sep", text: "" },
				{ type: "cmd", text: "man pilot-roster↵" },
				{ type: "out", text: "Browse squad loadouts, mech configurations, and pilot records." },
				{ type: "sep", text: "" },
				{ type: "cmd", text: "ls pilots/↵" },
			];
			this.pilots.forEach(p => {
				lines.push({ type: "out", text: `${p.callsign.toUpperCase()} — ${p.name} // LL${p.level}` });
			});
			return lines;
		},
		eventsHoverLines() {
			const lines = [
				{ type: "sep", text: "" },
				{ type: "cmd", text: "man events-log↵" },
				{ type: "out", text: "After-action reports, intel intercepts, and field dispatches." },
				{ type: "sep", text: "" },
				{ type: "cmd", text: "ls events/↵" },
			];
			this.events.slice(0, 8).forEach(e => {
				lines.push({ type: "out", text: `${e.title || "UNKNOWN"} // ${e.time || ""}` });
			});
			return lines;
		},
	},

	mounted() {
		this.showCursor = true;
		this.startBootSequence();
	},

	beforeUnmount() {
		clearInterval(this.lineInterval);
		clearInterval(this.hoverInterval);
	},

	methods: {
		startBootSequence() {
			let i = 0;
			this.lineInterval = setInterval(() => {
				if (i < BOOT_LINES.length) {
					this.visibleLines.push(BOOT_LINES[i]);
					i++;
					this.scrollBottom();
				} else {
					clearInterval(this.lineInterval);
					this.lineInterval = null;
					this.bootDone = true;
				}
			}, 35);
		},

		onHover(section) {
			if (!this.bootDone) return;
			// if already typing a hover, let it finish — just queue the new one
			clearInterval(this.hoverInterval);

			const map = {
				status: this.statusHoverLines,
				pilots: this.pilotsHoverLines,
				events: this.eventsHoverLines,
			};
			const lines = map[section] || [];
			let i = 0;
			this.hoverInterval = setInterval(() => {
				if (i < lines.length) {
					this.visibleLines.push(lines[i]);
					i++;
					this.scrollBottom();
				} else {
					clearInterval(this.hoverInterval);
					this.hoverInterval = null;
				}
			}, 60);
		},

		onLeave() {
			// nothing to undo — log persists
		},


		scrollBottom() {
			this.$nextTick(() => {
				const el = this.$refs.terminalBody;
				if (el) el.scrollTop = el.scrollHeight;
			});
		},
	},
};
</script>

<style scoped>
.home-wrapper {
	position: fixed;
	inset: 0;
	display: flex;
	flex-direction: row;
	background: transparent;
	z-index: 100;
	overflow: hidden;
}

/* ── Left Panel ─────────────────────────────────────── */
.home-left {
	display: flex;
	flex-direction: column;
	width: 540px;
	min-width: 540px;
	padding: 0;
	background-color: rgba(10, 10, 13, 0.82);
	backdrop-filter: blur(6px);
	-webkit-backdrop-filter: blur(6px);
	border-right: 1px dashed rgba(255, 255, 255, 0.08);
	position: relative;
}

.home-title-block {
	background-color: var(--primary-color);
	display: flex;
	flex-direction: row;
	align-items: center;
	padding: 20px 24px;
	gap: 18px;
	clip-path: polygon(0 0, 100% 0, calc(100% - 32px) 100%, 0 100%);
	-webkit-clip-path: polygon(0 0, 100% 0, calc(100% - 32px) 100%, 0 100%);
}

.home-logo {
	width: 56px;
	height: 56px;
	filter: brightness(0) invert(1) opacity(0.9);
	flex-shrink: 0;
}

.home-title-text {
	display: flex;
	flex-direction: column;
}

.home-title-main {
	display: flex;
	flex-direction: row;
	align-items: baseline;
	gap: 8px;
}

.ht-bold {
	font-family: "Big Shoulders Display", cursive;
	font-weight: 800;
	font-size: 34px;
	text-transform: uppercase;
	letter-spacing: 0.12em;
	color: rgba(255, 255, 255, 0.97);
	line-height: 1;
}

.ht-light {
	font-family: "Big Shoulders Display", cursive;
	font-weight: 600;
	font-size: 28px;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	color: rgba(255, 255, 255, 0.85);
	line-height: 1;
}

.home-title-sub {
	display: flex;
	flex-direction: row;
	gap: 8px;
	margin-top: 4px;
}

.home-title-sub span {
	font-family: "Big Shoulders Display", cursive;
	font-weight: 600;
	font-size: 16px;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: rgba(255, 255, 255, 0.75);
}

.ht-mono {
	font-family: "Inconsolata", monospace !important;
	font-size: 14px !important;
	letter-spacing: 0.04em !important;
	color: rgba(255, 255, 255, 0.6) !important;
}

/* ── Nav Menu ───────────────────────────────────────── */
.home-nav {
	display: flex;
	flex-direction: column;
	gap: 0px;
	padding: 32px 0 0 0;
	flex: 1;
}

.menu-item {
	text-decoration: none;
	display: block;
	margin-bottom: 12px;
}

.menu-item-bg {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 20px;
	padding: 18px 48px 18px 28px;
	background-color: rgba(145, 0, 24, 0.12);
	border-left: 3px solid transparent;
	transition: background-color 0.18s ease, border-color 0.18s ease;
	cursor: pointer;
}

.menu-item:hover .menu-item-bg,
.menu-item.router-link-active .menu-item-bg {
	background-color: var(--primary-color);
	border-left-color: rgba(255, 255, 255, 0.4);
}

.clipped-menu-forward {
	clip-path: polygon(0 0, 100% 0, calc(100% - 20px) 100%, 0 100%);
	-webkit-clip-path: polygon(0 0, 100% 0, calc(100% - 20px) 100%, 0 100%);
}

.menu-item-bg img {
	width: 52px;
	height: 52px;
	filter: brightness(0) invert(1) opacity(0.8);
	flex-shrink: 0;
	transition: opacity 0.18s ease;
}

.menu-item:hover .menu-item-bg img,
.menu-item.router-link-active .menu-item-bg img {
	filter: brightness(0) invert(1) opacity(1);
}

.menu-item-text {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.menu-item-title {
	font-family: "Big Shoulders Display", cursive;
	font-weight: 800;
	font-size: 30px;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	color: rgba(255, 255, 255, 0.95);
	line-height: 1;
}

.menu-item-subtitle {
	font-family: "Inconsolata", monospace;
	font-size: 12px;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.55);
}

.menu-item:hover .menu-item-subtitle,
.menu-item.router-link-active .menu-item-subtitle {
	color: rgba(255, 255, 255, 0.75);
}

/* ── Footer Info ────────────────────────────────────── */
.home-footer-info {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 10px;
	padding: 18px 28px;
	border-top: 1px solid rgba(145, 0, 24, 0.4);
}

.home-footer-item {
	font-family: "Inconsolata", monospace;
	font-size: 13px;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: rgba(255, 255, 255, 0.45);
}

.home-footer-sep {
	color: var(--primary-color);
	font-family: "Inconsolata", monospace;
	font-size: 13px;
	opacity: 0.7;
}

/* ── Terminal Panel ─────────────────────────────────── */
.home-terminal {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background-color: rgba(6, 7, 9, 0.55);
	backdrop-filter: blur(2px);
	-webkit-backdrop-filter: blur(2px);
}

.terminal-header {
	background-color: rgba(14, 16, 18, 0.75);
	border-bottom: 1px solid rgba(145, 0, 24, 0.5);
	padding: 8px 20px;
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
}

.terminal-header-text {
	font-family: "Inconsolata", monospace;
	font-size: 12px;
	letter-spacing: 0.1em;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.4);
}

.terminal-body {
	flex: 1;
	overflow-y: auto;
	padding: 20px 24px 20px 20px;
	display: flex;
	flex-direction: column;
	gap: 2px;
	scrollbar-width: thin;
}

.terminal-line {
	font-family: "Inconsolata", monospace;
	font-size: 14px;
	line-height: 1.6;
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
}

.terminal-line.sep {
	height: 10px;
}

.t-prompt {
	color: rgba(255, 255, 255, 0.5);
	white-space: pre;
}

.t-prompt-out {
	color: var(--primary-color);
	white-space: pre;
	font-weight: 700;
}

.terminal-line.cmd .t-text {
	color: rgba(255, 255, 255, 0.85);
}

.terminal-line.out .t-text {
	color: rgba(200, 220, 255, 0.75);
}

.t-close-bracket {
	color: var(--primary-color);
	font-weight: 700;
}

.terminal-line.boot .t-text {
	color: rgba(255, 255, 255, 0.45);
}

.terminal-line.boot-warn .t-text {
	color: rgba(255, 160, 60, 0.8);
}

.terminal-cursor {
	font-family: "Inconsolata", monospace;
	font-size: 14px;
	display: flex;
	flex-direction: row;
	align-items: center;
	margin-top: 4px;
}

.terminal-blink {
	color: rgba(255, 255, 255, 0.7);
	animation: blink 1s step-end infinite;
}

@keyframes blink {
	0%, 100% { opacity: 1; }
	50% { opacity: 0; }
}

/* ── Entrada animations ──────────────────────────────── */
@keyframes homeSlideInLeft {
	0% { transform: translateX(-100%); opacity: 0; }
	60% { opacity: 0.5; }
	100% { transform: translateX(0); opacity: 1; }
}

@keyframes homeFlickerIn {
	0%   { opacity: 0; }
	10%  { opacity: 0.3; }
	20%  { opacity: 0; }
	35%  { opacity: 0.6; }
	50%  { opacity: 0.1; }
	70%  { opacity: 0.8; }
	85%  { opacity: 0.4; }
	100% { opacity: 1; }
}

@keyframes homeSlideInTop {
	0%   { transform: translateY(-40px); opacity: 0; }
	60%  { opacity: 0.5; }
	100% { transform: translateY(0); opacity: 1; }
}

@keyframes homeSlideInRight {
	0%   { transform: translateX(60px); opacity: 0; }
	60%  { opacity: 0.5; }
	100% { transform: translateX(0); opacity: 1; }
}

.home-title-block {
	animation: homeSlideInLeft 0.35s ease-out 0.1s both;
}

.home-nav .menu-item:nth-child(1) {
	animation: homeFlickerIn 0.4s ease-out 0.5s both;
}
.home-nav .menu-item:nth-child(2) {
	animation: homeFlickerIn 0.4s ease-out 0.75s both;
}
.home-nav .menu-item:nth-child(3) {
	animation: homeFlickerIn 0.4s ease-out 1.0s both;
}

.home-footer-info {
	animation: homeFlickerIn 0.5s ease-out 1.2s both;
}

.home-terminal {
	animation: homeSlideInRight 0.45s ease-out 0.3s both;
}
</style>
