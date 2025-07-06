<template>
  <div class="cal">
    <div
      ref="EditContainer"
      class="cal_view"
      contenteditable="true"
      @input="matchAt"
      @keydown="hanldeKeyDown"
      @focus="calFocus"
      @blur="calBlur"
    />
    <div class="cal_emoji" @click="emojiModelStop">
      <div class="cal_emoji-entry" @click="triggerEmoji">
        <span>~</span>
        <img
          src="../assets/emoji/EMOJI-13.png"
          alt=""
          srcset=""
        >
      </div>
      <div
        v-if="showEmoji"
        class="cal_emoji-container"
      >
        <div
          v-for="(item,index) in tipsEmojiList"
          :key="item.id"
          class="cal_emoji-container-item"
          @click="chooseEmoji(index)"
        >
          <img :src="item.url" alt="">
        </div>
      </div>
    </div>
    <div
      v-if="tipsAtmention.showTips"
      ref="CalTips"
      class="cal_tips"
      :style="{ top: tipsAtmention.positionTop+'px',left:tipsAtmention.positionLeft+'px'}"
      @click="tipsModelStop"
    >
      <div
        class="cal_tips-wrapper"
      >
        <div
          v-for="(item,index) in tipsAtmention.tipsArr"
          :key="item.id"
          class="cal_tips-wrapper-item"
          :style="{backgroundColor:selectActiveIndex==index?'#e2eefa':''}"
          @click="handleChooseUser(index)"
        >
          <img
            :src="item.avatar"
          >
          <span>{{ item.name }}</span>
        </div>
        <div class="cal_tips-wrapper-default">
          没有更多匹配数据了
        </div>
      </div>
    </div>
    <div
      v-if="showCalDefault"
      class="cal_default"
      @click="EditContainer?.focus()"
    >
      留下你的想法吧~
    </div>

    <div class="cal_submit" @click="submit">
      发送
    </div>
    <div ref="calPreview" class="cal_preview">
      点击预览哦
    </div>
  </div>
</template>
<script setup lang='ts'>

import { onMounted, reactive, ref } from 'vue';
import { getUserList, getEmojiList, getTreeData } from '../api/index';
import { CalTag, type User, type Emoji, SPAN_DATA_SET, IMG_DATA_SET } from '../types/index';
import { parseNode, generateNode, createCalTag, getRange, generateImgName } from '../utils/index';
const EditContainer = ref<HTMLElement | null>(null);
const CalTips = ref<HTMLElement | null>(null);
const calPreview = ref<HTMLElement | null>(null);
const selectActiveIndex = ref(-1);
const showEmoji = ref(false);
const showCalDefault = ref(true);
const tipsEmojiList = ref<Emoji[]>([]);
const tipsAtmention = reactive<{ showTips: boolean; tipsArr: User[]; positionLeft: number; positionTop: number }>({
  showTips: false,
  tipsArr: [],
  positionLeft: 0,
  positionTop: 0,
});

const triggerMatchKeyList = ['ArrowLeft', 'ArrowRight'];
const interceptkeyList = ['ArrowUp', 'ArrowDown', 'Enter'];
let curAtIndex: number = -1;
let curCalRange: Range | null = null;

const submit = () => {
  const EditDom = EditContainer.value as HTMLElement;
  const content = EditDom.textContent?.trim();
  if (!content) return;
  const { rootNode, toVerifyDataArr } = parseNode(EditDom);

  getTreeData({ rootNode, verifiedArr: toVerifyDataArr, content }).then(({ matchResult, rootNode }) => {
    if (rootNode) {
      const nodeEle = generateNode(rootNode, matchResult);

      if (calPreview.value) {
        calPreview.value.innerHTML = nodeEle instanceof HTMLElement ? nodeEle.innerHTML : nodeEle.textContent || '';
      }
    }
  });
};
function triggerEmoji() {
  showEmoji.value = true;
  EditContainer.value?.focus();
};
function chooseEmoji(index: number) {
  EditContainer.value?.focus();
  const emoji = tipsEmojiList.value[index];
  const imgTag = createCalTag({
    tag: CalTag.IMG,
    attributes: {
      src: emoji.url,
      [IMG_DATA_SET]: emoji.name,
    },
    className: 'cal_emoji-img',
    content: generateImgName(emoji.name),
  });
  const range = getRange();

  if (range) {
    range.deleteContents();
    range.insertNode(imgTag);
    range.setStartAfter(imgTag);
    range.collapse();
    curCalRange = range.cloneRange();
    showEmoji.value = false;
    showCalDefault.value = false;
  }
};

function matchAt(): void {
  // editDom为外层的可编辑div
  const editDom = EditContainer.value as HTMLElement;
  // 判断是否显示默认占位符('留下你的想法吧'这个div)
  showCalDefault.value = !editDom.textContent;
  let caretBeforeStr = '';
  const range = getRange();
  if (range) {
    // 判断光标所在是不是text节点,不然删出span标签右侧元素后range.startContainer会是父元素，触发@判断
    if (!(range.startContainer instanceof Text)) return;
    // 截取光标所在起始文本容器位置字符串到光标当前闪烁点处的字符串
    caretBeforeStr = range.startContainer.textContent?.slice(0, range.startOffset) || '';
    // 从后往前寻找最近一个@符号
    const lastAtIndex = caretBeforeStr.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      // 截取@之后的字符
      const searchName = caretBeforeStr.slice(lastAtIndex + 1);
      // 判断是否含有空格，有空格认为不at了
      if (searchName.includes(' ')) {
        curAtIndex = -1;
        return;
      }
      // 保存当前@所在光标容器内的索引
      curAtIndex = lastAtIndex;
      // 设置用户列表唤起位置，同时唤起用户列表
      const { left, top } = getAtListPosition(range);
      tipsAtmention.positionLeft = left;
      tipsAtmention.positionTop = top;
      tipsAtmention.showTips = true;

      // 模糊查询匹配用户名
      getUserList(searchName).then((res) => {
        tipsAtmention.tipsArr = res;

        if (res.length > 0) {
          selectActiveIndex.value = Math.min(tipsAtmention.tipsArr.length - 1, selectActiveIndex.value);
        } else {
          tipsAtmention.showTips = false;
        }
      });
    } else {
      tipsAtmention.showTips = false;
      curAtIndex = -1;
    }
  }
};
function getAtListPosition(range: Range): { left: number; top: number } {
  // 获取光标位置相对于视口的偏移量

  const { left, top } = range.getBoundingClientRect();
  // console.log('left , top', `${left} , ${top}`);

  const editDom = EditContainer.value as HTMLElement;
  const { left: eLeft, top: eTop } = editDom.getBoundingClientRect();
  const basicHeight = editDom.clientHeight;
  // console.log('eLeft , eTop', `${eLeft} , ${eTop}`);
  return {
    left: left - eLeft,
    top: Math.max(0, Math.min(top - eTop, basicHeight)),
  };
};

function handleChooseUser(index: number): void {
  const user = tipsAtmention.tipsArr[index];
  const range = getRange();
  if (curAtIndex !== -1 && curCalRange && range) {
    const len = Number(curCalRange.startContainer.textContent?.length);
    const endLen = Math.min(curAtIndex + user.name.length + 1, len);
    // range在哪不重要，重要的是caretMark.startContainer在哪，选中的就是这个节点
    range.setStart(curCalRange.startContainer, curAtIndex);
    range.setEnd(curCalRange.startContainer, endLen);
    range.deleteContents();
    const prefixText = new Text('\u00A0');
    const subffixText = new Text('\u00A0');
    const eleNode = createCalTag({
      tag: CalTag.SPAN,
      attributes: {
        [SPAN_DATA_SET]: user.id,
        contentEditable: false,
      },
      className: 'cal_view-tag',
      content: '@' + user.name,
    });
    // 插入后缀占位节点，解决@xxx无法从右往左选中
    range.insertNode(prefixText);
    range.setStartAfter(prefixText);
    range.insertNode(eleNode);
    range.setStartAfter(eleNode);
    // 插入后缀占位节点，解决@xxx无法从左往右选中
    range.insertNode(subffixText);
    range.setStartAfter(subffixText);
    range.collapse();
    // 更新保存当前range
    curCalRange = range.cloneRange();
    // 聚焦输入框
    EditContainer.value?.focus();
    selectActiveIndex.value = -1;
    tipsAtmention.showTips = false;
    curAtIndex = -1;
  }
};
function calFocus() {
  const range = getRange();
  if (range && curCalRange) {
    range.setStart(curCalRange.startContainer, curCalRange.startOffset);
    range.setEnd(curCalRange.endContainer, curCalRange.endOffset);
  }
};
function calBlur(): void {
  const range = getRange();
  if (range) {
    curCalRange = range.cloneRange();
    // console.log('失焦', range.cloneRange());
  }
};

function hanldeMove(): void {
  // 获取外层容器
  const WrapperEle = CalTips.value as HTMLElement;
  const ItemEleArr = WrapperEle.querySelectorAll('.cal_tips-wrapper-item');
  // 或许当前选中的item
  const ItemEle = ItemEleArr[selectActiveIndex.value] as HTMLElement;
  const itemTop = ItemEle.offsetTop;
  const itemHeight = ItemEle.offsetHeight;
  const wrapperHeight = WrapperEle.clientHeight;
  const wrapperTop = WrapperEle.scrollTop;

  if (wrapperHeight + wrapperTop <= itemTop + itemHeight) {
    // 滑的太少了
    WrapperEle.scrollTop = itemTop + itemHeight - wrapperHeight;
  }
  if (itemTop < wrapperTop) {
    // 滑过头了
    WrapperEle.scrollTop = itemTop;
  }
};
function hanldeKeyDown(e: KeyboardEvent): void {
  // 判断是否是左右箭头，触发匹配@
  if (triggerMatchKeyList.includes(e.key)) {
    // 光标还未更新,光标更新后再触发
    setTimeout(() => {
      matchAt();
    });
    return;
  }
  // 判断用户列表展示且键盘值为 上下箭头和回车
  if (!tipsAtmention.showTips || !interceptkeyList.includes(e.key)) return;
  e.preventDefault();
  e.stopPropagation();

  switch (e.key) {
    // eslint-disable-next-line @stylistic/quotes
    case "ArrowDown":
      if (selectActiveIndex.value + 1 < tipsAtmention.tipsArr.length) {
        selectActiveIndex.value++;
        hanldeMove();
      }
      break;
    case 'ArrowUp':
      if (selectActiveIndex.value - 1 >= 0) {
        selectActiveIndex.value--;
        hanldeMove();
      }
      break;
    case 'Enter':
      EditContainer.value?.blur();
      handleChooseUser(selectActiveIndex.value);
      break;
  }
};
const emojiModelStop = (e: Event): void => {
  e.stopPropagation();
};
const tipsModelStop = (e: Event): void => {
  e.stopPropagation();
};
const initCal = () => {
  const calEle = EditContainer.value as HTMLElement;

  calEle.addEventListener('paste', (e) => {
    e.preventDefault();
    const range = getRange();
    if (range) {
      const clipboardData = e.clipboardData;
      const pastedHtml = clipboardData?.getData('text/html') || clipboardData?.getData('text/plain') || '';
      // 浏览器默认包裹两个注释节点，需要提取包裹的字符串
      const regex = /<!--StartFragment-->([\s\S]*?)<!--EndFragment-->/;
      const match = pastedHtml.match(regex);

      // 提取有效内容（如果匹配成功则取中间部分，否则使用原始内容）
      const rawHtml = match ? match[1] : pastedHtml;
      const container = document.createElement('div');

      container.innerHTML = rawHtml;
      const { rootNode } = parseNode(container);

      const newContainer = generateNode(rootNode);
      const fragment = document.createDocumentFragment();
      // 不能使用for循环从前往后遍历，因为如果文档中已存在给定节点，则将其从当前位置移动到新位置，节点会移动
      while (newContainer.firstChild) {
        fragment.appendChild(newContainer.firstChild);
      }

      const lastChild = fragment.lastChild;
      range.deleteContents();
      range.insertNode(fragment);
      if (lastChild) {
        range.setStartAfter(lastChild);
        showCalDefault.value = false;
      }

      range.collapse(true);
    }
  });
  calEle.addEventListener('copy', (e: ClipboardEvent) => {
    e.preventDefault();
    const range = getRange();
    if (range) {
      const container = document.createElement('div');
      container.appendChild(range.cloneContents());
      e.clipboardData?.setData('text/html', container.innerHTML);
      e.clipboardData?.setData('text/plain', container.textContent || '');
    }
  });

  calEle?.addEventListener('dragstart', (e) => {
    // 防止文字拖动样式bug
    e.preventDefault();
  });
  calEle?.addEventListener('drop', (e) => {
    // 防止文字拖动样式bug
    e.preventDefault();
  });
  document.addEventListener('click', () => {
    showEmoji.value = false;
    tipsAtmention.showTips = false;
  });
};
onMounted(() => {
  initCal();
  getEmojiList().then((res) => {
    tipsEmojiList.value = res;
  });
});

</script>
<style  lang="less" scoped>

.cal{
  position: relative;
  width: 400px;
  height: 100px;
  margin-left: 100px;
  margin-top: 100px;

    &_view,&_preview{
        width: 100%;
        height: 100%;
        padding: 16px;
        box-sizing: border-box;
        text-align: left;
        overflow:auto;
        word-break: break-all;
        line-height: 24px;
        border-radius: 8px;
        background-color: #FFF;
        border: 1px solid rgb(193, 193, 193);

    }
    &_emoji{
      position: relative;
      width: 100%;
      display: flex;
      justify-content: flex-end;
      &-entry{
        position: relative;
        right: 0;
        padding: 4px;
        display: flex;
        align-items: center;
        img{
          width: 24px;
          height: 24px;
        }
      }
      &-container{
        position: absolute;
        bottom: 32px;
        padding: 8px;
        border: 1px solid #e2e2e2;
        border-radius: 8px;
        transform: translate(50%, 0);
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        background-color: #feffef;
        &-item{
          width: 32px;
          height: 32px;
          img{
            width: 100%;
            height: 100%;
          }
        }
      }
    }
    &_tips{
      top: 0;
      position: absolute;
      width: 200px;
      max-height: 180px;
      border-radius: 8px;
      overflow:auto;
      padding: 4px;
      line-height: 32px;
      border: 1px solid #959595;
      background-color: #fbffff;
      color: #3b3a3a;

      &-wrapper{
        &-item{
          height: 36px;
        border-bottom: 1px solid #e2e2e2;
        padding:4px ;
          display: flex;
          align-items: center;
          img{
            width: 32px;
            height: 32px;
            margin-right: 8px;
            border-radius: 4px;
            border: 1px solid #e4e4e4;

          }
        &:hover{
          background-color: #e2eefa;
        }

      }
      &-default{
        padding:0 4px ;
        font-size: 12px;
        color: #8c8b8b;
      }
      }

    }
    &_default{
      position: absolute;
      left: 16px;
      top: 16px;
      color: #8c8b8b;
    }
    &_submit{
      width: 56px;
      margin: 16px 0;
      padding: 4px;
      text-align: center;
      border-radius: 8px;
      color: #FFF;
      border: 1px solid #89d4ff;
      background-color: #0099F2;
      cursor: pointer;
      &:active{
        background-color: #89d4ff;
      }
    }
}

</style>
<style  lang="less">
  .cal_view-tag{
    color:  #0076eb;
  }
  .cal_emoji-img{
    width: 20px;
    height: 20px;
    margin: 0 2px;
    vertical-align: sub;
  }

</style>
