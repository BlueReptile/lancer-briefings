<template>
	<div class="pilot-modal">
		<div class="pilot-header-container">
			<div class="section-header clipped-medium-backward-bio">
				<img src="/icons/pilot.svg" />
				<h1>{{ pilot.name }} [{{ pilot.callsign }}]</h1>
			</div>
			<div class="rhombus-back">&nbsp;</div>
		</div>
		<div class="pilot markdown">
			<div v-html="getHistory()"/>
		</div>
	</div>
	<div class="pilot-modal portrait">
		<div class="pilot-header-container">
			<div class="section-header clipped-medium-backward-pilot">
				<img src="/icons/portrait.svg" />
				<h1>Pilot Artwork</h1>
			</div>
			<div class="rhombus-back">&nbsp;</div>
		</div>
		<div class="pilot">
			<img :src="pilotPortrait" class="portrait" />
		</div>
	</div>
</template>

<script>
import { VueMarkdownIt } from '@f3ve/vue-markdown-it';
import { mechImageSrc, pilotImageSrc } from '@/services/imageSources';

export default {
	components: {
		VueMarkdownIt,
	},
	inheritAttrs: false,
	props: {
		pilot: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			markdownHtml: true,
		};
	},
	computed: {
    pilotPortrait() {
      return pilotImageSrc(this.pilot)
    },
    mechPortrait() {
      return mechImageSrc(this.pilot.mechs?.[0], this.pilot)
    },
	},
	methods: {
		getHistory(){
			if (!this.pilot.history && !this.pilot.text_appearance){
				return `<p> <h2> [ERR: REDACTED] </h2> </p>`
			}

			let response = "<p>"
			
			if (this.pilot.text_appearance){
				response += `<h2>APPEARANCE</h2> ${this.pilot.text_appearance} </hr>`;
			}

			if (this.pilot.history){
				response += `<h2>HISTORY</h2> ${this.pilot.history} </hr>`;
			}

			response += "</p>"

			return response;
		}
	},
};
</script>
