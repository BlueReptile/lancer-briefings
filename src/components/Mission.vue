<template>
  <div class="mission" :class="[{ active: isActive }, mission.status]" @click="selectMission">
    <div class="name">
      <h1>Mission // {{ mission.slug }}</h1>
      <h2>{{ mission.name }}</h2>
    </div>
    <div class="status" :class="mission.status">
      {{ missionStatus }}
      <img :src="icon" />
    </div>
  </div>
</template>

<script>
export default {
  components: {},
  emits: ["select"],
  props: {
    mission: {
      type: Object,
      required: true,
    },
    selected: {
      type: [String, Number],
      required: true,
    },
  },
  methods: {
    selectMission() {
      this.$emit("select", this.mission.slug);
    },
  },
  computed: {
    icon() {
      return `/icons/mission-${this.mission.status}.svg`;
    },
    missionStatus() {
      if (this.mission.status === "start") return "Current\nBriefing";
      if (this.mission.status === "partial-success") return "Partial\nSuccess";
      if (this.mission.status === "success") return "Mission\nSuccess";
      if (this.mission.status === "failure") return "Mission\nFailure";
    },
    isActive() {
      return String(this.mission.slug) === String(this.selected);
    },
  },
};
</script>
