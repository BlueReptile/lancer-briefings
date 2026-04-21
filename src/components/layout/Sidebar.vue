<template>
	<div class="sidebar-page">
		<section class="sidebar-layout">
			<o-sidebar
			  id="sidebar"
			  position="static"
			  :animate="animate"
			  :mobile="mobile"
			  :expand-on-hover="expandOnHover"
			  :reduce="reduce"
			  open>
				<router-link class="clipped-bottom-right sidebar-home-btn" to="/home" title="Main Menu">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
						<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
					</svg>
					<span>Menu</span>
				</router-link>
				<div class="sidebar-divider"></div>
				<router-link class="clipped-bottom-right" to="/status">
					<img src="/icons/orbital.svg" />
					<span>Status</span>
				</router-link>
				<router-link class="clipped-bottom-right" to="/pilots">
					<img src="/icons/pilot.svg" />
					<span>Pilots</span>
				</router-link>
				<router-link class="clipped-bottom-right" to="/events">
					<img src="/icons/events.svg" />
					<span>Logs</span>
				</router-link>
			</o-sidebar>
		</section>
	</div>
</template>

<script>
export default {
	props: {
		animate: {
			type: Boolean,
			required: true,
		},
	},
	data() {
		return {
			expandOnHover: false,
			mobile: "reduced",
			reduce: false,
		};
	},
};
</script>

<!-- <style></style> -->
