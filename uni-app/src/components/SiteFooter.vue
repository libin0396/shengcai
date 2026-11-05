<template>
  <!-- #ifdef H5 -->
  <view :class="['site-footer', {'site-footer--with-promo': spaceForPromo}]">
    <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">辽ICP备2025071127号-1</a>
  </view>
  <!-- #endif -->
  <!-- #ifndef H5 -->
  <view v-if="false" />
  <!-- #endif -->
</template>

<script setup>
defineProps({ spaceForPromo: { type: Boolean, default: false } });
</script>

<style scoped>
.site-footer{padding:20px 16px;text-align:center;background:#f7f3ea;color:#6d8073;font-size:13px;line-height:1.6}
.site-footer a{color:inherit;text-decoration:none}
.site-footer a:hover{text-decoration:underline}
@media(max-width:700px){.site-footer--with-promo{padding-bottom:104px}}
</style>
