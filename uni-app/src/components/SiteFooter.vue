<template>
  <!-- #ifdef H5 -->
  <view class="site-footer">
    <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">辽ICP备2025071127号-1</a>
  </view>
  <!-- #endif -->
  <!-- #ifndef H5 -->
  <view v-if="false" />
  <!-- #endif -->
</template>

<style scoped>
.site-footer{padding:20px 16px;text-align:center;background:#f7f3ea;color:#6d8073;font-size:13px;line-height:1.6}
.site-footer a{color:inherit;text-decoration:none}
.site-footer a:hover{text-decoration:underline}
</style>
