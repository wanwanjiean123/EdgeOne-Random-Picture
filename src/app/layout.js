import './globals.css';

export const metadata = {
  title: 'EdgeOne Random Picture',
  description: '基于 Tencent Cloud EdgeOne Pages 构建的高性能随机图片分发系统。',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
