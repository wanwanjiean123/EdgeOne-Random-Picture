import './globals.css';

export const metadata = {
  title: 'EdgeOne Random Picture',
  description: '基于 Tencent Cloud EdgeOne Pages 构建的高性能随机图片分发系统。',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
