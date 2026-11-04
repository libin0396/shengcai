<template><view class="sim-footer"><view class="sim-kicker">继续动手实践</view><view class="sim-heading">了解 AI 成万事三天体验营</view><view class="sim-note">先看完整海报，活动时间和参与方式以入口说明为准。</view><image src="/static/assets/ai-camp-poster.jpg" mode="aspectFit"/><view class="sim-actions"><button class="sim-secondary" @click="openCamp">查看体验营及联系站长</button></view><view class="sim-note">体验营入口不等同于其他活动报名入口。</view></view></template>
<script setup>
const openCamp=()=>uni.navigateTo({url:'/pages/camp/index'});
</script>
