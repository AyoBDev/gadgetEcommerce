import Box from '@mui/material/Box';

/**
 * Frosted "studio" glow layer used on the near-black hero band. Renders an
 * aria-hidden, absolutely-positioned diffusion wash: red-tinted glows on a
 * dark base with a subtle top bloom. Place inside a position:relative
 * container (the night-toned band).
 */
export function StudioWash() {
  return (
    <Box aria-hidden sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* Left warm-red glow */}
      <Box sx={{
        position: 'absolute', left: '-15%', top: '10%', width: '55%', height: '90%',
        background: 'radial-gradient(60% 55% at 55% 45%, rgba(225,35,42,0.22) 0%, rgba(225,35,42,0.10) 35%, rgba(225,35,42,0) 72%)',
        filter: 'blur(40px)', borderRadius: '50%', transform: 'rotate(-8deg)',
      }} />
      {/* Right cool milky diffusion */}
      <Box sx={{
        position: 'absolute', right: '-18%', top: '20%', width: '58%', height: '92%',
        background: 'radial-gradient(58% 52% at 42% 50%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.03) 32%, rgba(255,255,255,0) 72%)',
        filter: 'blur(44px)', borderRadius: '50%', transform: 'rotate(10deg)',
      }} />
      {/* Top bloom — brightens the upper band to feel high-key */}
      <Box sx={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(70% 40% at 50% 0%, rgba(255,255,255,0.06), transparent 70%)',
      }} />
      {/* Bottom red-tint deepen — anchors the section */}
      <Box sx={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(80% 40% at 50% 100%, rgba(225,35,42,0.10), transparent 70%)',
      }} />
    </Box>
  );
}
