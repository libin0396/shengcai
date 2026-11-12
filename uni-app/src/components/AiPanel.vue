<template>
  <view class="ai-panel">
    <view v-if="panel.kind==='next'" class="ap-btn" hover-class="ap-press" @tap="$emit('next')">{{panel.label}}</view>

    <template v-else-if="panel.kind==='choice'||panel.kind==='pick'">
      <view v-for="(o,i) in panel.opts" :key="i" class="ap-opt" :class="{right:o.state==='right',shake:o.shake,dim:panel.solved&&o.state!=='right'}" hover-class="ap-press" @tap="$emit('choose',i)">{{o.text}}</view>
      <view v-if="panel.fb" class="ap-fb"><text v-if="panel.fbOk" class="ap-tag">对了</text><text>{{panel.fb}}</text></view>
      <view v-if="panel.solved" class="ap-btn" hover-class="ap-press" @tap="$emit('next')">继续</view>
    </template>

    <template v-else-if="panel.kind==='sort'">
      <view class="ap-card" :class="{shake:panel.shake}"><text class="ap-card-n">{{panel.index+1}} / {{panel.total}}</text><text class="ap-card-t">{{panel.text}}</text></view>
      <view class="ap-two">
        <view v-for="(lab,k) in panel.labels" :key="k" class="ap-btn soft" :class="{off:panel.answered}" hover-class="ap-press" @tap="$emit('sort',k)">{{lab}}</view>
      </view>
      <view v-if="panel.fb" class="ap-fb"><text v-if="panel.fbOk" class="ap-tag">对了</text><text>{{panel.fb}}</text></view>
      <view v-if="panel.answered" class="ap-btn" hover-class="ap-press" @tap="$emit('next')">{{panel.last?'继续':'下一个'}}</view>
    </template>

    <template v-else-if="panel.kind==='order'">
      <text class="ap-sub">按顺序点：</text>
      <view v-for="(text,i) in panel.got" :key="'g'+i" class="ap-got"><text class="ap-got-n">{{i+1}}</text><text>{{text}}</text></view>
      <view class="ap-pool">
        <view v-for="(item,i) in panel.pool" :key="item.text" class="ap-piece" :class="{shake:item.shake}" hover-class="ap-press" @tap="$emit('order',i)">{{item.text}}</view>
      </view>
      <view v-if="panel.fb" class="ap-fb"><text v-if="panel.fbOk" class="ap-tag">对了</text><text>{{panel.fb}}</text></view>
      <view v-if="panel.solved" class="ap-btn" hover-class="ap-press" @tap="$emit('next')">继续</view>
    </template>

    <template v-else-if="panel.kind==='build'">
      <view class="ap-chips">
        <view v-for="c in panel.chips" :key="c.k" class="ap-chip" :class="{used:c.used}" hover-class="ap-press" @tap="$emit('chip',c.k)"><text class="ap-chip-l">{{c.label}}</text><text class="ap-chip-s">{{c.sub}}</text></view>
      </view>
      <view class="ap-btn" :class="{off:!panel.ready}" hover-class="ap-press" @tap="$emit('next')">{{panel.send}}</view>
    </template>

    <template v-else-if="panel.kind==='pieces'">
      <text class="ap-sub">按顺序点词块：</text>
      <view class="ap-pool">
        <view v-for="(item,i) in panel.pool" :key="item.text" class="ap-piece" :class="{shake:item.shake}" hover-class="ap-press" @tap="$emit('piece',i)">{{item.text}}</view>
      </view>
      <view v-if="panel.fb" class="ap-fb"><text>{{panel.fb}}</text></view>
    </template>

    <template v-else-if="panel.kind==='copy'">
      <view class="ap-btn soft" hover-class="ap-press" @tap="$emit('copy')">{{panel.copied?'已复制，可以再复制一次':'复制这一句'}}</view>
      <view class="ap-btn" :class="{off:!panel.copied}" hover-class="ap-press" @tap="$emit('next')">我试过了</view>
      <text class="ap-note">复制以后才能点「我试过了」。</text>
    </template>

    <template v-else-if="panel.kind==='spot'">
      <view v-if="panel.fb" class="ap-fb"><text v-if="panel.fbOk" class="ap-tag">对了</text><text>{{panel.fb}}</text></view>
    </template>
  </view>
</template>

<script setup>
// 学 AI、每日 AI 共用的操作区：继续、选择、两边归类、按顺序点、补全一句话、拼词块、复制。
// 只负责画和把点击交给页面，判断对错在 data/ai-runner.js。
defineProps({ panel: { type: Object, required: true } });
defineEmits(['next', 'choose', 'sort', 'order', 'chip', 'piece', 'copy']);
</script>

<style scoped>
.ai-panel{display:flex;flex-direction:column;gap:10px;min-height:60px}
.ap-btn{display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:14px;background:#2b44e6;color:#fff;font-size:17px;font-weight:800;text-align:center;padding:0 16px;animation:apRise .3s ease both}
.ap-btn.soft{background:#eceffe;color:#2b44e6}
.ap-btn.off{opacity:.45}
.ap-press{opacity:.75}
.ap-opt{border:2px solid #e6e8ec;background:#fff;color:#161a23;border-radius:16px;padding:13px 15px;font-size:16px;line-height:1.55;font-weight:600;animation:apRise .3s ease both}
.ap-opt.right{border-color:#2b44e6;box-shadow:0 0 0 1px #2b44e6}
.ap-opt.dim{opacity:.55}
.ap-fb{background:#fff;border-radius:16px;padding:12px 15px;font-size:15px;line-height:1.6;color:#161a23;animation:apRise .3s ease both}
.ap-tag{display:inline-block;background:#ffc83d;color:#161a23;font-size:13px;font-weight:900;border-radius:8px;padding:1px 9px;margin-right:8px}
.ap-card{display:flex;flex-direction:column;align-items:center;background:#fff;border:2px solid #e6e8ec;border-radius:18px;padding:16px;text-align:center}
.ap-card-n{font-size:12px;font-weight:700;color:#5f6675}
.ap-card-t{margin-top:4px;font-size:19px;font-weight:800;line-height:1.5;color:#161a23}
.ap-two{display:flex;gap:10px}.ap-two .ap-btn{flex:1}
.ap-sub{font-size:13px;font-weight:700;color:#5f6675}
.ap-got{display:flex;align-items:center;gap:10px;background:#eceffe;color:#2b44e6;border-radius:12px;padding:8px 12px;font-weight:800;font-size:15px;animation:apPop .28s ease both}
.ap-got-n{display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:8px;background:#2b44e6;color:#fff;font-size:13px;flex:none}
.ap-pool{display:flex;flex-wrap:wrap;gap:8px}
.ap-piece{border:2px solid #e6e8ec;background:#fff;color:#161a23;border-radius:12px;min-height:44px;padding:8px 13px;font-size:15px;font-weight:800;line-height:1.5;box-sizing:border-box}
.ap-chips{display:flex;gap:8px}
.ap-chip{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:62px;border:2px solid #e6e8ec;background:#fff;border-radius:14px;padding:6px 4px;text-align:center}
.ap-chip-l{font-size:15px;font-weight:800;color:#161a23}.ap-chip-s{font-size:12px;font-weight:700;color:#5f6675}
.ap-chip.used{border-color:#2b44e6;background:#eceffe}.ap-chip.used .ap-chip-l,.ap-chip.used .ap-chip-s{color:#2b44e6}
.ap-note{font-size:12px;color:#5f6675;text-align:center}
.shake{animation:apShake .4s ease}
@keyframes apShake{20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}
@keyframes apRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes apPop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
</style>
