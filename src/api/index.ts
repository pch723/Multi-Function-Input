import { type User, type Emoji, type TreeNode, type submitOption, CalTag } from '../types/index';
const userAllList: User[] = [
  { name: '李小萌', id: '001', avatar: '/src/assets/avatar/001.jpg' },
  { name: '大春', id: '002', avatar: '/src/assets/avatar/002.jpg' },
  { name: '小萌', id: '003', avatar: '/src/assets/avatar/003.jpg' },
  { name: '恨不得', id: '004', avatar: '/src/assets/avatar/004.jpg' },
  { name: '小无法萌', id: '005', avatar: '/src/assets/avatar/005.jpg' },
  { name: 'gwgw', id: '006', avatar: '/src/assets/avatar/006.jpg' },
  { name: 'fwegw萌', id: '007', avatar: '/src/assets/avatar/003.jpg' },
  { name: '小gw萌', id: '008', avatar: '/src/assets/avatar/005.jpg' },
  { name: '小米', id: '009', avatar: '/src/assets/avatar/004.jpg' },
  { name: '小gg萌', id: '0010', avatar: '/src/assets/avatar/002.jpg' },
  { name: '大德w', id: '0011', avatar: '/src/assets/avatar/006.jpg' },
  { name: 'ggw', id: '0012', avatar: '/src/assets/avatar/001.jpg' },
  { name: '我的钱f', id: '0013', avatar: '/src/assets/avatar/004.jpg' },
  { name: 'vbrrbe', id: '0014', avatar: '/src/assets/avatar/003.jpg' },
];

const emojiList: Emoji[] = [
  { name: '傲娇', id: '0001', url: '/src/assets/emoji/EMOJI-1.png' },
  { name: '尴尬', id: '0002', url: '/src/assets/emoji/EMOJI-2.png' },
  { name: '震惊', id: '0003', url: '/src/assets/emoji/EMOJI-09.png' },
  { name: '馋了', id: '0004', url: '/src/assets/emoji/EMOJI-13.png' },
  { name: '星星眼', id: '0005', url: '/src/assets/emoji/EMOJI-44.png' },
  { name: '流汗', id: '0006', url: '/src/assets/emoji/EMOJI-79.png' },
  { name: '爱心', id: '0007', url: '/src/assets/emoji/EMOJI-95.png' },
];

export function getUserList(name: string): Promise<User[]> {
  return new Promise((resolve) => {
    const regex = new RegExp(name, 'i');
    setTimeout(() => {
      resolve(userAllList.filter((item) => regex.test(item.name)));
    }, 500);
  });
};
export function getEmojiList(): Promise<Emoji[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(emojiList);
    }, 500);
  });
};

export function getTreeData(option: submitOption): Promise<{
  matchResult: number[];
  rootNode: TreeNode | null;
}> {
  console.log('接收到请求', option);

  const { verifiedArr, rootNode, content } = option;

  const res: number[] = [];
  verifiedArr.forEach((item) => {
    if (item.tagName === CalTag.SPAN) {
      const user = userAllList.find((ele) => ele.id === item.targetId);

      if (user && user.name === item.targetValue) {
        res.push(item.nodeId);
      }
    }
    if (item.tagName === CalTag.IMG) {
      const emoji = emojiList.find((ele) => ele.url === item.targetId);
      if (emoji && emoji.name === item.targetValue) {
        res.push(item.nodeId);
      }
    }
  });
  // 对content审核,敏感词汇等等...，这里就随意简化一下,判空
  return new Promise((resolve) => {
    resolve({
      matchResult: content ? res : [],
      rootNode: content ? rootNode : null,
    });
  });
}
