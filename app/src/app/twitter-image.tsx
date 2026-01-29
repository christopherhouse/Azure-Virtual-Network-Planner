import { ImageResponse } from 'next/og';

/**
 * Twitter Card Image Generation
 *
 * Twitter has specific image requirements, this creates an optimized version.
 * Size: 1200x600 (Twitter summary_large_image)
 */

export const runtime = 'edge';
export const alt = 'Azure VNet Planner - Free Azure Virtual Network Planning Tool';
export const size = {
  width: 1200,
  height: 600,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Azure-style decorative elements */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,120,212,0.3) 0%, transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-120px',
          left: '-120px',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,188,212,0.2) 0%, transparent 70%)',
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #0078d4, #00bcd4)',
            backgroundClip: 'text',
            color: 'transparent',
            margin: '0 0 16px 0',
            lineHeight: 1.1,
          }}
        >
          Azure VNet Planner
        </h1>

        <p
          style={{
            fontSize: '28px',
            color: '#94a3b8',
            margin: '0 0 32px 0',
            textAlign: 'center',
          }}
        >
          Plan • Calculate • Export to ARM, Bicep & Terraform
        </p>

        {/* Feature badges */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {['Subnet Calculator', 'CIDR Planning', 'Free & No Sign-up'].map(feature => (
            <div
              key={feature}
              style={{
                padding: '10px 20px',
                background: 'rgba(0, 120, 212, 0.15)',
                border: '1px solid rgba(0, 120, 212, 0.3)',
                borderRadius: '9999px',
                color: '#60a5fa',
                fontSize: '18px',
                fontWeight: 500,
              }}
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  );
}
