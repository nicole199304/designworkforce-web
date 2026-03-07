export interface CategoryNode {
  label: string;
  children?: CategoryNode[];
}

export const CATEGORY_HIERARCHY: CategoryNode[] = [
  {
    label: '礼物、霸屏、牵手',
    children: [
      { label: '低档', children: [{ label: '1-3秒' }, { label: '3-5秒' }] },
      { label: '中档', children: [{ label: '5-7秒' }, { label: '7-9秒' }] },
      {
        label: '高档',
        children: [
          { label: '9-10秒、70%-100%' },
          { label: '10-11秒、70%-100%' },
          { label: '11-12秒、70%-100%' },
          { label: '12-13秒、70%-100%' },
          { label: '13-14秒、70%-100%' },
          { label: '14+秒、100%' },
        ],
      },
      { label: '模板礼物' },
    ],
  },
  {
    label: '道具',
    children: [
      { label: '基础道具', children: [{ label: '静态' }, { label: '动态' }] },
      { label: '高级道具', children: [{ label: '复杂动效' }] },
    ],
  },
  {
    label: '视觉',
    children: [
      { label: 'H5', children: [{ label: '1个页面' }, { label: '2个页面' }, { label: '3个页面+' }] },
      { label: '海报', children: [{ label: '单张' }, { label: '系列' }] },
    ],
  },
  {
    label: '产品设计',
    children: [
      { label: 'UI设计', children: [{ label: '移动端' }, { label: 'Web端' }] },
      { label: '交互原型' },
    ],
  },
  {
    label: '游戏',
    children: [
      { label: '小游戏', children: [{ label: '简单逻辑' }, { label: '复杂逻辑' }] },
      { label: '游戏UI' },
    ],
  },
];

export const BUSINESS_TYPES = [
  '不夜',
  'wowchat',
  '电商',
  '社交',
  '游戏',
  '内容',
  '工具',
  '其他'
];
