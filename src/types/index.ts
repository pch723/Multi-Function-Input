export const CalTag = {
  SPAN: 'span',
  IMG: 'img',
  TEXT: 'text',
} as const;
export const SPAN_DATA_SET = 'data-user-id';
export const IMG_DATA_SET = 'data-img-name';
type CalTagType = typeof CalTag[keyof typeof CalTag];
export interface User {
  name: string;
  id: string;
  avatar: string;
};
export interface Emoji {
  id: string;
  name: string;
  url: string;
};
export interface CreateTagOption {
  tag: CalTagType;
  attributes?: Record<string, unknown>;
  content?: string;
  className?: string;
};

export interface TreeOption {
  nodeId: number;
  nodeName: string;
  textContent: string;
  children: TreeNode[];
  attributes: Record<string, unknown>;
}
export class TreeNode {
  // 节点标识，由nodeIdGenerater生成
  public nodeId;
  // 节点名称，node.nodeName
  public nodeName;
  // 节点内容，node.textContent
  public textContent;
  // 孩子节点
  public children;
  // 节点attributes属性，只会筛选有必要的
  public attributes;

  constructor(option: TreeOption) {
    this.nodeId = option.nodeId;
    this.nodeName = option.nodeName;
    this.textContent = option.textContent;
    this.attributes = option.attributes || {};
    this.children = option.children;
  }
}
export interface ToVerifyData {
  nodeId: number;
  targetId: string;
  targetValue: string;
  tagName: CalTagType;
}
export interface submitOption {
  rootNode: TreeNode;
  verifiedArr: ToVerifyData[];
  content: string;
}
