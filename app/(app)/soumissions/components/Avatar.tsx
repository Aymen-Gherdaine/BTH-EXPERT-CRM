"use client";

const AVATAR_COLORS = ["#1a2e1e","#2d5a3d","#1a3a4e","#3d6b4f","#4a3a1e","#2a4a3e","#3a2e4e"];
const avatarCache: Record<string, string> = {};

function avatarColor(name: string): string {
  if (avatarCache[name]) return avatarCache[name];
  const h = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return (avatarCache[name] = AVATAR_COLORS[h % AVATAR_COLORS.length]);
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: avatarColor(name || "?"),
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 700, fontSize: Math.floor(size * 0.38),
      flexShrink: 0, letterSpacing: 0,
    }}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}
