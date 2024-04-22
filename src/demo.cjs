const path = require('path');

function getDirectoryFromMetaUrl(metaUrl) {
    // 使用 URL 对象解析 metaUrl
    const url = new URL(metaUrl);

    // 获取路径部分
    const filePath = url.pathname;

    // 在 Windows 系统上，路径可能以 '/' 开头，需要特殊处理
    const correctedPath = path.normalize(filePath).replace(/^(\/*)/, '');

    // 获取去掉文件名的目录路径
    const directoryPath = path.dirname(correctedPath);

    // 将目录路径重新格式化为 URL 形式
    return `file:/${directoryPath}`;
}

// 示例使用
const metaUrl = 'file:/Users/txx/Desktop/github/OpenWhisper/.vite/build/main.js';
console.log(getDirectoryFromMetaUrl(metaUrl));
