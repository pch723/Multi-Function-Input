import { CalTag, type CreateTagOption, type ToVerifyData, TreeNode, type TreeOption, SPAN_DATA_SET, IMG_DATA_SET } from '../types/index';
const nodeIdGenerater: {
  getNodeId(): number;
  init(): void;
} = (function () {
  let num = 1000;
  return {
    getNodeId() {
      return num++;
    },
    init() {
      num = 1000;
    },
  };
})();
export function generateImgName(name: string): string {
  return `[${name}]`;
}
export function parseNode(node: Node): { toVerifyDataArr: ToVerifyData[]; rootNode: TreeNode } {
  const toVerifyDataArr: ToVerifyData[] = [];
  // 限制nodeType为 Element元素和文本节点
  const limitNodeTypeArr = [1, 3];
  nodeIdGenerater.init();
  const generateTree = (node: Node): TreeNode => {
    const rootNode = new TreeNode(
      {
        nodeId: nodeIdGenerater.getNodeId(),
        nodeName: node.nodeName,
        textContent: node.textContent || '',
        children: [],
        attributes: {},
      },
    );
    if (!limitNodeTypeArr.includes(node.nodeType)) {
      rootNode.textContent = '';
    }
    switch (node.nodeName) {
      case 'DIV':
        {
          const childrenNodeList = node.childNodes;

          if (childrenNodeList.length > 0) {
            // lastTextNode用于合并相邻的text节点
            let lastTextNode: TreeOption & { index: number } | null = null;
            for (let i = 0; i < childrenNodeList.length; i++) {
              const childNode = childrenNodeList[i];
              const generatedNode = generateTree(childNode);
              if (generatedNode.nodeName === '#text') {
                if (!lastTextNode || i - lastTextNode.index !== 1) {
                  lastTextNode = { ...generatedNode, index: i };
                } else {
                  lastTextNode.nodeId = generatedNode.nodeId;
                  lastTextNode.textContent += generatedNode.textContent;
                  lastTextNode.index = i;
                }
                if (i === childrenNodeList.length - 1) {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { index: _, ...resNode } = lastTextNode;

                  rootNode.children.push(resNode);
                }
              } else {
                if (lastTextNode) {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { index: _, ...resNode } = lastTextNode;

                  rootNode.children.push(resNode);
                  lastTextNode = null;
                }
                rootNode.children.push(generatedNode);
              }
            }
          }
        }
        break;
      case 'SPAN':
        {
          const spanNode = node as HTMLSpanElement;
          const atUserId = spanNode.attributes.getNamedItem(SPAN_DATA_SET)?.value;
          const nodeContent = rootNode.textContent;
          if (atUserId && nodeContent) {
            rootNode.textContent = nodeContent.trim();
            rootNode.attributes = { [SPAN_DATA_SET]: atUserId, contenteditable: false };
            toVerifyDataArr.push({
              tagName: CalTag.SPAN,
              nodeId: rootNode.nodeId,
              targetId: atUserId,
              targetValue: nodeContent.slice(1).trim(),
            });
          } else {
            rootNode.nodeName = '#text';
          }
        }
        break;
      case 'IMG':
        {
          const imgNode = node as HTMLImageElement;
          const imgSrc = imgNode.attributes.getNamedItem('src')?.value;
          const imgName = imgNode.attributes.getNamedItem(IMG_DATA_SET)?.value || '';
          rootNode.textContent = generateImgName(imgName);
          if (imgSrc && imgName) {
            rootNode.attributes = { src: imgSrc, [IMG_DATA_SET]: imgName };
            toVerifyDataArr.push({
              tagName: CalTag.IMG,
              nodeId: rootNode.nodeId,
              targetId: imgSrc,
              targetValue: imgName,
            });
          } else {
            rootNode.nodeName = '#text';
          }
        }
        break;
      default: {
        rootNode.nodeName = '#text';
      }
    }
    return rootNode;
  };
  const rootNode = generateTree(node);
  console.log('生成的rootNode', rootNode);

  return {
    toVerifyDataArr, rootNode,
  };
};

export function generateNode(rootNode: TreeNode, validNodeIdArr?: number[]): HTMLElement | Text {
  switch (rootNode.nodeName) {
    case 'DIV':
    {
      const divDom = document.createElement('div');
      const childNodeList = rootNode.children;
      if (childNodeList.length > 0) {
        for (let i = 0; i < childNodeList.length; i++) {
          const childNode = childNodeList[i];
          divDom.appendChild(generateNode(childNode, validNodeIdArr));
        }
      }
      return divDom;
    }
    case 'SPAN':
    {
      const tagOption: CreateTagOption = {
        tag: CalTag.SPAN,
        attributes: rootNode.attributes,
        className: 'cal_view-tag',
        content: rootNode.textContent,
      };
      if (validNodeIdArr && !validNodeIdArr.includes(rootNode.nodeId)) {
        tagOption.tag = CalTag.TEXT;
      }
      const spanDom = createCalTag(tagOption);
      return spanDom;
    }
    case 'IMG':
    {
      const tagOption: CreateTagOption = {
        tag: CalTag.IMG,
        attributes: rootNode.attributes,
        className: 'cal_emoji-img',
        content: rootNode.textContent,
      };
      if (validNodeIdArr && !validNodeIdArr.includes(rootNode.nodeId)) {
        tagOption.tag = CalTag.TEXT;
      }
      const imgDom = createCalTag(tagOption);
      return imgDom;
    }
    default: {
      return createCalTag({ tag: 'text', content: rootNode.textContent });
    }
  }
};

export function replaceWhiteSpace(str: string) {
  // 替换前导空格
  str = str.replace(/^ +/g, (match) => match.replace(/ /g, '\u00A0'));
  // 替换尾随空格
  str = str.replace(/ +$/g, (match) => match.replace(/ /g, '\u00A0'));
  return str;
}
export function createCalTag(option: CreateTagOption): HTMLElement | Text {
  if (option.tag === 'text') {
    const content = option.content || '';
    return new Text(content);
  }
  // 普通element元素
  const ele = document.createElement(option.tag);
  if (option.className) {
    ele.className = option.className;
  }
  if (option.attributes) {
    Object.entries(option.attributes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        ele.setAttribute(key, String(value));
      }
    });
  }
  if (option.content) {
    ele.textContent = `${option.content}`;
  }

  return ele;
};

export function getRange(): Range | null {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    return range;
  }
  return null;
}
