// app/(auth)/auth/discord/callback/page.tsx
// 서버 컴포넌트입니다.

export const dynamic = "force-dynamic";

import ClientCallback from "./ClientCallback";

export default function Page() {
  return <ClientCallback />;
}
